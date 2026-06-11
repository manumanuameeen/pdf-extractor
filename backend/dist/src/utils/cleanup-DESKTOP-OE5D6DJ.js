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
/**
 * ARCHITECTURE: CLEANUP JOB CLASS
 * Purpose: Remove old uploaded/generated files so server storage does not grow forever.
 */
class CleanupJob {
    start(uploadDir, outputDir) {
        node_cron_1.default.schedule(config_js_1.CLEANUP.CRON_EVERY_HOUR, () => {
            try {
                this.deleteOldFiles(uploadDir);
                this.deleteOldFiles(outputDir);
                console.log(messages_js_1.SYSTEM_MESSAGES.CLEANUP_SUCCESS);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : messages_js_1.SYSTEM_MESSAGES.UNKNOWN_CLEANUP_ERROR;
                console.error(`${messages_js_1.SYSTEM_MESSAGES.CLEANUP_FAILED_PREFIX}: ${message}`);
            }
        });
    }
    deleteOldFiles(directory) {
        const maxAgeMinutes = Number(process.env.CLEANUP_INTERVAL_MINUTES || config_js_1.CLEANUP.DEFAULT_INTERVAL_MINUTES);
        const maxAgeMs = maxAgeMinutes * 60 * 1000;
        node_fs_1.default.mkdirSync(directory, { recursive: true });
        for (const fileName of node_fs_1.default.readdirSync(directory)) {
            const filePath = node_path_1.default.join(directory, fileName);
            const fileStats = node_fs_1.default.statSync(filePath);
            const ageMs = Date.now() - fileStats.mtimeMs;
            if (fileStats.isFile() && ageMs > maxAgeMs) {
                node_fs_1.default.unlinkSync(filePath);
            }
        }
    }
}
exports.CleanupJob = CleanupJob;
const cleanupJob = new CleanupJob();
exports.default = cleanupJob;
