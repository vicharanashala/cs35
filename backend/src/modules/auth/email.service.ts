import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER || 'asksamportal@gmail.com',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  async sendOtp(email: string, otp: string): Promise<void> {
    await this.transporter.sendMail({
      from: '"AskSam Portal" <asksamportal@gmail.com>',
      to: email,
      subject: 'Your AskSam OTP Code',
      html: `
        <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #F5F7F2; border-radius: 16px;">
          <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #E2E8DE;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="font-size: 24px; font-weight: 700; color: #1F2937; margin: 0;">AskSam Portal</h1>
              <p style="font-size: 14px; color: #6B7280; margin: 4px 0 0;">Verify your email address</p>
            </div>
            <p style="font-size: 15px; color: #374151; line-height: 1.6; margin: 0 0 20px;">Your one-time verification code is:</p>
            <div style="background: #f0f4ef; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 36px; font-weight: 700; color: #5E7A5A; letter-spacing: 8px;">${otp}</span>
            </div>
            <p style="font-size: 13px; color: #9CA3AF; text-align: center; margin: 0;">This code expires in <strong style="color: #374151;">10 minutes</strong>. Do not share it with anyone.</p>
          </div>
          <p style="font-size: 12px; color: #9CA3AF; text-align: center; margin: 16px 0 0;">You received this because you signed up for AskSam Portal. If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });
  }
}
