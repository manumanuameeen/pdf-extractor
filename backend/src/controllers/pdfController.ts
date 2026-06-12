import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { NextFunction, Response } from 'express';
import { STORAGE } from '../constants/config.js';
import { PDF_MESSAGES } from '../constants/messages.js';
import { STATUS_CODES } from '../constants/statusCodes.js';
import type { ErrorResponseDto, IPdfMapper } from '../contracts/mappers.js';
import { sendError, sendSuccess } from '../utils/responseSender.js';
import type { IPdfRepository } from '../contracts/repositories.js';
import type { IPdfService } from '../contracts/services.js';
import type { IPdfDtoValidator } from '../contracts/validators.js';
import type { IPdfController } from '../contracts/controllers.js';
import type { ExtractPdfResponseDto, UploadPdfResponseDto } from '../mappers/pdfMapper.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';


export class PdfController implements IPdfController {
  constructor(
    private readonly _service: IPdfService,
    private readonly _repository: IPdfRepository,
    private readonly _validator: IPdfDtoValidator,
    private readonly _mapper: IPdfMapper
  ) {}

  uploadPdf = async (
    req: AuthenticatedRequest,
    res: Response<UploadPdfResponseDto | ErrorResponseDto>,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.file) {
        sendError(res, STATUS_CODES.BAD_REQUEST, PDF_MESSAGES.NO_FILE_UPLOADED);
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
      sendSuccess(res, STATUS_CODES.CREATED, this._mapper.toUploadResponse(record));
    } catch (error) {
      next(error);
    }
  };

  extractPdfPages = async (
    req: AuthenticatedRequest<{ id: string }>,
    res: Response<ExtractPdfResponseDto | ErrorResponseDto>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const pdfRecord = await this._repository.findOwnedByUser(req.params.id, req.user.userId);

      if (!pdfRecord || !(await this._fileExists(pdfRecord.path))) {
        sendError(res, STATUS_CODES.NOT_FOUND, PDF_MESSAGES.PDF_NOT_FOUND_REUPLOAD);
        return;
      }

      const dto = this._validator.validateExtractPages(req.body);
      const extractedPdf = await this._service.extractPages(pdfRecord.path, dto.pageIndices);
      const outputFileName = `${crypto.randomUUID()}${STORAGE.EXTRACTED_SUFFIX}`;
      const outputPath = this._getOutputPath(outputFileName);

      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, extractedPdf);

      sendSuccess(res, STATUS_CODES.CREATED, this._mapper.toExtractResponse(outputFileName, dto.pageIndices.length));
    } catch (error) {
      next(error);
    }
  };

  getPdf = async (
    req: AuthenticatedRequest<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const pdfRecord = await this._repository.findOwnedByUser(req.params.id, req.user.userId);

      if (!pdfRecord || !(await this._fileExists(pdfRecord.path))) {
        sendError(res, STATUS_CODES.NOT_FOUND, PDF_MESSAGES.PDF_NOT_FOUND);
        return;
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.sendFile(path.resolve(pdfRecord.path));
    } catch (error) {
      next(error);
    }
  };

  private async _fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private _getOutputPath(fileName: string): string {
    return path.join(process.cwd(), process.env[STORAGE.OUTPUT_DIR_ENV] || STORAGE.DEFAULT_OUTPUT_DIR, fileName);
  }
}
