"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MulterConfig = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const multer_1 = __importDefault(require("multer"));
const config_js_1 = require("../constants/config.js");
const messages_js_1 = require("../constants/messages.js");
/**
 * ARCHITECTURE: CONFIG CLASS
 * Purpose: Centralize upload storage, limits, and file validation.
 */
class MulterConfig {
    createUpload() {
        return (0, multer_1.default)({
            storage: this.createStorage(),
            fileFilter: this._fileFilter,
            limits: { fileSize: config_js_1.FILE_LIMITS.MAX_PDF_SIZE_BYTES }
        });
    }
    createStorage() {
        return multer_1.default.diskStorage({
            destination: (_req, _file, cb) => {
                const uploadDir = process.env[config_js_1.STORAGE.UPLOAD_DIR_ENV] || config_js_1.STORAGE.DEFAULT_UPLOAD_DIR;
                node_fs_1.default.mkdirSync(uploadDir, { recursive: true });
                cb(null, uploadDir);
            },
            filename: (_req, file, cb) => {
                cb(null, `${node_crypto_1.default.randomUUID()}${node_path_1.default.extname(file.originalname).toLowerCase()}`);
            }
        });
    }
    _fileFilter = (_req, file, cb) => {
        const isPdfMime = file.mimetype === config_js_1.STORAGE.PDF_MIME_TYPE;
        const isPdfExtension = node_path_1.default.extname(file.originalname).toLowerCase() === config_js_1.STORAGE.PDF_EXTENSION;
        if (isPdfMime && isPdfExtension) {
            cb(null, true);
            return;
        }
        cb(new Error(messages_js_1.PDF_MESSAGES.INVALID_FILE_TYPE));
    };
}
exports.MulterConfig = MulterConfig;
const multerConfig = new MulterConfig();
const upload = multerConfig.createUpload();
exports.default = upload;
