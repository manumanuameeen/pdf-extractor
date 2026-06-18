import type { SavedPdf } from '../types'
import http from './http'
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api'

type PdfRecordResponse = {
  id: string
  originalName: string
  size: number
  pageCount: number
  createdAt: string
}

export async function getUserPdfs(): Promise<SavedPdf[]> {
  const response = await http.get<PdfRecordResponse[]>(API_ENDPOINTS.PDFS.LIST)
  return response.data.map((pdf) => ({
    id: pdf.id,
    name: pdf.originalName,
    size: pdf.size,
    pageCount: pdf.pageCount,
    previewUrl: `${API_BASE_URL}${API_ENDPOINTS.PDFS.BY_ID(pdf.id)}`,
    createdAt: pdf.createdAt,
  }))
}

export async function deletePdf(pdfId: string): Promise<void> {
  await http.delete(API_ENDPOINTS.PDFS.DELETE(pdfId))
}
