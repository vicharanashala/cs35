import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Otp } from '../../schemas/otp.schema';
import { EmailService } from './email.service';

@Injectable()
export class OtpService {
  constructor(
    @Optional()
    @InjectModel(Otp.name)
    private otpModel: Model<Otp> | undefined,
    @Optional()
    private emailService: EmailService,
  ) {}

  private get hasMongoDB() {
    return !!this.otpModel;
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async generateAndSend(email: string, username: string): Promise<void> {
    if (!this.hasMongoDB || !this.otpModel) return;

    const existing = await this.otpModel
      .findOneAndDelete({ email })
      .exec();

    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.otpModel.create({
      email,
      otp,
      expiresAt,
      verified: false,
    });

    if (this.emailService) {
      try {
        await this.emailService.sendOtp(email, otp);
      } catch (err) {
        console.warn('[OtpService] Failed to send OTP email:', err);
      }
    }
  }

  async verify(email: string, otp: string): Promise<boolean> {
    if (!this.hasMongoDB || !this.otpModel) return false;

    const record = await this.otpModel.findOne({ email, otp }).exec();
    if (!record) return false;
    if (new Date() > record.expiresAt) {
      await this.otpModel.deleteOne({ email }).exec();
      return false;
    }
    record.verified = true;
    await record.save();
    return true;
  }

  async invalidate(email: string): Promise<void> {
    if (!this.hasMongoDB || !this.otpModel) return;
    await this.otpModel.deleteOne({ email }).exec();
  }
}
