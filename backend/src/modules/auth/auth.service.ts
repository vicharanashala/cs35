import * as bcrypt from 'bcrypt';
import { Injectable, Inject, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../schemas/user.schema';

@Injectable()
export class AuthService {
  private mongoConnected = false;

  constructor(
    @Optional() @InjectModel(User.name) private userModel: Model<User> | undefined,
  ) {
    if (this.userModel) {
      this.mongoConnected = true;
    }
  }

  private get hasMongoDB() {
    return this.mongoConnected;
  }

  async signup(data: { fullName: string; username: string; password: string }): Promise<{ success: boolean; message: string; token?: string }> {
    if (!this.hasMongoDB) {
      return { success: true, message: 'Signup successful (demo mode)', token: 'demo-token' };
    }

    try {
      if (!data.username || data.username.trim().length < 3) {
        return { success: false, message: 'Username must be at least 3 characters' };
      }

      if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
        return { success: false, message: 'Username can only contain letters, numbers, and underscores' };
      }

      if (data.password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters' };
      }

      const existingUsername = await this.userModel.findOne({ username: data.username }).exec();
      if (existingUsername) {
        return { success: false, message: 'Username already taken. Please choose another.' };
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      let studentId: string | undefined;
      const lastUser = await this.userModel.findOne({ role: 'student', studentId: { $exists: true } }).sort({ studentId: -1 }).exec();
      const lastNum = lastUser?.studentId ? parseInt(lastUser.studentId.replace('STU-', ''), 10) : 0;
      studentId = `STU-${String(lastNum + 1).padStart(5, '0')}`;

      await this.userModel.create({
        username: data.username,
        email: '',
        password: hashedPassword,
        name: data.fullName,
        role: 'student',
        isActive: true,
        studentId,
        questionsAsked: [],
        questionsAnswered: [],
        questionsBookmarked: [],
      });

      const token = Buffer.from(`${data.username}:${Date.now()}`).toString('base64');
      return { success: true, message: 'Account created successfully', token };
    } catch (err) {
      return { success: false, message: 'Signup failed. Please try again.' };
    }
  }

  async loginStudent(username: string, password: string): Promise<{ success: boolean; message: string; token?: string; name?: string }> {
    if (!this.hasMongoDB) {
      return { success: true, message: 'Login successful (demo mode)', token: 'demo-token', name: 'Student' };
    }

    try {
      const user = await this.userModel.findOne({ username, role: 'student', isActive: true }).exec();
      if (!user) {
        return { success: false, message: 'Account not found. Please sign up.' };
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return { success: false, message: 'Incorrect password' };
      }

      const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
      return { success: true, message: 'Login successful', token, name: user.name || 'Student' };
    } catch (err) {
      return { success: false, message: 'Login failed. Please try again.' };
    }
  }

  async forgotPassword(data: { username: string; newPassword: string; confirmNewPassword: string }): Promise<{ success: boolean; message: string }> {
    if (!this.hasMongoDB) {
      return { success: false, message: 'Password reset unavailable in demo mode' };
    }

    try {
      if (!data.username.trim()) {
        return { success: false, message: 'Username is required' };
      }

      if (!data.newPassword || data.newPassword.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters' };
      }

      if (data.newPassword !== data.confirmNewPassword) {
        return { success: false, message: 'Passwords do not match' };
      }

      const user = await this.userModel.findOne({ username: data.username, role: 'student' }).exec();
      if (!user) {
        return { success: false, message: 'Account not found. Please sign up.' };
      }

      user.password = await bcrypt.hash(data.newPassword, 10);
      await user.save();

      return { success: true, message: 'Password reset successfully. You can now login.' };
    } catch (err) {
      return { success: false, message: 'Password reset failed. Please try again.' };
    }
  }

  async loginAdmin(email: string, password: string): Promise<{ success: boolean; message: string; token?: string; name?: string }> {
    if (!this.hasMongoDB) {
      if (email === 'admin@asksam.com' && password === 'admin123') {
        return { success: true, message: 'Login successful', token: 'admin-demo-token', name: 'Admin' };
      }
      return { success: false, message: 'Invalid admin credentials' };
    }

    try {
      const user = await this.userModel.findOne({ email, role: 'admin', isActive: true }).exec();
      if (!user) {
        return { success: false, message: 'Invalid admin credentials' };
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return { success: false, message: 'Incorrect password' };
      }

      const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');
      return { success: true, message: 'Login successful', token, name: user.name || 'Admin' };
    } catch (err) {
      return { success: false, message: 'Login failed. Please try again.' };
    }
  }
}
