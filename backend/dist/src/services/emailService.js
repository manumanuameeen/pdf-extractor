"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;

class EmailService {
    async getAccessToken() {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.GMAIL_CLIENT_ID,
                client_secret: process.env.GMAIL_CLIENT_SECRET,
                refresh_token: process.env.GMAIL_REFRESH_TOKEN,
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
            const accessToken = await this.getAccessToken();
            const userEmail = process.env.GMAIL_USER;
            const htmlBody = `<p>Your verification OTP is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`;
            const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
            const messageParts = [
                `From: ${userEmail}`,
                `To: ${email}`,
                `Subject: ${utf8Subject}`,
                'MIME-Version: 1.0',
                'Content-Type: text/html; charset=utf-8',
                'Content-Transfer-Encoding: 7bit',
                '',
                htmlBody,
            ];
            const message = messageParts.join('\n');
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
            if (!result.ok) {
                const resultData = await result.json();
                console.error('Gmail API send error:', resultData);
                throw new Error('Gmail API failed to send email');
            }
            console.log(`Email sent via Gmail HTTP API to ${email}`);
            return { delivered: true, devMode: false };
        } catch (error) {
            console.error('Gmail HTTP dispatch failed:', error);
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
