"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));

class EmailService {
    transporter = null;

    async getTransporter() {
        if (this.transporter) return this.transporter;
        this.transporter = nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.GMAIL_USER,
                clientId: process.env.GMAIL_CLIENT_ID,
                clientSecret: process.env.GMAIL_CLIENT_SECRET,
                refreshToken: process.env.GMAIL_REFRESH_TOKEN,
            },
        });
        return this.transporter;
    }

    async sendOtp(email, otp) {
        return this.sendOtpMail(email, otp, 'Verify your PDF Extractor account');
    }

    async sendPasswordResetOtp(email, otp) {
        return this.sendOtpMail(email, otp, 'Reset your PDF Extractor password');
    }

    async sendOtpMail(email, otp, subject) {
        const isProduction = process.env.NODE_ENV === 'production';
        const hasCreds = process.env.GMAIL_REFRESH_TOKEN && process.env.GMAIL_CLIENT_ID;

        if (!hasCreds) {
            if (isProduction) {
                throw new Error('Gmail OAuth2 credentials are required in production');
            }
            console.log(`[DEV MODE] Email to ${email}: ${otp}`);
            return { delivered: false, devMode: true };
        }

        try {
            const transporter = await this.getTransporter();
            await transporter.sendMail({
                from: process.env.GMAIL_USER,
                to: email,
                subject,
                text: `Your verification OTP is ${otp}. It expires in 10 minutes.`,
                html: `<p>Your verification OTP is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`
            });
            console.log(`Email sent via Gmail OAuth2 to ${email}`);
            return { delivered: true, devMode: false };
        } catch (error) {
            console.error('Gmail OAuth2 dispatch failed:', error);
            throw new Error('Failed to dispatch email. Please ensure Gmail OAuth2 configurations are correct.');
        }
    }

    async sendOtpEmail(to, otp) {
        const result = await this.sendOtpMail(to, otp, 'Your Authentication Code');
        if (!result.delivered && !result.devMode) {
            throw new Error('Failed to dispatch email.');
        }
    }
}
exports.EmailService = EmailService;
