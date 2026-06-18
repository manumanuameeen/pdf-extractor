import { Resend } from 'resend';

export class EmailService {
  private resend: Resend;

  constructor() {
    // Initialize Resend with the API key from environment variables
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey && process.env.NODE_ENV === 'production') {
      console.warn('RESEND_API_KEY is not set in production. Email sending will fail.');
    }
    this.resend = new Resend(apiKey || 'dev_key');
  }

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'onboarding@resend.dev';
    
    try {
      const { data, error } = await this.resend.emails.send({
        from: from,
        to: [to],
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
      });

      if (error) {
        console.error('Resend API Error:', error);
        throw new Error(error.message);
      }

      console.log(`OTP email sent successfully to ${to}. ID: ${data?.id}`);
    } catch (error) {
      console.error('Failed to send OTP email via Resend:', error);
      throw new Error('Failed to dispatch email. Please ensure email configurations are correct.');
    }
  }
}
