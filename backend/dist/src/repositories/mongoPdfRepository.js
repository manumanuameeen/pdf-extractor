"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoPdfRepository = void 0;
const pdfModel_js_1 = __importDefault(require("../models/pdfModel.js"));
const mongoBaseRepository_js_1 = require("./mongoBaseRepository.js");
function mapToPdfRecord(doc) {
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
function mapToPdfDoc(record) {
    return {
        _id: record.id,
        userId: record.userId,
        originalName: record.originalName,
        size: record.size,
        pageCount: record.pageCount,
        path: record.path
    };
}
class MongoPdfRepository extends mongoBaseRepository_js_1.MongoBaseRepository {
    constructor() {
        super(pdfModel_js_1.default, mapToPdfRecord, mapToPdfDoc);
    }
    async findOwnedByUser(id, userId) {
        const doc = await pdfModel_js_1.default.findOne({ _id: id, userId });
        return doc ? mapToPdfRecord(doc) : null;
    }
    async findByUserId(userId) {
        const docs = await pdfModel_js_1.default.find({ userId }).sort({ createdAt: -1 });
        return docs.map(doc => mapToPdfRecord(doc));
    }
    async delete(id) {
        const result = await pdfModel_js_1.default.deleteOne({ _id: id });
        return result.deletedCount > 0;
    }
}
exports.MongoPdfRepository = MongoPdfRepository;
