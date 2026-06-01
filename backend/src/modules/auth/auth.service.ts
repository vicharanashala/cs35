/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unused-vars */
// @ts-ignore
import * as bcrypt from 'bcrypt';
import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { User } from '../../schemas/user.schema';
import { Question } from '../../schemas/question.schema';
import { Answer } from '../../schemas/answer.schema';

@Injectable()
export class AuthService {
  private mongoConnected = false;

  constructor(
    @Optional()
    @InjectModel(User.name)
    private userModel: Model<User> | undefined,
    @Optional()
    @InjectModel(Question.name)
    private questionModel: Model<Question> | undefined,
    @Optional()
    @InjectModel(Answer.name)
    private answerModel: Model<Answer> | undefined,
    private jwtService: JwtService,
  ) {
    if (this.userModel) {
      this.mongoConnected = true;
    }
  }

  private get hasMongoDB() {
    return this.mongoConnected;
  }

  private signToken(payload: {
    sub: string;
    email?: string;
    role: string;
    name: string;
  }): string {
    return this.jwtService.sign(payload);
  }

  async signup(data: {
    fullName: string;
    username: string;
    password: string;
  }): Promise<{ success: boolean; message: string; token?: string }> {
    if (!this.hasMongoDB) {
      return {
        success: true,
        message: 'Signup successful (demo mode)',
        token: 'demo-token',
      };
    }

    try {
      if (!data.username || data.username.trim().length < 3) {
        return {
          success: false,
          message: 'Username must be at least 3 characters',
        };
      }

      if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
        return {
          success: false,
          message:
            'Username can only contain letters, numbers, and underscores',
        };
      }

      if (data.password.length < 6) {
        return {
          success: false,
          message: 'Password must be at least 6 characters',
        };
      }

      const existingUsername = await this.userModel!
        .findOne({ username: data.username })
        .exec();
      if (existingUsername) {
        return {
          success: false,
          message: 'Username already taken. Please choose another.',
        };
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      const lastUser = await this.userModel!
        .findOne({ role: 'student', studentId: { $exists: true } })
        .sort({ studentId: -1 })
        .exec();
      const lastNum = lastUser?.studentId
        ? parseInt(lastUser.studentId.replace('STU-', ''), 10)
        : 0;
      const studentId = `STU-${String(lastNum + 1).padStart(5, '0')}`;

      await this.userModel!.create({
        username: data.username,
        password: hashedPassword,
        name: data.fullName,
        role: 'student',
        isActive: true,
        studentId,
        questionsAsked: [],
        questionsAnswered: [],
        questionsBookmarked: [],
      });

      const token = this.signToken({
        sub: data.username,
        role: 'student',
        name: data.fullName,
      });
      return { success: true, message: 'Account created successfully', token };
    } catch (err) {
      console.error('Signup error:', err);
      return { success: false, message: 'Signup failed. Please try again.' };
    }
  }

  async loginStudent(
    username: string,
    password: string,
  ): Promise<{
    success: boolean;
    message: string;
    token?: string;
    name?: string;
  }> {
    if (!this.hasMongoDB) {
      return {
        success: true,
        message: 'Login successful (demo mode)',
        token: 'demo-token',
        name: 'Student',
      };
    }

    try {
      const user = await this.userModel!
        .findOne({ username, role: 'student', isActive: true })
        .exec();
      if (!user) {
        return {
          success: false,
          message: 'Account not found. Please sign up.',
        };
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return { success: false, message: 'Incorrect password' };
      }

      const token = this.signToken({
        sub: username,
        role: 'student',
        name: user.name || 'Student',
      });
      return {
        success: true,
        message: 'Login successful',
        token,
        name: user.name || 'Student',
      };
    } catch (err) {
      return { success: false, message: 'Login failed. Please try again.' };
    }
  }

