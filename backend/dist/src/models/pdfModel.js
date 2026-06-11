"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema, model, models } = mongoose_1.default;
const pdfSchema = new Schema({
    _id: { type: String, required: true }, // Store UUID/Filename as _id
    userId: { type: String, required: true, index: true }, // Store user's UUID as String
    originalName: { type: String, required: true, trim: true },
    size: { type: Number, required: true, min: 0 },
    pageCount: { type: Number, required: true, min: 1 },
    path: { type: String, required: true }
}, {
    timestamps: true,
    versionKey: false
});
exports.default = models.Pdf || model('Pdf', pdfSchema);
