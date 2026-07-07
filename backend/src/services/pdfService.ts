import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { PDFDocument } from 'pdf-lib';
import { PDF_MESSAGES, SYSTEM_MESSAGES } from '../constants/messages.js';
import type { IPdfService, PdfMetadata, IPdfRepository } from '../contracts/index.js';
import type { PdfRecord } from '../types/models.js';

/**
 * ARCHITECTURE: SERVICE LAYER
 * Purpose: Keep PDF business logic independent from Express HTTP details.
 */
export class PdfService implements IPdfService {
  constructor(private readonly _repository: IPdfRepository) { }

  /**
   * Extracts selected pages and creates a new PDF.
   * pageIndices are zero-based because pdf-lib uses zero-based page positions.
   * Supports rearrangement based on the order of indices in the array.
   */
  async extractPages(sourcePath: string, pageIndices: number[]): Promise<Buffer> {
    try {
      await this.validatePageRange(sourcePath, pageIndices);

      const sourceBytes = await fs.readFile(sourcePath);
      const sourcePdf = await PDFDocument.load(sourceBytes);
      const outputPdf = await PDFDocument.create();

      // Rearrangement happens here: we copy and add pages in the order they appear in pageIndices
      for (const index of pageIndices) {
        const [copiedPage] = await outputPdf.copyPages(sourcePdf, [index]);
        outputPdf.addPage(copiedPage);
      }

      const pdfBytes = await outputPdf.save();
      return Buffer.from(pdfBytes);
    } catch (error) {
      const message = error instanceof Error ? error.message : SYSTEM_MESSAGES.UNKNOWN_PDF_ERROR;
      throw new Error(`${SYSTEM_MESSAGES.PDF_SERVICE_ERROR_PREFIX}: ${message}`);
    }
  }

  async validatePageRange(sourcePath: string, pageIndices: number[]): Promise<PdfMetadata> {
    if (!Array.isArray(pageIndices) || pageIndices.length === 0) {
      throw new Error(PDF_MESSAGES.SELECT_ONE_PAGE);
    }

    if (!pageIndices.every(Number.isInteger)) {
      throw new Error(PDF_MESSAGES.PAGE_INDICES_MUST_BE_WHOLE_NUMBERS);
    }

    const sourceBytes = await fs.readFile(sourcePath);
    const sourcePdf = await PDFDocument.load(sourceBytes);
    const pageCount = sourcePdf.getPageCount();
    const outOfRangePage = pageIndices.find((pageIndex) => pageIndex < 0 || pageIndex >= pageCount);

    if (outOfRangePage !== undefined) {
      throw new Error(PDF_MESSAGES.PAGE_OUT_OF_RANGE.replace('{page}', String(outOfRangePage + 1)));
    }

    return { pageCount };
  }

  async getMetadata(sourcePath: string): Promise<PdfMetadata> {
    const sourceBytes = await fs.readFile(sourcePath);
    const sourcePdf = await PDFDocument.load(sourceBytes);

    return {
      pageCount: sourcePdf.getPageCount()
    };
  }

  async savePdfRecord(userId: string, originalName: string, size: number, pageCount: number, path: string): Promise<PdfRecord> {
    const record: PdfRecord = {
      id: crypto.randomUUID(),
      userId,
      originalName,
      size,
      pageCount,
      path,
      createdAt: new Date().toISOString()
    };

    return await this._repository.save(record);
  }

  async getUserPdfs(userId: string): Promise<PdfRecord[]> {
    return await this._repository.findByUserId(userId);
  }

  async deleteUserPdf(id: string, userId: string): Promise<boolean> {
    const pdf = await this._repository.findOwnedByUser(id, userId);
    if (!pdf) {
      return false;
    }

    try {
      // Delete physical file
      await fs.unlink(pdf.path).catch(() => { });
      // Delete database record
      return await this._repository.delete(id);
    } catch (error) {
      console.error('Error deleting PDF:', error);
      return false;
    }
  }
}
