"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfService = void 0;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const pdf_lib_1 = require("pdf-lib");
const messages_js_1 = require("../constants/messages.js");
/**
 * ARCHITECTURE: SERVICE LAYER
 * Purpose: Keep PDF business logic independent from Express HTTP details.
 */
class PdfService {
    _repository;
    constructor(_repository) {
        this._repository = _repository;
    }
    /**
     * Extracts selected pages and creates a new PDF.
     * pageIndices are zero-based because pdf-lib uses zero-based page positions.
     * Supports rearrangement based on the order of indices in the array.
     */
    async extractPages(sourcePath, pageIndices) {
        try {
            await this.validatePageRange(sourcePath, pageIndices);
            const sourceBytes = await promises_1.default.readFile(sourcePath);
            const sourcePdf = await pdf_lib_1.PDFDocument.load(sourceBytes);
            const outputPdf = await pdf_lib_1.PDFDocument.create();
            // Rearrangement happens here: we copy and add pages in the order they appear in pageIndices
            for (const index of pageIndices) {
                const [copiedPage] = await outputPdf.copyPages(sourcePdf, [index]);
                outputPdf.addPage(copiedPage);
            }
            const pdfBytes = await outputPdf.save();
            return Buffer.from(pdfBytes);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : messages_js_1.SYSTEM_MESSAGES.UNKNOWN_PDF_ERROR;
            throw new Error(`${messages_js_1.SYSTEM_MESSAGES.PDF_SERVICE_ERROR_PREFIX}: ${message}`);
        }
    }
    async validatePageRange(sourcePath, pageIndices) {
        if (!Array.isArray(pageIndices) || pageIndices.length === 0) {
            throw new Error(messages_js_1.PDF_MESSAGES.SELECT_ONE_PAGE);
        }
        if (!pageIndices.every(Number.isInteger)) {
            throw new Error(messages_js_1.PDF_MESSAGES.PAGE_INDICES_MUST_BE_WHOLE_NUMBERS);
        }
        const sourceBytes = await promises_1.default.readFile(sourcePath);
        const sourcePdf = await pdf_lib_1.PDFDocument.load(sourceBytes);
        const pageCount = sourcePdf.getPageCount();
        const outOfRangePage = pageIndices.find((pageIndex) => pageIndex < 0 || pageIndex >= pageCount);
        if (outOfRangePage !== undefined) {
            throw new Error(messages_js_1.PDF_MESSAGES.PAGE_OUT_OF_RANGE.replace('{page}', String(outOfRangePage + 1)));
        }
        return { pageCount };
    }
    async getMetadata(sourcePath) {
        const sourceBytes = await promises_1.default.readFile(sourcePath);
        const sourcePdf = await pdf_lib_1.PDFDocument.load(sourceBytes);
        return {
            pageCount: sourcePdf.getPageCount()
        };
    }
    async savePdfRecord(userId, originalName, size, pageCount, path) {
        const record = {
            id: node_crypto_1.default.randomUUID(),
            userId,
            originalName,
            size,
            pageCount,
            path,
            createdAt: new Date().toISOString()
        };
        return await this._repository.save(record);
    }
    async getUserPdfs(userId) {
        return await this._repository.findByUserId(userId);
    }
    async deleteUserPdf(id, userId) {
        const pdf = await this._repository.findOwnedByUser(id, userId);
        if (!pdf) {
            return false;
        }
        try {
            // Delete physical file
            await promises_1.default.unlink(pdf.path).catch(() => { });
            // Delete database record
            return await this._repository.delete(id);
        }
        catch (error) {
            console.error('Error deleting PDF:', error);
            return false;
        }
    }
}
exports.PdfService = PdfService;
