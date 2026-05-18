import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { STORAGE } from '../constants/config.js';
import { PDF_MESSAGES } from '../constants/messages.js';
import { STATUS_CODES } from '../constants/statusCodes.js';
export class PdfController {
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
                res.status(STATUS_CODES.BAD_REQUEST).json({ error: PDF_MESSAGES.NO_FILE_UPLOADED });
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
            res.status(STATUS_CODES.CREATED).json(this._mapper.toUploadResponse(record));
        }
        catch (error) {
            next(error);
        }
    };
    extractPdfPages = async (req, res, next) => {
        try {
            const pdfRecord = await this._repository.findOwnedByUser(req.params.id, req.user.userId);
            if (!pdfRecord || !(await this._fileExists(pdfRecord.path))) {
                res.status(STATUS_CODES.NOT_FOUND).json({ error: PDF_MESSAGES.PDF_NOT_FOUND_REUPLOAD });
                return;
            }
            const dto = this._validator.validateExtractPages(req.body);
            const extractedPdf = await this._service.extractPages(pdfRecord.path, dto.pageIndices);
            const outputFileName = `${crypto.randomUUID()}${STORAGE.EXTRACTED_SUFFIX}`;
            const outputPath = this._getOutputPath(outputFileName);
            await fs.mkdir(path.dirname(outputPath), { recursive: true });
            await fs.writeFile(outputPath, extractedPdf);
            res.status(STATUS_CODES.CREATED).json(this._mapper.toExtractResponse(outputFileName, dto.pageIndices.length));
        }
        catch (error) {
            next(error);
        }
    };
    getPdf = async (req, res, next) => {
        try {
            const pdfRecord = await this._repository.findOwnedByUser(req.params.id, req.user.userId);
            if (!pdfRecord || !(await this._fileExists(pdfRecord.path))) {
                res.status(STATUS_CODES.NOT_FOUND).json({ error: PDF_MESSAGES.PDF_NOT_FOUND });
                return;
            }
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline');
            res.sendFile(path.resolve(pdfRecord.path));
        }
        catch (error) {
            next(error);
        }
    };
    async _fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    _getOutputPath(fileName) {
        return path.join(process.cwd(), process.env[STORAGE.OUTPUT_DIR_ENV] || STORAGE.DEFAULT_OUTPUT_DIR, fileName);
    }
}
