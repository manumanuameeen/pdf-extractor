import Pdf from '../models/pdfModel.js';
import { MongoBaseRepository } from './mongoBaseRepository.js';
import type { IPdfRepository } from '../contracts/index.js';
import type { PdfRecord } from '../types/models.js';

function mapToPdfRecord(doc: any): PdfRecord {
  return {
    id: doc._id || doc.id,
    userId: doc.userId,
    originalName: doc.originalName,
    size: doc.size,
    pageCount: doc.pageCount,
    path: doc.path,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString()
  };
}

function mapToPdfDoc(record: PdfRecord): any {
  return {
    _id: record.id,
    userId: record.userId,
    originalName: record.originalName,
    size: record.size,
    pageCount: record.pageCount,
    path: record.path
  };
}

export class MongoPdfRepository extends MongoBaseRepository<PdfRecord> implements IPdfRepository {
  constructor() {
    super(Pdf, mapToPdfRecord, mapToPdfDoc);
  }

  async findOwnedByUser(id: string, userId: string): Promise<PdfRecord | null> {
    const doc = await Pdf.findOne({ _id: id, userId });
    return doc ? mapToPdfRecord(doc) : null;
  }

  async findByUserId(userId: string): Promise<PdfRecord[]> {
    const docs = await Pdf.find({ userId }).sort({ createdAt: -1 });
    return docs.map(doc => mapToPdfRecord(doc));
  }

  async delete(id: string): Promise<boolean> {
    const result = await Pdf.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}
