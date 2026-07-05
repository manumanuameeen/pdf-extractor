import { Router, type RequestHandler } from 'express';
import { PDF_ROUTES } from '../constants/routes.js';
import { container } from '../di/container.js';
import { authenticate } from '../middleware/authenticate.js';
import upload from '../config/multer.js';
import type multer from 'multer';
import { IRouteBuilder } from '../contracts/index.js';

/**
 * ARCHITECTURE: ROUTE CLASS
 * Purpose: Register PDF endpoints without mixing in controller logic.
 */
export class PdfRoutes implements IRouteBuilder {
  readonly router = Router();

  constructor(
    private readonly _controller = container.pdfController,
    private readonly _authenticateRequest: RequestHandler = authenticate,
    private readonly _uploadMiddleware: multer.Multer = upload
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.post(PDF_ROUTES.UPLOAD, this._authenticateRequest, this._uploadMiddleware.single('pdf'), this._controller.uploadPdf as RequestHandler);
    this.router.get(PDF_ROUTES.BY_ID, this._authenticateRequest, this._controller.getPdf as RequestHandler);
    this.router.post(PDF_ROUTES.EXTRACT, this._authenticateRequest, this._controller.extractPdfPages as RequestHandler);
    this.router.get(PDF_ROUTES.LIST, this._authenticateRequest, this._controller.listUserPdfs as RequestHandler);
    this.router.delete(PDF_ROUTES.DELETE, this._authenticateRequest, this._controller.deletePdf as RequestHandler);
  }
}

export default new PdfRoutes().router;

