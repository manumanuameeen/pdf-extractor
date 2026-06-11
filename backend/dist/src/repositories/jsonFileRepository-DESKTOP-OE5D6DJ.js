"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonFileRepository = void 0;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
class JsonFileRepository {
    _filePath;
    constructor(_filePath) {
        this._filePath = _filePath;
    }
    async ensureFile() {
        await promises_1.default.mkdir(node_path_1.default.dirname(this._filePath), { recursive: true });
        try {
            await promises_1.default.access(this._filePath);
        }
        catch {
            await promises_1.default.writeFile(this._filePath, '[]');
        }
    }
    async findAll() {
        await this.ensureFile();
        const content = await promises_1.default.readFile(this._filePath, 'utf8');
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
        await promises_1.default.writeFile(this._filePath, JSON.stringify(records, null, 2));
        return record;
    }
}
exports.JsonFileRepository = JsonFileRepository;
