import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465, 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_USER,
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

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`OTP email sent to ${to}`);
    } catch (error) {
      console.error('Failed to send OTP email via Nodemailer:', error);
      throw new Error('Failed to dispatch email. Please ensure SMTP configurations are correct.');
    }
  }
}
