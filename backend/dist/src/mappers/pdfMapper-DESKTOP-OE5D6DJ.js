"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfMapper = void 0;
const routes_js_1 = require("../constants/routes.js");
class PdfMapper {
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
            previewUrl: `${routes_js_1.API_ROUTES.PDF_BASE}/${record.id}`
        };
    }
    toExtractResponse(fileName, pageCount) {
        return {
            fileName,
            pageCount,
            downloadUrl: `${routes_js_1.API_ROUTES.OUTPUTS_BASE}/${fileName}`
        };
    }
}
exports.PdfMapper = PdfMapper;
exports.default = new PdfMapper();
