"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const node_path_1 = __importDefault(require("node:path"));
const jsonFileRepository_js_1 = require("./jsonFileRepository.js");
class UserRepository extends jsonFileRepository_js_1.JsonFileRepository {
    constructor() {
        super(node_path_1.default.join(process.cwd(), 'data', 'users.json'));
    }
    async findByEmail(email) {
        const users = await this.findAll();
        return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
    }
    async findByRefreshToken(refreshToken) {
        const users = await this.findAll();
        for (const user of users) {
            if (!user.refreshTokenHash) {
                continue;
            }
            if (await bcryptjs_1.default.compare(refreshToken, user.refreshTokenHash)) {
                return user;
            }
        }
        return null;
    }
}
exports.UserRepository = UserRepository;
