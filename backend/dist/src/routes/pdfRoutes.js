"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfRoutes = void 0;
const express_1 = require("express");
const routes_js_1 = require("../constants/routes.js");
const container_js_1 = require("../di/container.js");
const authenticate_js_1 = require("../middleware/authenticate.js");
const multer_js_1 = __importDefault(require("../config/multer.js"));
/**
 * ARCHITECTURE: ROUTE CLASS
 * Purpose: Register PDF endpoints without mixing in controller logic.
 */
class PdfRoutes {
    _controller;
    _authenticateRequest;
    _uploadMiddleware;
    router = (0, express_1.Router)();
    constructor(_controller = container_js_1.container.pdfController, _authenticateRequest = authenticate_js_1.authenticate, _uploadMiddleware = multer_js_1.default) {
        this._controller = _controller;
        this._authenticateRequest = _authenticateRequest;
        this._uploadMiddleware = _uploadMiddleware;
        this.registerRoutes();
    }
    registerRoutes() {
        this.router.post(routes_js_1.PDF_ROUTES.UPLOAD, this._authenticateRequest, this._uploadMiddleware.single('pdf'), this._controller.uploadPdf);
        this.router.get(routes_js_1.PDF_ROUTES.BY_ID, this._authenticateRequest, this._controller.getPdf);
        this.router.post(routes_js_1.PDF_ROUTES.EXTRACT, this._authenticateRequest, this._controller.extractPdfPages);
        this.router.get(routes_js_1.PDF_ROUTES.LIST, this._authenticateRequest, this._controller.listUserPdfs);
        this.router.delete(routes_js_1.PDF_ROUTES.DELETE, this._authenticateRequest, this._controller.deletePdf);
    }
}
exports.PdfRoutes = PdfRoutes;
exports.default = new PdfRoutes().router;
