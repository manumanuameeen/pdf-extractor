import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { FILE_LIMITS, STORAGE } from '../constants/config.js';
import { PDF_MESSAGES } from '../constants/messages.js';
import type { IMulterConfig } from '../contracts/index.js';

// configures file uploads
export class MulterConfig implements IMulterConfig {
  createUpload(): multer.Multer {
    return multer({
      storage: this.createStorage(),
      fileFilter: this._fileFilter,
      limits: { fileSize: FILE_LIMITS.MAX_PDF_SIZE_BYTES }
    });
  }

  private createStorage(): multer.StorageEngine {
    return multer.diskStorage({
      destination: (_req, _file, cb) => {
        const uploadDir = process.env[STORAGE.UPLOAD_DIR_ENV] || STORAGE.DEFAULT_UPLOAD_DIR;
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
      },
      filename: (_req, file, cb) => {
        cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
      }
    });
  }

  private _fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
    const isPdfMime = file.mimetype === STORAGE.PDF_MIME_TYPE;
    const isPdfExtension = path.extname(file.originalname).toLowerCase() === STORAGE.PDF_EXTENSION;

    if (isPdfMime && isPdfExtension) {
      cb(null, true);
      return;
    }

    cb(new Error(PDF_MESSAGES.INVALID_FILE_TYPE));
  };
}

const multerConfig = new MulterConfig();
const upload = multerConfig.createUpload();

export default upload;

