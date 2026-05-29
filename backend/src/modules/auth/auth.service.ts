import * as bcrypt from 'bcrypt';
import { EmailService } from './email.service';
import { Injectable, Inject, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../schemas/user.schema';
import { Otp } from '../../schemas/otp.schema';

@Injectable()
export class AuthService {
  private mongoConnected = false;

  constructor(
    @Optional() @InjectModel(User.name) private userModel: Model<User> | undefined,
    @Optional() @InjectModel(Otp.name) private otpModel: Model<Otp> | undefined,
    @Optional() private emailService: EmailService,
  ) {
    if (this.userModel && this.otpModel) {
      this.mongoConnected = true;
    }
  }

  private get hasMongoDB() {
    return this.mongoConnected;
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOtp(email: string): Promise<{ success: boolean; message: string }> {
    if (!this.hasMongoDB) {
      return { success: true, message: 'OTP sent (demo mode)' };
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: 'Only @gmail.com addresses are allowed' };
    }

    try {
      const existingUser = await this.userModel.findOne({ email }).exec();
      if (existingUser) {
        return { success: false, message: 'Email already registered. Please login instead.' };
      }

      await this.otpModel.deleteMany({ email }).exec();

      const otp = this.generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await this.otpModel.create({
        email,
        otp: await bcrypt.hash(otp, 10),
        expiresAt,
        verified: false,
      });

      if (this.emailService) {
        await this.emailService.sendOtp(email, otp);
      }

      return { success: true, message: 'OTP sent to your email' };
    } catch (err) {
      return { success: false, message: 'Failed to send OTP. Try again.' };
    }
  }

  async verifyOtp(email: string, otp: string): Promise<{ success: boolean; message: string }> {
    if (!this.hasMongoDB) {
      return { success: true, message: 'OTP verified (demo mode)' };
    }

    try {
      const otpDoc = await this.otpModel.findOne({ email, verified: false }).exec();
      if (!otpDoc) {
        return { success: false, message: 'No pending verification found. Please sign up first.' };
      }

      if (new Date() > otpDoc.expiresAt) {
        return { success: false, message: 'OTP has expired. Please request a new one.' };
      }

      const isMatch = await bcrypt.compare(otp, otpDoc.otp);
      if (!isMatch) {
        return { success: false, message: 'Invalid OTP. Please try again.' };
      }

      otpDoc.verified = true;
      await otpDoc.save();

      return { success: true, message: 'Email verified successfully' };
    } catch (err) {
      return { success: false, message: 'Verification failed. Try again.' };
    }
  }

  async signup(data: { email: string; password: string; name: string }): Promise<{ success: boolean; message: string; token?: string }> {
    if (!this.hasMongoDB) {
      return { success: true, message: 'Signup successful (demo mode)', token: 'demo-token' };
    }

    try {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      if (!emailRegex.test(data.email)) {
        return { success: false, message: 'Only @gmail.com addresses are allowed' };
      }

      const existingUser = await this.userModel.findOne({ email: data.email }).exec();
      if (existingUser) {
        return { success: false, message: 'Email already registered. Please login.' };
      }

      const otpDoc = await this.otpModel.findOne({ email: data.email, verified: true }).exec();
      if (!otpDoc) {
        return { success: false, message: 'Email not verified. Please complete OTP verification first.' };
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      let studentId: string | undefined;
      if (this.userModel) {
        const lastUser = await this.userModel.findOne({ role: 'student', studentId: { $exists: true } }).sort({ studentId: -1 }).exec();
        const lastNum = lastUser?.studentId ? parseInt(lastUser.studentId.replace('STU-', ''), 10) : 0;
        studentId = `STU-${String(lastNum + 1).padStart(5, '0')}`;
      }

      await this.userModel.create({
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: 'student',
        isActive: true,
        studentId,
        questionsAsked: [],
        questionsAnswered: [],
        questionsBookmarked: [],
      });

      await this.otpModel.deleteMany({ email: data.email }).exec();

      const token = Buffer.from(`${data.email}:${Date.now()}`).toString('base64');
      return { success: true, message: 'Account created successfully', token };
    } catch (err) {
      return { success: false, message: 'Signup failed. Please try again.' };
    }
  }

  async login(email: string, password: string, role: 'student' | 'admin'): Promise<{ success: boolean; message: string; token?: string; name?: string }> {
    if (!this.hasMongoDB) {
      if (email === 'admin@asksam.com' && password === 'admin123') {
        return { success: true, message: 'Login successful', token: 'admin-demo-token', name: 'Admin' };
      }
      if (role === 'admin') {
        return { success: false, message: 'Invalid admin credentials' };
      }
      return { success: true, message: 'Login successful (demo mode)', token: 'demo-token', name: 'Student' };
    }

    try {
      const user = await this.userModel.findOne({ email, role, isActive: true }).exec();
      if (!user) {
        return { success: false, message: role === 'admin' ? 'Invalid admin credentials' : 'Account not found. Please sign up.' };
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return { success: false, message: 'Incorrect password' };
      }

      const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');
      return { success: true, message: 'Login successful', token, name: user.name || 'Student' };
    } catch (err) {
      return { success: false, message: 'Login failed. Please try again.' };
    }
  }
}
