"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const config_js_1 = require("./constants/config.js");
const messages_js_1 = require("./constants/messages.js");
const routes_js_1 = require("./constants/routes.js");
const statusCodes_js_1 = require("./constants/statusCodes.js");
const dependencies_js_1 = require("./config/dependencies.js");
const responseSender_js_1 = require("./utils/responseSender.js");
/**
 * ARCHITECTURE: ERROR HANDLER CLASS
 * Purpose: Convert application errors into consistent HTTP responses.
 */
class ErrorHandlerMiddleware {
    handle = (err, _req, res, next) => {
        if (res.headersSent) {
            next(err);
            return;
        }
        const message = err instanceof Error ? err.message : messages_js_1.SYSTEM_MESSAGES.UNKNOWN_ERROR;
        const statusCode = this.getStatusCode(message, err);
        // Console log the error details with stack trace
        console.error(`\n🔴 [API Error] Status Code: ${statusCode} - ${message}`);
        if (err instanceof Error && err.stack) {
            console.error(err.stack);
        }
        else {
            console.error(err);
        }
        console.error('-----------------------------------------\n');
        (0, responseSender_js_1.sendError)(res, statusCode, message);
    };
    getStatusCode(message, err) {
        const normalizedMessage = message.toLowerCase();
        const isClientError = normalizedMessage.includes('pdf')
            || normalizedMessage.includes('page')
            || normalizedMessage.includes('email')
            || normalizedMessage.includes('password')
            || normalizedMessage.includes('otp')
            || normalizedMessage.includes('account')
            || normalizedMessage.includes('token')
            || normalizedMessage.includes('name')
            || (typeof err === 'object' && err !== null && 'name' in err && err.name === 'MulterError');
        return isClientError ? statusCodes_js_1.STATUS_CODES.BAD_REQUEST : statusCodes_js_1.STATUS_CODES.INTERNAL_SERVER_ERROR;
    }
}
/**
 * ARCHITECTURE: APP SETUP CLASS
 * Purpose: Configure Express middleware, static assets, routes, jobs, and errors.
 */
class AppFactory {
    _uploadDir = node_path_1.default.join(process.cwd(), process.env[config_js_1.STORAGE.UPLOAD_DIR_ENV] || config_js_1.STORAGE.DEFAULT_UPLOAD_DIR);
    _outputDir = node_path_1.default.join(process.cwd(), process.env[config_js_1.STORAGE.OUTPUT_DIR_ENV] || config_js_1.STORAGE.DEFAULT_OUTPUT_DIR);
    _errorHandler = new ErrorHandlerMiddleware();
    create() {
        const app = (0, express_1.default)();
        app.set('trust proxy', 1);
        this.ensureStorage();
        this.registerMiddleware(app);
        this.registerRoutes(app);
        this.startJobs();
        this.registerErrorHandling(app);
        return app;
    }
    ensureStorage() {
        node_fs_1.default.mkdirSync(this._uploadDir, { recursive: true });
        node_fs_1.default.mkdirSync(this._outputDir, { recursive: true });
    }
    registerMiddleware(app) {
        app.use((0, cors_1.default)());
        app.use(express_1.default.json());
        app.use(routes_js_1.API_ROUTES.OUTPUTS_BASE, express_1.default.static(this._outputDir));
        app.use('/uploads', express_1.default.static(this._uploadDir));
    }
    registerRoutes(app) {
        app.use(routes_js_1.API_ROUTES.AUTH_BASE, dependencies_js_1.appDependencies.authRoutes);
        app.use(routes_js_1.API_ROUTES.PDF_BASE, dependencies_js_1.appDependencies.pdfRoutes);
    }
    startJobs() {
        void dependencies_js_1.appDependencies.databaseConnection.connect();
        dependencies_js_1.appDependencies.cleanupJob.start(this._uploadDir, this._outputDir);
    }
    registerErrorHandling(app) {
        app.use(this._errorHandler.handle);
    }
}
const app = new AppFactory().create();
exports.default = app;
