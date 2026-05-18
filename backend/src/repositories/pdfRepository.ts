import path from 'node:path';
import { JsonFileRepository } from './jsonFileRepository.js';
import type { IPdfRepository } from '../contracts/repositories.js';
import type { PdfRecord } from '../types/models.js';

export class PdfRepository extends JsonFileRepository<PdfRecord> implements IPdfRepository {
  constructor() {
    super(path.join(process.cwd(), 'data', 'pdfs.json'));
  }

  async findOwnedByUser(id: string, userId: string): Promise<PdfRecord | null> {
    const pdf = await this.findById(id);

    if (!pdf || pdf.userId !== userId) {
      return null;
    }

    return pdf;
  }
}
