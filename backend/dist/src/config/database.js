import mongoose from 'mongoose';
import { DATABASE } from '../constants/config.js';
import { SYSTEM_MESSAGES } from '../constants/messages.js';
/**
 * ARCHITECTURE: DATABASE CONFIG CLASS
 * Purpose: Own MongoDB connection setup without coupling repositories to startup code.
 */
export class DatabaseConnection {
    async connect() {
        const uri = process.env[DATABASE.URI_ENV];
        if (!uri) {
            console.log(SYSTEM_MESSAGES.DATABASE_SKIPPED);
            return;
        }
        try {
            await mongoose.connect(uri, {
                dbName: process.env[DATABASE.DB_NAME_ENV] || DATABASE.DEFAULT_DB_NAME
            });
            console.log(SYSTEM_MESSAGES.DATABASE_CONNECTED);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : SYSTEM_MESSAGES.UNKNOWN_ERROR;
            console.error(`${SYSTEM_MESSAGES.DATABASE_CONNECTION_FAILED_PREFIX}: ${message}`);
            if (typeof message === 'string' && /ip|whitelist|access|not authorized/i.test(message)) {
                console.error('Please verify your MongoDB Atlas network access, IP whitelist, cluster credentials, or clear MONGODB_URI to use local JSON storage.');
            }
        }
    }
}
export default new DatabaseConnection();
