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
                res.status(statusCodes_js_1.STATUS_CODES.BAD_REQUEST).json({ error: messages_js_1.PDF_MESSAGES.NO_FILE_UPLOADED });
                return;
            }
            const metadata = await this._service.getMetadata(req.file.path);
            const record = this._mapper.toRecord({
                id: req.file.filename,
                userId: req.user.userId,
                originalName: req.file.originalname,
                size: req.file.size,
                pageCount: metadata.pageCount,
                path: req.file.path
            });
            await this._repository.save(record);
            res.status(statusCodes_js_1.STATUS_CODES.CREATED).json(this._mapper.toUploadResponse(record));
        }
        catch (error) {
            next(error);
        }
    };
    extractPdfPages = async (req, res, next) => {
        try {
            const pdfRecord = await this._repository.findOwnedByUser(req.params.id, req.user.userId);
            if (!pdfRecord || !(await this._fileExists(pdfRecord.path))) {
                res.status(statusCodes_js_1.STATUS_CODES.NOT_FOUND).json({ error: messages_js_1.PDF_MESSAGES.PDF_NOT_FOUND_REUPLOAD });
                return;
            }
            const dto = this._validator.validateExtractPages(req.body);
            const extractedPdf = await this._service.extractPages(pdfRecord.path, dto.pageIndices);
            const outputFileName = `${node_crypto_1.default.randomUUID()}${config_js_1.STORAGE.EXTRACTED_SUFFIX}`;
            const outputPath = this._getOutputPath(outputFileName);
            await promises_1.default.mkdir(node_path_1.default.dirname(outputPath), { recursive: true });
            await promises_1.default.writeFile(outputPath, extractedPdf);
            res.status(statusCodes_js_1.STATUS_CODES.CREATED).json(this._mapper.toExtractResponse(outputFileName, dto.pageIndices.length));
        }
        catch (error) {
            next(error);
        }
    };
    getPdf = async (req, res, next) => {
        try {
            const pdfRecord = await this._repository.findOwnedByUser(req.params.id, req.user.userId);
            if (!pdfRecord || !(await this._fileExists(pdfRecord.path))) {
                res.status(statusCodes_js_1.STATUS_CODES.NOT_FOUND).json({ error: messages_js_1.PDF_MESSAGES.PDF_NOT_FOUND });
                return;
            }
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline');
            res.sendFile(node_path_1.default.resolve(pdfRecord.path));
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
        return node_path_1.default.join(process.cwd(), process.env[config_js_1.STORAGE.OUTPUT_DIR_ENV] || config_js_1.STORAGE.DEFAULT_OUTPUT_DIR, fileName);
    }
}
exports.PdfController = PdfController;
