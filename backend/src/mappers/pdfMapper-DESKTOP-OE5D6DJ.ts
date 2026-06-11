import { API_ROUTES } from '../constants/routes.js';
import type { IPdfMapper } from '../contracts/mappers.js';
import type { PdfRecord } from '../types/models.js';

export type UploadedPdfInput = {
  id: string;
  userId: string;
  originalName: string;
  size: number;
  pageCount: number;
  path: string;
};

export type UploadPdfResponseDto = {
  id: string;
  name: string;
  size: number;
  pageCount: number;
  previewUrl: string;
};

export type ExtractPdfResponseDto = {
  fileName: string;
  pageCount: number;
  downloadUrl: string;
};

export class PdfMapper implements IPdfMapper {
  toRecord(input: UploadedPdfInput): PdfRecord {
    return {
      id: input.id,
      userId: input.userId,
      originalName: input.originalName,
      size: input.size,
      pageCount: input.pageCount,
      path: input.path,
      createdAt: new Date().toISOString()
    };
  }

  toUploadResponse(record: PdfRecord): UploadPdfResponseDto {
    return {
      id: record.id,
      name: record.originalName,
      size: record.size,
      pageCount: record.pageCount,
      previewUrl: `${API_ROUTES.PDF_BASE}/${record.id}`
    };
  }

  toExtractResponse(fileName: string, pageCount: number): ExtractPdfResponseDto {
    return {
      fileName,
      pageCount,
      downloadUrl: `${API_ROUTES.OUTPUTS_BASE}/${fileName}`
    };
  }
}

export default new PdfMapper();
