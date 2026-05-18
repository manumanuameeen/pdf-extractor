import fs from 'node:fs/promises';
import path from 'node:path';
export class JsonFileRepository {
    _filePath;
    constructor(_filePath) {
        this._filePath = _filePath;
    }
    async ensureFile() {
        await fs.mkdir(path.dirname(this._filePath), { recursive: true });
        try {
            await fs.access(this._filePath);
        }
        catch {
            await fs.writeFile(this._filePath, '[]');
        }
    }
    async findAll() {
        await this.ensureFile();
        const content = await fs.readFile(this._filePath, 'utf8');
        return JSON.parse(content);
    }
    async findById(id) {
        const records = await this.findAll();
        return records.find((record) => record.id === id) ?? null;
    }
    async save(record) {
        const records = await this.findAll();
        const existingIndex = records.findIndex((item) => item.id === record.id);
        if (existingIndex === -1) {
            records.push(record);
        }
        else {
            records[existingIndex] = record;
        }
        await fs.writeFile(this._filePath, JSON.stringify(records, null, 2));
        return record;
    }
}
