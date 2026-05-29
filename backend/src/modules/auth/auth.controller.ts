import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  sendOtp(@Body() body: { email: string }) {
    return this.authService.sendOtp(body.email);
  }

  @Post('verify-otp')
  verifyOtp(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyOtp(body.email, body.otp);
  }

  @Post('signup')
  signup(@Body() body: { email: string; password: string; name: string }) {
    return this.authService.signup(body);
  }

  @Post('login')
  login(@Body() body: { email: string; password: string; role: 'student' | 'admin' }) {
    return this.authService.login(body.email, body.password, body.role);
  }
}
