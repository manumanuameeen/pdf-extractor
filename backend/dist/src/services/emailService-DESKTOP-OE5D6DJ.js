"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_js_1 = require("../constants/config.js");
const messages_js_1 = require("../constants/messages.js");
class EmailService {
    async sendOtp(email, otp) {
        return this.sendOtpMail(email, otp, 'Verify your PDF Extractor account');
    }
    async sendPasswordResetOtp(email, otp) {
        return this.sendOtpMail(email, otp, 'Reset your PDF Extractor password');
    }
    async sendOtpMail(email, otp, subject) {
        const host = process.env.SMTP_HOST;
        const port = Number(process.env.SMTP_PORT || config_js_1.SMTP_DEFAULTS.PORT);
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        const from = process.env.SMTP_FROM || user;
        if (!host || !user || !pass || !from) {
            console.log(messages_js_1.SYSTEM_MESSAGES.DEV_OTP_LOG.replace('{email}', email).replace('{otp}', otp));
            return { delivered: false, devMode: true };
        }
        const transporter = nodemailer_1.default.createTransport({
            host,
            port,
            secure: port === config_js_1.SMTP_DEFAULTS.SECURE_PORT,
            auth: { user, pass }
        });
        await transporter.sendMail({
            from,
            to: email,
            subject,
            text: `Your verification OTP is ${otp}. It expires in 10 minutes.`,
            html: `<p>Your verification OTP is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`
        });
        return { delivered: true, devMode: false };
    }
}
exports.EmailService = EmailService;
