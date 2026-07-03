"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfRepository = void 0;
const node_path_1 = __importDefault(require("node:path"));
const jsonFileRepository_js_1 = require("./jsonFileRepository.js");
class PdfRepository extends jsonFileRepository_js_1.JsonFileRepository {
    constructor() {
        super(node_path_1.default.join(process.cwd(), 'data', 'pdfs.json'));
    }
    async findOwnedByUser(id, userId) {
        const pdf = await this.findById(id);
        if (!pdf || pdf.userId !== userId) {
            return null;
        }
        return pdf;
    }
    async findByUserId(userId) {
        const all = await this.findAll();
        return all.filter(pdf => pdf.userId === userId);
    }
    async delete(id) {
        const all = await this.findAll();
        const filtered = all.filter(pdf => pdf.id !== id);
        if (all.length === filtered.length) {
            return false;
        }
        // Since JsonFileRepository doesn't have a direct delete, we overwrite the data file
        // Note: In a real app, JsonFileRepository should be extended with a delete method
        // For this implementation, we'll assume save() can handle the full list if needed
        // or we just use the existing collection and save back.
        // However, JsonFileRepository's save() only saves ONE record.
        // Let's add a proper delete to JsonFileRepository or handle it here.
        // We'll use a hack for now: clear the file and save the filtered list
        // (Better: implement delete in JsonFileRepository)
        const fs = await import('node:fs/promises');
        await fs.writeFile(node_path_1.default.join(process.cwd(), 'data', 'pdfs.json'), JSON.stringify(filtered, null, 2));
        return true;
    }
}
exports.PdfRepository = PdfRepository;
