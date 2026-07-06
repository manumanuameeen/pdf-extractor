import nodemailer from 'nodemailer';
import dns from 'dns';
import type { IEmailService, SendOtpResult } from '../contracts/index.js';

// Fix for Render IPv6 ENETUNREACH errors: force Node to resolve IPv4 addresses first
dns.setDefaultResultOrder('ipv4first');

export class EmailService implements IEmailService {
  private getTransporter() {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT || 587),
      secure: false, // true for 465, false for other ports (587)
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendOtp(to: string, otp: string): Promise<SendOtpResult> {
    try {
      const transporter = this.getTransporter();
      const userEmail = process.env.EMAIL_USER;

      const subject = 'Your Authentication Code';
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
          <h2>Your Authentication Code</h2>
          <p>Please use the following 6-digit code to verify your identity.</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 30px 0; padding: 15px; background: #f4f4f4; border-radius: 8px;">
            ${otp}
          </div>
          <p style="color: #e74c3c; font-weight: bold;">This code expires in 5 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `;

      await transporter.sendMail({
        from: `"PDF Extractor Support" <${userEmail}>`,
        to,
        subject,
        html: htmlBody,
      });

      console.log(`OTP email sent via SMTP to ${to}`);
      return { delivered: true, devMode: false };
    } catch (error) {
      console.error('Failed to send OTP email via SMTP:', error);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV FALLBACK] OTP for ${to}: ${otp}`);
        return { delivered: false, devMode: true };
      }
      throw new Error('Failed to dispatch email. Please ensure your SMTP email and password credentials are correct.');
    }
  }

  async sendPasswordResetOtp(to: string, otp: string): Promise<SendOtpResult> {
    return this.sendOtp(to, otp);
  }
}
