"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const resend_1 = require("resend");

class EmailService {
    resend = new resend_1.Resend(process.env.RESEND_API_KEY || 'dev_key');

    async sendOtp(email, otp) {
        return this.sendOtpMail(email, otp, 'Verify your PDF Extractor account');
    }

    async sendPasswordResetOtp(email, otp) {
        return this.sendOtpMail(email, otp, 'Reset your PDF Extractor password');
    }

    async sendOtpMail(email, otp, subject) {
        const apiKey = process.env.RESEND_API_KEY;
        const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'onboarding@resend.dev';

        if (!apiKey) {
            if (process.env.NODE_ENV === 'production') {
                throw new Error('RESEND_API_KEY is required in production');
            }
            console.log(`[DEV MODE] Email to ${email}: ${otp}`);
            return { delivered: false, devMode: true };
        }

        try {
            const { data, error } = await this.resend.emails.send({
                from: from,
                to: [email],
                subject,
                text: `Your verification OTP is ${otp}. It expires in 10 minutes.`,
                html: `<p>Your verification OTP is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`
            });

            if (error) {
                throw new Error(error.message);
            }

            console.log(`Email sent via Resend. ID: ${data?.id}`);
            return { delivered: true, devMode: false };
        } catch (error) {
            console.error('Resend dispatch failed:', error);
            throw new Error('Failed to dispatch email. Please ensure SMTP configurations are correct.');
        }
    }

    // Support the older method name used in the stack trace if needed
    async sendOtpEmail(to, otp) {
        const result = await this.sendOtpMail(to, otp, 'Your Authentication Code');
        if (!result.delivered && !result.devMode) {
            throw new Error('Failed to dispatch email.');
        }
    }
}
exports.EmailService = EmailService;
