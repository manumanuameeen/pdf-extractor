import { Router } from 'express';
import { PDF_ROUTES } from '../constants/routes.js';
import { container } from '../di/container.js';
import { authenticate } from '../middleware/authenticate.js';
import upload from '../config/multer.js';
/**
 * ARCHITECTURE: ROUTE CLASS
 * Purpose: Register PDF endpoints without mixing in controller logic.
 */
export class PdfRoutes {
    _controller;
    _authenticateRequest;
    _uploadMiddleware;
    router = Router();
    constructor(_controller = container.pdfController, _authenticateRequest = authenticate, _uploadMiddleware = upload) {
        this._controller = _controller;
        this._authenticateRequest = _authenticateRequest;
        this._uploadMiddleware = _uploadMiddleware;
        this.registerRoutes();
    }
    registerRoutes() {
        this.router.post(PDF_ROUTES.UPLOAD, this._authenticateRequest, this._uploadMiddleware.single('pdf'), this._controller.uploadPdf);
        this.router.get(PDF_ROUTES.BY_ID, this._authenticateRequest, this._controller.getPdf);
        this.router.post(PDF_ROUTES.EXTRACT, this._authenticateRequest, this._controller.extractPdfPages);
    }
}
export default new PdfRoutes().router;
