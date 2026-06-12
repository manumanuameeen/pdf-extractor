"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, statusCode, body) => {
    res.status(statusCode).json(body);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, statusCode, error) => {
    res.status(statusCode).json({ error });
};
exports.sendError = sendError;
