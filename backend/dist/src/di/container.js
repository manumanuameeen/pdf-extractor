import { UserRepository } from '../repositories/userRepository.js';
import { PdfRepository } from '../repositories/pdfRepository.js';
import { EmailService } from '../services/emailService.js';
import { AuthService } from '../services/authService.js';
import { PdfService } from '../services/pdfService.js';
import { AuthController } from '../controllers/authController.js';
import { PdfController } from '../controllers/pdfController.js';
import authDtoValidator from '../dtos/authDtos.js';
import pdfDtoValidator from '../dtos/pdfDtos.js';
import userMapper from '../mappers/userMapper.js';
import pdfMapper from '../mappers/pdfMapper.js';
class DIContainer {
    _userRepository;
    _pdfRepository;
    _emailService;
    _authService;
    _pdfService;
    _authController;
    _pdfController;
    get userRepository() {
        this._userRepository ??= new UserRepository();
        return this._userRepository;
    }
    get pdfRepository() {
        this._pdfRepository ??= new PdfRepository();
        return this._pdfRepository;
    }
    get emailService() {
        this._emailService ??= new EmailService();
        return this._emailService;
    }
    get authService() {
        this._authService ??= new AuthService(this.userRepository, this.emailService, userMapper);
        return this._authService;
    }
    get pdfService() {
        this._pdfService ??= new PdfService();
        return this._pdfService;
    }
    get authController() {
        this._authController ??= new AuthController(this.authService, authDtoValidator);
        return this._authController;
    }
    get pdfController() {
        this._pdfController ??= new PdfController(this.pdfService, this.pdfRepository, pdfDtoValidator, pdfMapper);
        return this._pdfController;
    }
}
export const container = new DIContainer();
