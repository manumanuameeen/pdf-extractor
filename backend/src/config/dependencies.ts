import { AuthController } from '../controllers/authController.js';
import { PdfController } from '../controllers/pdfController.js';
import { PdfDtoValidator } from '../dtos/pdfDtos.js';
import { PdfMapper } from '../mappers/pdfMapper.js';
import { UserMapper } from '../mappers/userMapper.js';
import { AuthenticationMiddleware } from '../middleware/authenticate.js';
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
import type { IUserRepository, IPdfRepository } from '../contracts/index.js';
import authDtoValidator from '../dtos/authDtos.js';

/**
 * ARCHITECTURE: DEPENDENCY INJECTION/CONTAINER
 * Purpose: Manage instantiation and lifetime of all application services.
 */
export class AppDependencies {
  readonly databaseConnection = new DatabaseConnection();

  /**
   * PERSISTENCE LAYER CONFIGURATION
   * We exclusively use MongoUserRepository and MongoPdfRepository to enforce MongoDB persistence.
   */
  readonly userRepository: IUserRepository = new MongoUserRepository();
  readonly pdfRepository: IPdfRepository = new MongoPdfRepository();

  readonly userMapper = new UserMapper();
  readonly pdfMapper = new PdfMapper();

  readonly pdfDtoValidator = new PdfDtoValidator();

  readonly emailService = new EmailService();
  readonly authService = new AuthService(this.userRepository, this.emailService, this.userMapper);
  readonly pdfService = new PdfService(this.pdfRepository);

  readonly authController = new AuthController(this.authService, authDtoValidator);
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
}

export const appDependencies = new AppDependencies();
