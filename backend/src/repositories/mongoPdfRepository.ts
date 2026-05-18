import Pdf from '../models/pdfModel.js';
import type { IPdfRepository } from '../contracts/repositories.js';
import type { PdfRecord } from '../types/models.js';

export class MongoPdfRepository implements IPdfRepository {
  private mapToPdfRecord(doc: any): PdfRecord {
    return {
      id: doc._id,
      userId: doc.userId,
      originalName: doc.originalName,
      size: doc.size,
      pageCount: doc.pageCount,
      path: doc.path,
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString()
    };
  }

  async findAll(): Promise<PdfRecord[]> {
    const docs = await Pdf.find({});
    return docs.map((doc) => this.mapToPdfRecord(doc));
  }

  async findById(id: string): Promise<PdfRecord | null> {
    const doc = await Pdf.findById(id);
    return doc ? this.mapToPdfRecord(doc) : null;
  }

  async findOwnedByUser(id: string, userId: string): Promise<PdfRecord | null> {
    const doc = await Pdf.findOne({ _id: id, userId });
    return doc ? this.mapToPdfRecord(doc) : null;
  }

  async save(record: PdfRecord): Promise<PdfRecord> {
    const doc = {
      _id: record.id,
      userId: record.userId,
      originalName: record.originalName,
      size: record.size,
      pageCount: record.pageCount,
      path: record.path
    };

    await Pdf.findByIdAndUpdate(record.id, doc, { upsert: true, new: true });
    return record;
  }
}
