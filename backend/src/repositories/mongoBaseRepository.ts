import type { Model } from 'mongoose';
import type { IRepository } from '../contracts/index.js';

export abstract class MongoBaseRepository<TRecord extends { id: string }> implements IRepository<TRecord> {
  constructor(
    protected readonly model: Model<any>,
    protected readonly mapToRecord: (doc: any) => TRecord,
    protected readonly mapToDoc: (record: TRecord) => any
  ) {}

  async findAll(): Promise<TRecord[]> {
    const docs = await this.model.find({});
    return docs.map((doc) => this.mapToRecord(doc));
  }

  async findById(id: string): Promise<TRecord | null> {
    const doc = await this.model.findById(id);
    return doc ? this.mapToRecord(doc) : null;
  }

  async save(record: TRecord): Promise<TRecord> {
    const doc = this.mapToDoc(record);
    await this.model.findByIdAndUpdate(record.id, doc, { upsert: true, new: true });
    return record;
  }
}
