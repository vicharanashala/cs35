/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unused-vars */
// @ts-ignore
import * as bcrypt from 'bcrypt';
import { Injectable, Optional, Inject } from '@nestjs/common';
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
    @Inject('USER_MODEL')
    private userModel: Model<User> | undefined,
    @Optional()
    @Inject('QUESTION_MODEL')
    private questionModel: Model<Question> | undefined,
    @Optional()
    @Inject('ANSWER_MODEL')
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
    id?: string;
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
      if (!data.username || !/^[a-zA-Z0-9_]{3,20}$/.test(data.username.trim())) {
        return {
          success: false,
          message: 'Username must be 3-20 characters long and contain only letters, numbers, or underscores',
        };
      }

      if (data.password.length < 6) {
        return {
          success: false,
          message: 'Password must be at least 6 characters',
        };
      }

      const existingUser = await this.userModel!
        .findOne({ username: data.username.trim() })
        .exec();
      if (existingUser) {
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

      const createdUser = await this.userModel!.create({
        username: data.username.trim(),
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
        sub: data.username.trim(),
        role: 'student',
        name: data.username.trim(),
        id: createdUser._id.toString(),
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
        name: user.username,
        id: user._id.toString(),
      });
      return {
        success: true,
        message: 'Login successful',
        token,
        name: user.username,
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
          $or: [{ username: payload.sub }, { email: payload.sub }],
          role: payload.role as 'student' | 'admin',
        })
        .select('-password')
        .exec();
      if (!user) return { success: false, message: 'User not found' };

      const questionsCount = await this.questionModel.collection
        .countDocuments({
          $or: [
            { contributorId: user._id },
            { contributorId: user._id.toString() }
          ]
        });
      const answersCount = await this.answerModel.collection
        .countDocuments({
          $or: [
            { contributorId: user._id },
            { contributorId: user._id.toString() }
          ]
        });
      const verifiedCount = await this.answerModel.collection
        .countDocuments({
          $or: [
            { contributorId: user._id },
            { contributorId: user._id.toString() }
          ],
          isVerified: true,
        });

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
          notificationPreferences: (user as any).notificationPreferences || { notifyOnAnswer: true, notifyOnVerification: true },
          questionsCount,
          answersCount,
          verifiedCount,
          bookmarkedCount: user.questionsBookmarked?.length || 0,
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
        id: user._id.toString(),
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
    username?: string;
    email?: string;
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
      const identifier = data.username?.trim() || data.email?.trim();
      if (!identifier) {
        return { success: false, message: 'Username or Email is required' };
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
        .findOne({
          $or: [{ username: identifier }, { email: identifier }],
          role: 'student',
        })
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
