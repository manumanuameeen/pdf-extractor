"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appDependencies = void 0;
const authController_js_1 = require("../controllers/authController.js");
const pdfController_js_1 = require("../controllers/pdfController.js");
const pdfDtos_js_1 = require("../dtos/pdfDtos.js");
const pdfMapper_js_1 = require("../mappers/pdfMapper.js");
const userMapper_js_1 = require("../mappers/userMapper.js");
const authenticate_js_1 = require("../middleware/authenticate.js");
const pdfRepository_js_1 = require("../repositories/pdfRepository.js");
const userRepository_js_1 = require("../repositories/userRepository.js");
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
/**
 * ARCHITECTURE: DI COMPOSITION ROOT
 * Purpose: Build concrete dependencies once and expose fully wired app layers.
 */
class AppDependencies {
    /**
     * PERSISTENCE LAYER CONFIGURATION
     *
     * The backend supports two storage engines: MongoDB (Production/Staging) and JSON file fallback (Local Dev).
     * Here, we check for the existence of MONGODB_URI in the environment variables:
     * - If MONGODB_URI exists: We connect to the remote MongoDB instance using Mongoose and use Mongo-based repositories.
     * - If MONGODB_URI is empty: We fall back to saving/reading data inside the local 'data/' folder using JSON files.
     *
     * Since process.env.MONGODB_URI is defined in .env, MongoDB is used automatically to persist all data.
     */
    userRepository = process.env.MONGODB_URI ? new mongoUserRepository_js_1.MongoUserRepository() : new userRepository_js_1.UserRepository();
    pdfRepository = process.env.MONGODB_URI ? new mongoPdfRepository_js_1.MongoPdfRepository() : new pdfRepository_js_1.PdfRepository();
    userMapper = new userMapper_js_1.UserMapper();
    pdfMapper = new pdfMapper_js_1.PdfMapper();
    pdfDtoValidator = new pdfDtos_js_1.PdfDtoValidator();
    emailService = new emailService_js_1.EmailService();
    authService = new authService_js_1.AuthService(this.userRepository, this.emailService, this.userMapper);
    pdfService = new pdfService_js_1.PdfService(this.pdfRepository);
    authController = new authController_js_1.AuthController(this.authService);
    pdfController = new pdfController_js_1.PdfController(this.pdfService, this.pdfRepository, this.pdfDtoValidator, this.pdfMapper);
    authenticationMiddleware = new authenticate_js_1.AuthenticationMiddleware(this.authService);
    multerConfig = new multer_js_1.MulterConfig();
    upload = this.multerConfig.createUpload();
    authRoutes = new authRoutes_js_1.AuthRoutes(this.authController, this.authenticationMiddleware.handle).router;
    pdfRoutes = new pdfRoutes_js_1.PdfRoutes(this.pdfController, this.authenticationMiddleware.handle, this.upload).router;
    cleanupJob = new cleanup_js_1.CleanupJob();
    databaseConnection = new database_js_1.DatabaseConnection();
}
exports.appDependencies = new AppDependencies();
