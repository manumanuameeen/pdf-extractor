import { MongoUserRepository } from '../repositories/mongoUserRepository.js';
import { MongoPdfRepository } from '../repositories/mongoPdfRepository.js';
import { AuthService } from '../services/authService.js';
import { EmailService } from '../services/emailService.js';
import { PdfService } from '../services/pdfService.js';
import { AuthController } from '../controllers/authController.js';
import { PdfController } from '../controllers/pdfController.js';
import pdfDtoValidator from '../dtos/pdfDtos.js';
import authDtoValidator from '../dtos/authDtos.js';
import userMapper from '../mappers/userMapper.js';
import pdfMapper from '../mappers/pdfMapper.js';
import type { IUserRepository, IPdfRepository, IPdfService } from '../contracts/index.js';

class DIContainer {
  private _userRepository?: IUserRepository;
  private _pdfRepository?: IPdfRepository;
  private _emailService?: EmailService;
  private _authService?: AuthService;
  private _pdfService?: IPdfService;
  private _authController?: AuthController;
  private _pdfController?: PdfController;

  get userRepository(): IUserRepository {
    this._userRepository ??= new MongoUserRepository();
    return this._userRepository;
  }

  get pdfRepository(): IPdfRepository {
    this._pdfRepository ??= new MongoPdfRepository();
    return this._pdfRepository;
  }

  get emailService(): EmailService {
    this._emailService ??= new EmailService();
    return this._emailService;
  }

  get authService(): AuthService {
    this._authService ??= new AuthService(
      this.userRepository,
      this.emailService,
      userMapper
    );
    return this._authService;
  }

  get pdfService(): IPdfService {
    this._pdfService ??= new PdfService(this.pdfRepository);
    return this._pdfService;
  }

  get authController(): AuthController {
    this._authController ??= new AuthController(
      this.authService,
      authDtoValidator
    );
    return this._authController;
  }

  get pdfController(): PdfController {
    this._pdfController ??= new PdfController(
      this.pdfService,
      this.pdfRepository,
      pdfDtoValidator,
      pdfMapper
    );
    return this._pdfController;
  }
}

export const container = new DIContainer();
