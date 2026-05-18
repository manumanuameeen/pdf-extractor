import mongoose from 'mongoose';
import type { InferSchemaType } from 'mongoose';

const { Schema, model, models } = mongoose;

const pdfSchema = new Schema(
  {
    _id: { type: String, required: true }, // Store UUID/Filename as _id
    userId: { type: String, required: true, index: true }, // Store user's UUID as String
    originalName: { type: String, required: true, trim: true },
    size: { type: Number, required: true, min: 0 },
    pageCount: { type: Number, required: true, min: 1 },
    path: { type: String, required: true }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export type PdfDocument = InferSchemaType<typeof pdfSchema>;

export default models.Pdf || model('Pdf', pdfSchema);
