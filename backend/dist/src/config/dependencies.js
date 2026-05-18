import { AuthController } from '../controllers/authController.js';
import { PdfController } from '../controllers/pdfController.js';
import { AuthDtoValidator } from '../dtos/authDtos.js';
import { PdfDtoValidator } from '../dtos/pdfDtos.js';
import { PdfMapper } from '../mappers/pdfMapper.js';
import { UserMapper } from '../mappers/userMapper.js';
import { AuthenticationMiddleware } from '../middleware/authenticate.js';
import { PdfRepository } from '../repositories/pdfRepository.js';
import { UserRepository } from '../repositories/userRepository.js';
import { MongoPdfRepository } from '../repositories/mongoPdfRepository.js';
import { MongoUserRepository } from '../repositories/mongoUserRepository.js';
import { AuthRoutes } from '../routes/authRoutes.js';
import { PdfRoutes } from '../routes/pdfRoutes.js';
import { AuthService } from '../services/authService.js';
import { EmailService } from '../services/emailService.js';
import { PdfService } from '../services/pdfService.js';
import { CleanupJob } from '../utils/cleanup.js';
import { DatabaseConnection } from './database.js';
import { MulterConfig } from './multer.js';
/**
 * ARCHITECTURE: DI COMPOSITION ROOT
 * Purpose: Build concrete dependencies once and expose fully wired app layers.
 */
class AppDependencies {
    userRepository = process.env.MONGODB_URI ? new MongoUserRepository() : new UserRepository();
    pdfRepository = process.env.MONGODB_URI ? new MongoPdfRepository() : new PdfRepository();
    userMapper = new UserMapper();
    pdfMapper = new PdfMapper();
    authDtoValidator = new AuthDtoValidator();
    pdfDtoValidator = new PdfDtoValidator();
    emailService = new EmailService();
    authService = new AuthService(this.userRepository, this.emailService, this.userMapper);
    pdfService = new PdfService();
    authController = new AuthController(this.authService, this.authDtoValidator);
    pdfController = new PdfController(this.pdfService, this.pdfRepository, this.pdfDtoValidator, this.pdfMapper);
    authenticationMiddleware = new AuthenticationMiddleware(this.authService);
    multerConfig = new MulterConfig();
    upload = this.multerConfig.createUpload();
    authRoutes = new AuthRoutes(this.authController, this.authenticationMiddleware.handle).router;
    pdfRoutes = new PdfRoutes(this.pdfController, this.authenticationMiddleware.handle, this.upload).router;
    cleanupJob = new CleanupJob();
    databaseConnection = new DatabaseConnection();
}
export const appDependencies = new AppDependencies();
