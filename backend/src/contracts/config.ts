import type multer from 'multer';

/**
 * ARCHITECTURE: CONFIG CONTRACTS
 * Purpose: Define contracts for configuration classes.
 */

export interface IDatabaseConnection {
  connect(): Promise<void>;
}

export interface ICleanupJob {
  start(uploadDir: string, outputDir: string): void;
}

export interface IMulterConfig {
  createUpload(): multer.Multer;
}
