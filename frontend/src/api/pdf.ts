import type { ExtractedPdf, SavedPdf, UploadedPdf } from '../types';
import apiClient from './client';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';

type PdfRecordResponse = {
  id: string;
  originalName: string;
  size: number;
  pageCount: number;
  createdAt: string;
};

export async function getUserPdfs(): Promise<SavedPdf[]> {
  const response = await apiClient.get<PdfRecordResponse[]>(API_ENDPOINTS.PDFS.LIST);
  return response.data.map((pdf) => ({
    id: pdf.id,
    name: pdf.originalName,
    size: pdf.size,
    pageCount: pdf.pageCount,
    previewUrl: `${API_BASE_URL}${API_ENDPOINTS.PDFS.BY_ID(pdf.id)}`,
    createdAt: pdf.createdAt,
  }));
}

export async function deletePdf(pdfId: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.PDFS.DELETE(pdfId));
}

export async function uploadPdf(
  file: File,
  onUploadProgress?: (progress: number) => void
): Promise<UploadedPdf> {
  const formData = new FormData();
  formData.append('pdf', file);

  const response = await apiClient.post<UploadedPdf>(API_ENDPOINTS.PDFS.UPLOAD, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (event.total) {
        onUploadProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    },
  });

  return response.data;
}

export async function extractPdf(pdfId: string, pages: number[]): Promise<ExtractedPdf> {
  const response = await apiClient.post<ExtractedPdf>(API_ENDPOINTS.PDFS.EXTRACT(pdfId), { pages });
  return response.data;
}
