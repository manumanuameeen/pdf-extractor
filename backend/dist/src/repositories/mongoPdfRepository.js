"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoPdfRepository = void 0;
const pdfModel_js_1 = __importDefault(require("../models/pdfModel.js"));
class MongoPdfRepository {
    mapToPdfRecord(doc) {
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
    async findAll() {
        const docs = await pdfModel_js_1.default.find({});
        return docs.map((doc) => this.mapToPdfRecord(doc));
    }
    async findById(id) {
        const doc = await pdfModel_js_1.default.findById(id);
        return doc ? this.mapToPdfRecord(doc) : null;
    }
    async findOwnedByUser(id, userId) {
        const doc = await pdfModel_js_1.default.findOne({ _id: id, userId });
        return doc ? this.mapToPdfRecord(doc) : null;
    }
    async save(record) {
        const doc = {
            _id: record.id,
            userId: record.userId,
            originalName: record.originalName,
            size: record.size,
            pageCount: record.pageCount,
            path: record.path
        };
        await pdfModel_js_1.default.findByIdAndUpdate(record.id, doc, { upsert: true, new: true });
        return record;
    }
}
exports.MongoPdfRepository = MongoPdfRepository;
