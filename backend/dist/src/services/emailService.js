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
    transporter = null;
    async sendOtp(email, otp) {
        return this.sendOtpMail(email, otp, 'Verify your PDF Extractor account');
    }
    async sendPasswordResetOtp(email, otp) {
        return this.sendOtpMail(email, otp, 'Reset your PDF Extractor password');
    }
    async sendOtpMail(email, otp, subject) {
        const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
        const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || config_js_1.SMTP_DEFAULTS.PORT);
        const user = process.env.SMTP_USER || process.env.EMAIL_USER;
        const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
        const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || user;
        if (!host || !user || !pass || !from) {
            if (process.env.NODE_ENV === 'production') {
                throw new Error(messages_js_1.AUTH_MESSAGES.EMAIL_CONFIGURATION_REQUIRED);
            }
            console.log(messages_js_1.SYSTEM_MESSAGES.DEV_OTP_LOG.replace('{email}', email).replace('{otp}', otp));
            return { delivered: false, devMode: true };
        }
        // Lazily create and reuse a pooled transporter to avoid connecting on every request
        if (!this.transporter) {
            this.transporter = nodemailer_1.default.createTransport({
                pool: true,
                host,
                port,
                secure: port === config_js_1.SMTP_DEFAULTS.SECURE_PORT,
                auth: { user, pass },
                maxConnections: 5,
                maxMessages: 100,
                // Timeouts to fail fast on network issues
                connectionTimeout: 5000,
                greetingTimeout: 5000,
                socketTimeout: 10000
            });
        }
        const start = Date.now();
        await this.transporter.sendMail({
            from,
            to: email,
            subject,
            text: `Your verification OTP is ${otp}. It expires in ${config_js_1.AUTH_LIMITS.OTP_EXPIRY_MINUTES} minutes.`,
            html: `<p>Your verification OTP is <strong>${otp}</strong>.</p><p>It expires in ${config_js_1.AUTH_LIMITS.OTP_EXPIRY_MINUTES} minutes.</p>`
        });
        const took = Date.now() - start;
        if (took > 2000) {
            console.warn(`Slow email send: ${took}ms for ${email}`);
        }
        return { delivered: true, devMode: false };
    }
}
exports.EmailService = EmailService;
