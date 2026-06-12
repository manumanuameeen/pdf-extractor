"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./src/app"));
const messages_1 = require("./src/constants/messages");
/**
 * ARCHITECTURE: ENTRY POINT
 * Purpose: Load environment variables and start the HTTP server.
 */
const PORT = Number(process.env.PORT) || 5000;
app_1.default.listen(PORT, () => {
    console.log(messages_1.SYSTEM_MESSAGES.SERVER_STARTED.replace('{port}', String(PORT)));
});
