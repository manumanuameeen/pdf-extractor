"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfController = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const config_js_1 = require("../constants/config.js");
const messages_js_1 = require("../constants/messages.js");
const statusCodes_js_1 = require("../constants/statusCodes.js");
const responseSender_js_1 = require("../utils/responseSender.js");
class PdfController {
    _service;
    _repository;
    _validator;
    _mapper;
    constructor(_service, _repository, _validator, _mapper) {
        this._service = _service;
        this._repository = _repository;
        this._validator = _validator;
        this._mapper = _mapper;
    }
    uploadPdf = async (req, res, next) => {
        try {
            if (!req.file) {
                (0, responseSender_js_1.sendError)(res, statusCodes_js_1.STATUS_CODES.BAD_REQUEST, messages_js_1.PDF_MESSAGES.NO_FILE_UPLOADED);
                return;
            }
            const metadata = await this._service.getMetadata(req.file.path);
            const record = await this._service.savePdfRecord(req.user.userId, req.file.originalname, req.file.size, metadata.pageCount, req.file.path);
            (0, responseSender_js_1.sendSuccess)(res, statusCodes_js_1.STATUS_CODES.CREATED, this._mapper.toUploadResponse(record));
        }
        catch (error) {
            next(error);
        }
    };
    extractPdfPages = async (req, res, next) => {
        try {
            const pdfRecord = await this._repository.findOwnedByUser(req.params.id, req.user.userId);
            if (!pdfRecord || !(await this._fileExists(pdfRecord.path))) {
                (0, responseSender_js_1.sendError)(res, statusCodes_js_1.STATUS_CODES.NOT_FOUND, messages_js_1.PDF_MESSAGES.PDF_NOT_FOUND_REUPLOAD);
                return;
            }
            const dto = this._validator.validateExtractPages(req.body);
            const extractedPdf = await this._service.extractPages(pdfRecord.path, dto.pageIndices);
            const outputFileName = `${node_crypto_1.default.randomUUID()}${config_js_1.STORAGE.EXTRACTED_SUFFIX}`;
            const outputPath = this._getOutputPath(outputFileName);
            await promises_1.default.mkdir(node_path_1.default.dirname(outputPath), { recursive: true });
            await promises_1.default.writeFile(outputPath, extractedPdf);
            // SAVE THE EXTRACTED PDF AS A PERMANENT RECORD FOR THE USER
            const stats = await promises_1.default.stat(outputPath);
            const extractedRecord = await this._service.savePdfRecord(req.user.userId, `Extracted - ${pdfRecord.originalName}`, stats.size, dto.pageIndices.length, outputPath);
            (0, responseSender_js_1.sendSuccess)(res, statusCodes_js_1.STATUS_CODES.CREATED, {
                ...this._mapper.toExtractResponse(outputFileName, dto.pageIndices.length),
                id: extractedRecord.id // Include the new record ID
            });
        }
        catch (error) {
            next(error);
        }
    };
    getPdf = async (req, res, next) => {
        try {
            const pdfRecord = await this._repository.findOwnedByUser(req.params.id, req.user.userId);
            if (!pdfRecord || !(await this._fileExists(pdfRecord.path))) {
                (0, responseSender_js_1.sendError)(res, statusCodes_js_1.STATUS_CODES.NOT_FOUND, messages_js_1.PDF_MESSAGES.PDF_NOT_FOUND);
                return;
            }
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${pdfRecord.originalName}"`);
            res.sendFile(node_path_1.default.resolve(pdfRecord.path));
        }
        catch (error) {
            next(error);
        }
    };
    listUserPdfs = async (req, res, next) => {
        try {
            const pdfs = await this._service.getUserPdfs(req.user.userId);
            (0, responseSender_js_1.sendSuccess)(res, statusCodes_js_1.STATUS_CODES.OK, pdfs);
        }
        catch (error) {
            next(error);
        }
    };
    deletePdf = async (req, res, next) => {
        try {
            const success = await this._service.deleteUserPdf(req.params.id, req.user.userId);
            if (!success) {
                (0, responseSender_js_1.sendError)(res, statusCodes_js_1.STATUS_CODES.NOT_FOUND, messages_js_1.PDF_MESSAGES.PDF_NOT_FOUND);
                return;
            }
            (0, responseSender_js_1.sendSuccess)(res, statusCodes_js_1.STATUS_CODES.OK, { message: 'PDF deleted successfully' });
        }
        catch (error) {
            next(error);
        }
    };
    async _fileExists(filePath) {
        try {
            await promises_1.default.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    _getOutputPath(fileName) {
        const dir = process.env[config_js_1.STORAGE.OUTPUT_DIR_ENV] || config_js_1.STORAGE.DEFAULT_OUTPUT_DIR;
        return node_path_1.default.isAbsolute(dir) ? node_path_1.default.join(dir, fileName) : node_path_1.default.join(process.cwd(), dir, fileName);
    }
}
exports.PdfController = PdfController;
