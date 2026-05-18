import fs from 'node:fs';
import path from 'node:path';
import cron from 'node-cron';
import { CLEANUP } from '../constants/config.js';
import { SYSTEM_MESSAGES } from '../constants/messages.js';
/**
 * ARCHITECTURE: CLEANUP JOB CLASS
 * Purpose: Remove old uploaded/generated files so server storage does not grow forever.
 */
export class CleanupJob {
    start(uploadDir, outputDir) {
        cron.schedule(CLEANUP.CRON_EVERY_HOUR, () => {
            try {
                this.deleteOldFiles(uploadDir);
                this.deleteOldFiles(outputDir);
                console.log(SYSTEM_MESSAGES.CLEANUP_SUCCESS);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : SYSTEM_MESSAGES.UNKNOWN_CLEANUP_ERROR;
                console.error(`${SYSTEM_MESSAGES.CLEANUP_FAILED_PREFIX}: ${message}`);
            }
        });
    }
    deleteOldFiles(directory) {
        const maxAgeMinutes = Number(process.env.CLEANUP_INTERVAL_MINUTES || CLEANUP.DEFAULT_INTERVAL_MINUTES);
        const maxAgeMs = maxAgeMinutes * 60 * 1000;
        fs.mkdirSync(directory, { recursive: true });
        for (const fileName of fs.readdirSync(directory)) {
            const filePath = path.join(directory, fileName);
            const fileStats = fs.statSync(filePath);
            const ageMs = Date.now() - fileStats.mtimeMs;
            if (fileStats.isFile() && ageMs > maxAgeMs) {
                fs.unlinkSync(filePath);
            }
        }
    }
}
const cleanupJob = new CleanupJob();
export default cleanupJob;