  async getMe(token: string): Promise<{
    success: boolean;
    user?: Record<string, unknown>;
    message?: string;
  }> {
    if (!this.hasMongoDB || !this.questionModel || !this.answerModel) {
      let payload: { sub: string; role: string; name: string };
      try {
        payload = this.jwtService.verify(token);
        return {
          success: true,
          user: {
            name: payload.name || 'Student',
            username: payload.sub,
            role: payload.role || 'student',
            createdAt: new Date().toISOString(),
            questionsCount: 0,
            answersCount: 0,
            verifiedCount: 0,
          },
        };
      } catch {
        return { success: false, message: 'Invalid token' };
      }
    }

    try {
      let payload: { sub: string; role: string; name: string };
      try {
        payload = this.jwtService.verify(token);
      } catch {
        return { success: false, message: 'Invalid or expired token' };
      }

      const user = await this.userModel!
        .findOne({
          username: payload.sub,
          role: payload.role as 'student' | 'admin',
        })
        .select('-password')
        .exec();
      if (!user) return { success: false, message: 'User not found' };

      const questionsCount = await this.questionModel
        .countDocuments({ contributorId: user._id })
        .exec();
      const answersCount = await this.answerModel
        .countDocuments({ contributorId: user._id })
        .exec();
      const verifiedCount = await this.answerModel
        .countDocuments({
          contributorId: user._id,
          isVerified: true,
        })
        .exec();

      return {
        success: true,
        user: {
          _id: user._id.toString(),
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          studentId: user.studentId,
          createdAt: (user as any).createdAt,
          questionsCount,
          answersCount,
          verifiedCount,
          reputation: user.reputation,
        },
      };
    } catch {
      return { success: false, message: 'Failed to fetch profile' };
    }
  }

  async loginAdmin(
    email: string,
    password: string,
  ): Promise<{
    success: boolean;
    message: string;
    token?: string;
    name?: string;
  }> {
    if (!this.hasMongoDB) {
      const demoEmail = process.env.DEMO_ADMIN_EMAIL || 'admin@asksam.com';
      const demoPass = process.env.DEMO_ADMIN_PASSWORD || 'admin123';
      if (email === demoEmail && password === demoPass) {
        return {
          success: true,
          message: 'Login successful',
          token: 'admin-demo-token',
          name: 'Admin',
        };
      }
      return { success: false, message: 'Invalid admin credentials' };
    }

    try {
      const user = await this.userModel!
        .findOne({ email, role: 'admin', isActive: true })
        .exec();
      if (!user) {
        return { success: false, message: 'Invalid admin credentials' };
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return { success: false, message: 'Incorrect password' };
      }

      const token = this.signToken({
        sub: email,
        email,
        role: 'admin',
        name: user.name || 'Admin',
      });
      return {
        success: true,
        message: 'Login successful',
        token,
        name: user.name || 'Admin',
      };
    } catch (err) {
      return { success: false, message: 'Login failed. Please try again.' };
    }
  }

  async forgotPassword(data: {
    username: string;
    newPassword: string;
    confirmNewPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    if (!this.hasMongoDB) {
      return {
        success: false,
        message: 'Password reset unavailable in demo mode',
      };
    }

    try {
      if (!data.username.trim()) {
        return { success: false, message: 'Username is required' };
      }

      if (!data.newPassword || data.newPassword.length < 6) {
        return {
          success: false,
          message: 'Password must be at least 6 characters',
        };
      }

      if (data.newPassword !== data.confirmNewPassword) {
        return { success: false, message: 'Passwords do not match' };
      }

      const user = await this.userModel!
        .findOne({ username: data.username, role: 'student' })
        .exec();
      if (!user) {
        return {
          success: false,
          message: 'Account not found. Please sign up.',
        };
      }

      user.password = await bcrypt.hash(data.newPassword, 10);
      await user.save();

      return {
        success: true,
        message: 'Password reset successful. You can now login.',
      };
    } catch (err) {
      return {
        success: false,
        message: 'Password reset failed. Please try again.',
      };
    }
  }
}
