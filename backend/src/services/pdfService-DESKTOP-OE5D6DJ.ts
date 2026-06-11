import fs from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import { PDF_MESSAGES, SYSTEM_MESSAGES } from '../constants/messages.js';
import type { IPdfService, PdfMetadata } from '../contracts/services.js';

/**
 * ARCHITECTURE: SERVICE LAYER
 * Purpose: Keep PDF business logic independent from Express HTTP details.
 */
export class PdfService implements IPdfService {
  /**
   * Extracts selected pages and creates a new PDF.
   * pageIndices are zero-based because pdf-lib uses zero-based page positions.
   */
  async extractPages(sourcePath: string, pageIndices: number[]): Promise<Buffer> {
    try {
      await this.validatePageRange(sourcePath, pageIndices);

      const sourceBytes = await fs.readFile(sourcePath);
      const sourcePdf = await PDFDocument.load(sourceBytes);
      const outputPdf = await PDFDocument.create();
      const copiedPages = await outputPdf.copyPages(sourcePdf, pageIndices);

      copiedPages.forEach((page) => outputPdf.addPage(page));

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
}
