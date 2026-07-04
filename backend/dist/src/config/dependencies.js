"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appDependencies = exports.AppDependencies = void 0;
const authController_js_1 = require("../controllers/authController.js");
const pdfController_js_1 = require("../controllers/pdfController.js");
const pdfDtos_js_1 = require("../dtos/pdfDtos.js");
const pdfMapper_js_1 = require("../mappers/pdfMapper.js");
const userMapper_js_1 = require("../mappers/userMapper.js");
const authenticate_js_1 = require("../middleware/authenticate.js");
const mongoPdfRepository_js_1 = require("../repositories/mongoPdfRepository.js");
const mongoUserRepository_js_1 = require("../repositories/mongoUserRepository.js");
const authRoutes_js_1 = require("../routes/authRoutes.js");
const pdfRoutes_js_1 = require("../routes/pdfRoutes.js");
const authService_js_1 = require("../services/authService.js");
const emailService_js_1 = require("../services/emailService.js");
const pdfService_js_1 = require("../services/pdfService.js");
const cleanup_js_1 = require("../utils/cleanup.js");
const database_js_1 = require("./database.js");
const multer_js_1 = require("./multer.js");
const authDtos_js_1 = __importDefault(require("../dtos/authDtos.js"));
/**
 * ARCHITECTURE: DEPENDENCY INJECTION/CONTAINER
 * Purpose: Manage instantiation and lifetime of all application services.
 */
class AppDependencies {
    databaseConnection = new database_js_1.DatabaseConnection();
    /**
     * PERSISTENCE LAYER CONFIGURATION
     * We exclusively use MongoUserRepository and MongoPdfRepository to enforce MongoDB persistence.
     */
    userRepository = new mongoUserRepository_js_1.MongoUserRepository();
    pdfRepository = new mongoPdfRepository_js_1.MongoPdfRepository();
    userMapper = new userMapper_js_1.UserMapper();
    pdfMapper = new pdfMapper_js_1.PdfMapper();
    pdfDtoValidator = new pdfDtos_js_1.PdfDtoValidator();
    emailService = new emailService_js_1.EmailService();
    authService = new authService_js_1.AuthService(this.userRepository, this.emailService, this.userMapper);
    pdfService = new pdfService_js_1.PdfService(this.pdfRepository);
    authController = new authController_js_1.AuthController(this.authService, authDtos_js_1.default);
    pdfController = new pdfController_js_1.PdfController(this.pdfService, this.pdfRepository, this.pdfDtoValidator, this.pdfMapper);
    authenticationMiddleware = new authenticate_js_1.AuthenticationMiddleware(this.authService);
    multerConfig = new multer_js_1.MulterConfig();
    upload = this.multerConfig.createUpload();
    authRoutes = new authRoutes_js_1.AuthRoutes(this.authController, this.authenticationMiddleware.handle).router;
    pdfRoutes = new pdfRoutes_js_1.PdfRoutes(this.pdfController, this.authenticationMiddleware.handle, this.upload).router;
    cleanupJob = new cleanup_js_1.CleanupJob();
}
exports.AppDependencies = AppDependencies;
exports.appDependencies = new AppDependencies();
