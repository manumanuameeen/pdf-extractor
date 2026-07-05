import fs from 'node:fs';
import path from 'node:path';
import cron from 'node-cron';
import { CLEANUP } from '../constants/config.js';
import { SYSTEM_MESSAGES } from '../constants/messages.js';
import type { ICleanupJob } from '../contracts/index.js';
import { appDependencies } from '../config/dependencies.js';

/**
 * ARCHITECTURE: CLEANUP JOB CLASS
 * Purpose: Remove "orphan" files that are not tracked in the database.
 * This ensures user-saved PDFs are never deleted, while temp/failed uploads are cleaned.
 */
export class CleanupJob implements ICleanupJob {
  start(uploadDir: string, outputDir: string): void {
    cron.schedule(CLEANUP.CRON_EVERY_HOUR, async () => {
      try {
        const allPdfs = await appDependencies.pdfRepository.findAll();
        const trackedPaths = new Set(allPdfs.map(pdf => path.resolve(pdf.path)));

        this.deleteOrphanFiles(uploadDir, trackedPaths);
        this.deleteOrphanFiles(outputDir, trackedPaths);
        
        console.log(SYSTEM_MESSAGES.CLEANUP_SUCCESS);
      } catch (error) {
        const message = error instanceof Error ? error.message : SYSTEM_MESSAGES.UNKNOWN_CLEANUP_ERROR;
        console.error(`${SYSTEM_MESSAGES.CLEANUP_FAILED_PREFIX}: ${message}`);
      }
    });
  }

  private deleteOrphanFiles(directory: string, trackedPaths: Set<string>): void {
    const maxAgeMinutes = Number(process.env.CLEANUP_INTERVAL_MINUTES || CLEANUP.DEFAULT_INTERVAL_MINUTES);
    const maxAgeMs = maxAgeMinutes * 60 * 1000;

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
      return;
    }

    for (const fileName of fs.readdirSync(directory)) {
      const filePath = path.join(directory, fileName);
      const absolutePath = path.resolve(filePath);
      
      // SKIP if the file is tracked in the database
      if (trackedPaths.has(absolutePath)) {
        continue;
      }

      const fileStats = fs.statSync(filePath);
      const ageMs = Date.now() - fileStats.mtimeMs;

      // Only delete if it's an orphan AND it's old enough (to avoid deleting files currently being uploaded)
      if (fileStats.isFile() && ageMs > maxAgeMs) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned orphan file: ${fileName}`);
      }
    }
  }
}

const cleanupJob = new CleanupJob();
export default cleanupJob;
