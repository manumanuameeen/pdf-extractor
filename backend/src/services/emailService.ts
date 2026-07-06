import type { IEmailService, SendOtpResult } from '../contracts/index.js';

export class EmailService implements IEmailService {
  private async getAccessToken(): Promise<string> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GMAIL_CLIENT_ID!,
        client_secret: process.env.GMAIL_CLIENT_SECRET!,
        refresh_token: process.env.GMAIL_REFRESH_TOKEN!,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Failed to refresh Gmail access token:', data);
      throw new Error('Failed to refresh Gmail access token');
    }
    return data.access_token;
  }

  async sendOtp(to: string, otp: string): Promise<SendOtpResult> {
    try {
      const accessToken = await this.getAccessToken();
      const userEmail = process.env.GMAIL_USER;

      const subject = 'Your Authentication Code';
      const body = `Your verification OTP is ${otp}. It expires in 5 minutes.`;
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

      // Construct the email in RFC 2822 format
      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
      const messageParts = [
        `From: ${userEmail}`,
        `To: ${to}`,
        `Subject: ${utf8Subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        'Content-Transfer-Encoding: 7bit',
        '',
        htmlBody,
      ];
      const message = messageParts.join('\n');

      // The Gmail API requires the message to be base64url encoded
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const result = await fetch(`https://gmail.googleapis.com/gmail/v1/users/${userEmail}/messages/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodedMessage }),
      });

      const resultData = await result.json();
      if (!result.ok) {
        console.error('Gmail API send error:', resultData);
        throw new Error('Gmail API failed to send email');
      }

      console.log(`OTP email sent via Gmail HTTP API to ${to}`);
      return { delivered: true, devMode: false };
    } catch (error) {
      console.error('Failed to send OTP email via Gmail HTTP API:', error);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV FALLBACK] OTP for ${to}: ${otp}`);
        return { delivered: false, devMode: true };
      }
      throw new Error('Failed to dispatch email. Please ensure Gmail OAuth2 configurations are correct.');
    }
  }

  async sendPasswordResetOtp(to: string, otp: string): Promise<SendOtpResult> {
    return this.sendOtp(to, otp);
  }
}
