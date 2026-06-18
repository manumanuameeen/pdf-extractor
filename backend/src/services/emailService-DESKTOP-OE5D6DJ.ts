import nodemailer from 'nodemailer';
import type { IEmailService, SendOtpResult } from '../contracts/services.js';

export class EmailService implements IEmailService {
  private transporter: nodemailer.Transporter | null = null;

  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) return this.transporter;

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      },
    } as any);

    return this.transporter!;
  }

  async sendOtp(email: string, otp: string): Promise<SendOtpResult> {
    return this.sendOtpMail(email, otp, 'Verify your PDF Extractor account');
  }

  async sendPasswordResetOtp(email: string, otp: string): Promise<SendOtpResult> {
    return this.sendOtpMail(email, otp, 'Reset your PDF Extractor password');
  }

  private async sendOtpMail(email: string, otp: string, subject: string): Promise<SendOtpResult> {
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
}
