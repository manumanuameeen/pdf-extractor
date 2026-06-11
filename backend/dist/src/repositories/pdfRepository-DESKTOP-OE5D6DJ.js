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
}
exports.PdfRepository = PdfRepository;
