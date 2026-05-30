import {
  Controller,
  Post,
  Body,
  Get,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  getMe(@Headers('authorization') authHeader?: string) {
    const token = authHeader?.replace('Bearer ', '');
    return this.authService.getMe(token || '');
  }

  @Post('signup')
  signup(
    @Body() body: { fullName: string; username: string; password: string },
  ) {
    return this.authService.signup(body);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @Post('login')
  login(
    @Body()
    body: {
      email?: string;
      username?: string;
      password: string;
      role: 'student' | 'admin';
    },
  ) {
    if (body.role === 'admin') {
      return this.authService.loginAdmin(body.email || '', body.password);
    }
    return this.authService.loginStudent(body.username || '', body.password);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @Post('forgot-password')
  forgotPassword(
    @Body()
    body: {
      username: string;
      newPassword: string;
      confirmNewPassword: string;
    },
  ) {
    return this.authService.forgotPassword(body);
  }
}
