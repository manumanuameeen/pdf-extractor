import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) return this.transporter;

    // Use OAuth2 for Gmail to bypass Render SMTP port blocking
    // This uses HTTP (Port 443) internally via the googleapis library logic in nodemailer
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

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    try {
      const transporter = await this.getTransporter();
      
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to,
        subject: 'Your Authentication Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
            <h2>Your Authentication Code</h2>
            <p>Please use the following 6-digit code to verify your identity.</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 30px 0; padding: 15px; background: #f4f4f4; border-radius: 8px;">
              ${otp}
            </div>
            <p style="color: #e74c3c; font-weight: bold;">This code expires in 5 minutes. If you did not request this, please ignore this email.</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`OTP email sent via Gmail OAuth2 to ${to}`);
    } catch (error) {
      console.error('Failed to send OTP email via Gmail OAuth2:', error);
      
      // Fallback for development if credentials are missing
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV FALLBACK] OTP for ${to}: ${otp}`);
        return;
      }
      
      throw new Error('Failed to dispatch email. Please ensure Gmail OAuth2 configurations are correct.');
    }
  }
}
