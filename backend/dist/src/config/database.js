"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseConnection = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const config_js_1 = require("../constants/config.js");
const messages_js_1 = require("../constants/messages.js");
/**
 * ARCHITECTURE: DATABASE CONFIG CLASS
 * Purpose: Own MongoDB connection setup without coupling repositories to startup code.
 */
class DatabaseConnection {
    async connect() {
        const uri = process.env[config_js_1.DATABASE.URI_ENV];
        if (!uri) {
            console.log(messages_js_1.SYSTEM_MESSAGES.DATABASE_SKIPPED);
            return;
        }
        try {
            await mongoose_1.default.connect(uri, {
                dbName: process.env[config_js_1.DATABASE.DB_NAME_ENV] || config_js_1.DATABASE.DEFAULT_DB_NAME
            });
            console.log(messages_js_1.SYSTEM_MESSAGES.DATABASE_CONNECTED);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : messages_js_1.SYSTEM_MESSAGES.UNKNOWN_ERROR;
            console.error(`${messages_js_1.SYSTEM_MESSAGES.DATABASE_CONNECTION_FAILED_PREFIX}: ${message}`);
            if (typeof message === 'string' && /ip|whitelist|access|not authorized/i.test(message)) {
                console.error('Please verify your MongoDB Atlas network access, IP whitelist, cluster credentials, or clear MONGODB_URI to use local JSON storage.');
            }
        }
    }
}
exports.DatabaseConnection = DatabaseConnection;
exports.default = new DatabaseConnection();
