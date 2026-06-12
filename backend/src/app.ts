import fs from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import express, { type ErrorRequestHandler, type Express } from 'express';
import { STORAGE } from './constants/config.js';
import { SYSTEM_MESSAGES } from './constants/messages.js';
import { API_ROUTES } from './constants/routes.js';
import { STATUS_CODES } from './constants/statusCodes.js';
import { appDependencies } from './config/dependencies.js';
import { sendError } from './utils/responseSender.js';

/**
 * ARCHITECTURE: ERROR HANDLER CLASS
 * Purpose: Convert application errors into consistent HTTP responses.
 */
class ErrorHandlerMiddleware {
  handle: ErrorRequestHandler = (err, _req, res, next) => {
    if (res.headersSent) {
      next(err);
      return;
    }

    const message = err instanceof Error ? err.message : SYSTEM_MESSAGES.UNKNOWN_ERROR;
    const statusCode = this.getStatusCode(message, err);

    // Console log the error details with stack trace
    console.error(`\n🔴 [API Error] Status Code: ${statusCode} - ${message}`);
    if (err instanceof Error && err.stack) {
      console.error(err.stack);
    } else {
      console.error(err);
    }
    console.error('-----------------------------------------\n');

    sendError(res, statusCode, message);
  };

  private getStatusCode(message: string, err: unknown): number {
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

    return isClientError ? STATUS_CODES.BAD_REQUEST : STATUS_CODES.INTERNAL_SERVER_ERROR;
  }
}

/**
 * ARCHITECTURE: APP SETUP CLASS
 * Purpose: Configure Express middleware, static assets, routes, jobs, and errors.
 */
class AppFactory {
  private readonly _uploadDir = path.join(process.cwd(), process.env[STORAGE.UPLOAD_DIR_ENV] || STORAGE.DEFAULT_UPLOAD_DIR);
  private readonly _outputDir = path.join(process.cwd(), process.env[STORAGE.OUTPUT_DIR_ENV] || STORAGE.DEFAULT_OUTPUT_DIR);
  private readonly _errorHandler = new ErrorHandlerMiddleware();

  create(): Express {
    const app = express();

    this.ensureStorage();
    this.registerMiddleware(app);
    this.registerRoutes(app);
    this.startJobs();
    this.registerErrorHandling(app);

    return app;
  }

  private ensureStorage(): void {
    fs.mkdirSync(this._uploadDir, { recursive: true });
    fs.mkdirSync(this._outputDir, { recursive: true });
  }

  private registerMiddleware(app: Express): void {
    app.use(cors());
    app.use(express.json());
    app.use(API_ROUTES.OUTPUTS_BASE, express.static(this._outputDir));
    app.use('/uploads', express.static(this._uploadDir));
  }

  private registerRoutes(app: Express): void {
    app.use(API_ROUTES.AUTH_BASE, appDependencies.authRoutes);
    app.use(API_ROUTES.PDF_BASE, appDependencies.pdfRoutes);
  }

  private startJobs(): void {
    void appDependencies.databaseConnection.connect();
    appDependencies.cleanupJob.start(this._uploadDir, this._outputDir);
  }

  private registerErrorHandling(app: Express): void {
    app.use(this._errorHandler.handle);
  }
}

const app = new AppFactory().create();

export default app;
