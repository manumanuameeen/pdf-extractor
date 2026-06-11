"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.container = void 0;
const userRepository_js_1 = require("../repositories/userRepository.js");
const pdfRepository_js_1 = require("../repositories/pdfRepository.js");
const emailService_js_1 = require("../services/emailService.js");
const authService_js_1 = require("../services/authService.js");
const pdfService_js_1 = require("../services/pdfService.js");
const authController_js_1 = require("../controllers/authController.js");
const pdfController_js_1 = require("../controllers/pdfController.js");
const authDtos_js_1 = __importDefault(require("../dtos/authDtos.js"));
const pdfDtos_js_1 = __importDefault(require("../dtos/pdfDtos.js"));
const userMapper_js_1 = __importDefault(require("../mappers/userMapper.js"));
const pdfMapper_js_1 = __importDefault(require("../mappers/pdfMapper.js"));
class DIContainer {
    _userRepository;
    _pdfRepository;
    _emailService;
    _authService;
    _pdfService;
    _authController;
    _pdfController;
    get userRepository() {
        this._userRepository ??= new userRepository_js_1.UserRepository();
        return this._userRepository;
    }
    get pdfRepository() {
        this._pdfRepository ??= new pdfRepository_js_1.PdfRepository();
        return this._pdfRepository;
    }
    get emailService() {
        this._emailService ??= new emailService_js_1.EmailService();
        return this._emailService;
    }
    get authService() {
        this._authService ??= new authService_js_1.AuthService(this.userRepository, this.emailService, userMapper_js_1.default);
        return this._authService;
    }
    get pdfService() {
        this._pdfService ??= new pdfService_js_1.PdfService();
        return this._pdfService;
    }
    get authController() {
        this._authController ??= new authController_js_1.AuthController(this.authService, authDtos_js_1.default);
        return this._authController;
    }
    get pdfController() {
        this._pdfController ??= new pdfController_js_1.PdfController(this.pdfService, this.pdfRepository, pdfDtos_js_1.default, pdfMapper_js_1.default);
        return this._pdfController;
    }
}
exports.container = new DIContainer();
