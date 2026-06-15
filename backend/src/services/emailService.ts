import dns from 'node:dns';
import nodemailer from 'nodemailer';

// Force Node's DNS resolver to prefer IPv4 over IPv6. 
// This fixes the 'ENETUNREACH' error on platforms like Render where outbound IPv6 to Gmail SMTP might fail.
dns.setDefaultResultOrder('ipv4first');
import { AUTH_LIMITS, SMTP_DEFAULTS } from '../constants/config.js';
import { AUTH_MESSAGES, SYSTEM_MESSAGES } from '../constants/messages.js';
import type { IEmailService, SendOtpResult } from '../contracts/services.js';

export class EmailService implements IEmailService {
  private transporter: nodemailer.Transporter | null = null;

  async sendOtp(email: string, otp: string): Promise<SendOtpResult> {
    return this.sendOtpMail(email, otp, 'Verify your PDF Extractor account');
  }

  async sendPasswordResetOtp(email: string, otp: string): Promise<SendOtpResult> {
    return this.sendOtpMail(email, otp, 'Reset your PDF Extractor password');
  }

  private async sendOtpMail(email: string, otp: string, subject: string): Promise<SendOtpResult> {
    const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
    const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || SMTP_DEFAULTS.PORT);
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || user;

    if (!host || !user || !pass || !from) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(AUTH_MESSAGES.EMAIL_CONFIGURATION_REQUIRED);
      }

      console.log(SYSTEM_MESSAGES.DEV_OTP_LOG.replace('{email}', email).replace('{otp}', otp));
      return { delivered: false, devMode: true };
    }

    // Lazily create and reuse a pooled transporter to avoid connecting on every request
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        pool: true,
        host,
        port,
        secure: port === SMTP_DEFAULTS.SECURE_PORT,
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
      text: `Your verification OTP is ${otp}. It expires in ${AUTH_LIMITS.OTP_EXPIRY_MINUTES} minutes.`,
      html: `<p>Your verification OTP is <strong>${otp}</strong>.</p><p>It expires in ${AUTH_LIMITS.OTP_EXPIRY_MINUTES} minutes.</p>`
    });
    const took = Date.now() - start;
    if (took > 2000) {
      console.warn(`Slow email send: ${took}ms for ${email}`);
    }

    return { delivered: true, devMode: false };
  }
}
