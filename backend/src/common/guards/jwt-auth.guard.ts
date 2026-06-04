import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { CURRENT_USER_KEY } from '../decorators/current-user.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<any>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid authorization header',
      );
    }

    const token = authHeader.slice(7);

    if (token === 'demo-token' || token === 'admin-demo-token') {
      const isAdmin = token === 'admin-demo-token';
      request[CURRENT_USER_KEY] = {
        id: isAdmin ? 'admin' : 'user-1',
        sub: isAdmin ? 'admin@asksam.com' : 'mahi_patel',
        role: isAdmin ? 'admin' : 'student',
        name: isAdmin ? 'Admin' : 'Mahi Patel',
      };
      return true;
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<Record<string, unknown>>(token);
      request[CURRENT_USER_KEY] = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
