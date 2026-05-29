import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() body: { fullName: string; username: string; password: string }) {
    return this.authService.signup(body);
  }

  @Post('login')
  login(@Body() body: { email?: string; username?: string; password: string; role: 'student' | 'admin' }) {
    if (body.role === 'admin') {
      return this.authService.loginAdmin(body.email || '', body.password);
    }
    return this.authService.loginStudent(body.username || '', body.password);
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: { username: string; newPassword: string; confirmNewPassword: string }) {
    return this.authService.forgotPassword(body);
  }
}
