import nodemailer from 'nodemailer';
import { SMTP_DEFAULTS } from '../constants/config.js';
import { SYSTEM_MESSAGES } from '../constants/messages.js';
export class EmailService {
    async sendOtp(email, otp) {
        return this.sendOtpMail(email, otp, 'Verify your PDF Extractor account');
    }
    async sendPasswordResetOtp(email, otp) {
        return this.sendOtpMail(email, otp, 'Reset your PDF Extractor password');
    }
    async sendOtpMail(email, otp, subject) {
        const host = process.env.SMTP_HOST;
        const port = Number(process.env.SMTP_PORT || SMTP_DEFAULTS.PORT);
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        const from = process.env.SMTP_FROM || user;
        if (!host || !user || !pass || !from) {
            console.log(SYSTEM_MESSAGES.DEV_OTP_LOG.replace('{email}', email).replace('{otp}', otp));
            return { delivered: false, devMode: true };
        }
        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === SMTP_DEFAULTS.SECURE_PORT,
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
