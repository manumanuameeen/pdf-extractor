import type { UploadedPdfInput, ExtractPdfResponseDto, UploadPdfResponseDto } from '../mappers/pdfMapper.js';
import type { PdfRecord, PublicUser, UserRecord } from '../types/models.js';

export interface IUserMapper {
  toPublicUser(user: UserRecord): PublicUser;
}

export interface IPdfMapper {
  toRecord(input: UploadedPdfInput): PdfRecord;
  toUploadResponse(record: PdfRecord): UploadPdfResponseDto;
  toExtractResponse(fileName: string, pageCount: number): ExtractPdfResponseDto;
}
export type ErrorResponseDto = {
  error: string;
};
