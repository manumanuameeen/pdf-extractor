import path from 'node:path';
import { JsonFileRepository } from './jsonFileRepository.js';
export class PdfRepository extends JsonFileRepository {
    constructor() {
        super(path.join(process.cwd(), 'data', 'pdfs.json'));
    }
    async findOwnedByUser(id, userId) {
        const pdf = await this.findById(id);
        if (!pdf || pdf.userId !== userId) {
            return null;
        }
        return pdf;
    }
}
