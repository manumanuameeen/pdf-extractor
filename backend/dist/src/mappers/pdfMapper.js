import { API_ROUTES } from '../constants/routes.js';
export class PdfMapper {
    toRecord(input) {
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
    toUploadResponse(record) {
        return {
            id: record.id,
            name: record.originalName,
            size: record.size,
            pageCount: record.pageCount,
            previewUrl: `${API_ROUTES.PDF_BASE}/${record.id}`
        };
    }
    toExtractResponse(fileName, pageCount) {
        return {
            fileName,
            pageCount,
            downloadUrl: `${API_ROUTES.OUTPUTS_BASE}/${fileName}`
        };
    }
}
export default new PdfMapper();
