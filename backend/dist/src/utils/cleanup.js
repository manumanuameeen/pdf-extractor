"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CleanupJob = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_cron_1 = __importDefault(require("node-cron"));
const config_js_1 = require("../constants/config.js");
const messages_js_1 = require("../constants/messages.js");
const dependencies_js_1 = require("../config/dependencies.js");
/**
 * ARCHITECTURE: CLEANUP JOB CLASS
 * Purpose: Remove "orphan" files that are not tracked in the database.
 * This ensures user-saved PDFs are never deleted, while temp/failed uploads are cleaned.
 */
class CleanupJob {
    start(uploadDir, outputDir) {
        node_cron_1.default.schedule(config_js_1.CLEANUP.CRON_EVERY_HOUR, async () => {
            try {
                const allPdfs = await dependencies_js_1.appDependencies.pdfRepository.findAll();
                const trackedPaths = new Set(allPdfs.map(pdf => node_path_1.default.resolve(pdf.path)));
                this.deleteOrphanFiles(uploadDir, trackedPaths);
                this.deleteOrphanFiles(outputDir, trackedPaths);
                console.log(messages_js_1.SYSTEM_MESSAGES.CLEANUP_SUCCESS);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : messages_js_1.SYSTEM_MESSAGES.UNKNOWN_CLEANUP_ERROR;
                console.error(`${messages_js_1.SYSTEM_MESSAGES.CLEANUP_FAILED_PREFIX}: ${message}`);
            }
        });
    }
    deleteOrphanFiles(directory, trackedPaths) {
        const maxAgeMinutes = Number(process.env.CLEANUP_INTERVAL_MINUTES || config_js_1.CLEANUP.DEFAULT_INTERVAL_MINUTES);
        const maxAgeMs = maxAgeMinutes * 60 * 1000;
        if (!node_fs_1.default.existsSync(directory)) {
            node_fs_1.default.mkdirSync(directory, { recursive: true });
            return;
        }
        for (const fileName of node_fs_1.default.readdirSync(directory)) {
            const filePath = node_path_1.default.join(directory, fileName);
            const absolutePath = node_path_1.default.resolve(filePath);
            // SKIP if the file is tracked in the database
            if (trackedPaths.has(absolutePath)) {
                continue;
            }
            const fileStats = node_fs_1.default.statSync(filePath);
            const ageMs = Date.now() - fileStats.mtimeMs;
            // Only delete if it's an orphan AND it's old enough (to avoid deleting files currently being uploaded)
            if (fileStats.isFile() && ageMs > maxAgeMs) {
                node_fs_1.default.unlinkSync(filePath);
                console.log(`Cleaned orphan file: ${fileName}`);
            }
        }
    }
}
exports.CleanupJob = CleanupJob;
const cleanupJob = new CleanupJob();
exports.default = cleanupJob;
