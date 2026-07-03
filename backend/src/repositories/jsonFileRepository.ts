import fs from 'node:fs/promises';
import path from 'node:path';
import type { IRepository } from '../contracts/repositories.js';

export class JsonFileRepository<TRecord extends { id: string }> implements IRepository<TRecord> {
  constructor(private readonly _filePath: string) {}

  private async ensureFile(): Promise<void> {
    await fs.mkdir(path.dirname(this._filePath), { recursive: true });

    try {
      await fs.access(this._filePath);
    } catch {
      await fs.writeFile(this._filePath, '[]');
    }
  }

  async findAll(): Promise<TRecord[]> {
    await this.ensureFile();
    const content = await fs.readFile(this._filePath, 'utf8');
    return JSON.parse(content) as TRecord[];
  } 
  
  async findById(id: string): Promise<TRecord | null> {
    const records = await this.findAll();
    return records.find((record) => record.id === id) ?? null;
  }

  async save(record: TRecord): Promise<TRecord> {
    const records = await this.findAll();
    const existingIndex = records.findIndex((item) => item.id === record.id);

    if (existingIndex === -1) {
      records.push(record);
    } else {
      records[existingIndex] = record;
    }

    await fs.writeFile(this._filePath, JSON.stringify(records, null, 2));
    return record;
  }
}

