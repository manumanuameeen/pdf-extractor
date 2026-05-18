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
import type { IUserRepository, IPdfRepository } from '../contracts/repositories.js';

/**
 * ARCHITECTURE: DI COMPOSITION ROOT
 * Purpose: Build concrete dependencies once and expose fully wired app layers.
 */
class AppDependencies {
  readonly userRepository: IUserRepository = process.env.MONGODB_URI ? new MongoUserRepository() : new UserRepository();
  readonly pdfRepository: IPdfRepository = process.env.MONGODB_URI ? new MongoPdfRepository() : new PdfRepository();

  readonly userMapper = new UserMapper();
  readonly pdfMapper = new PdfMapper();

  readonly authDtoValidator = new AuthDtoValidator();
  readonly pdfDtoValidator = new PdfDtoValidator();

  readonly emailService = new EmailService();
  readonly authService = new AuthService(this.userRepository, this.emailService, this.userMapper);
  readonly pdfService = new PdfService();

  readonly authController = new AuthController(this.authService, this.authDtoValidator);
  readonly pdfController = new PdfController(
    this.pdfService,
    this.pdfRepository,
    this.pdfDtoValidator,
    this.pdfMapper
  );

  readonly authenticationMiddleware = new AuthenticationMiddleware(this.authService);
  readonly multerConfig = new MulterConfig();
  readonly upload = this.multerConfig.createUpload();

  readonly authRoutes = new AuthRoutes(this.authController, this.authenticationMiddleware.handle).router;
  readonly pdfRoutes = new PdfRoutes(
    this.pdfController,
    this.authenticationMiddleware.handle,
    this.upload
  ).router;

  readonly cleanupJob = new CleanupJob();
  readonly databaseConnection = new DatabaseConnection();
}

export const appDependencies = new AppDependencies();
