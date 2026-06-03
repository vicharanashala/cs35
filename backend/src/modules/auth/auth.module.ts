import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, UserSchema } from '../../schemas/user.schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      inject: [],
      useFactory: () => ({
        secret:
          process.env.JWT_SECRET || 'asksam-dev-secret-change-in-production',
        signOptions: { expiresIn: '7d' },
      }),
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000,
        limit: 10,
      },
      {
        name: 'login',
        ttl: 60000,
        limit: 5,
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    RolesGuard,
    {
      provide: 'USER_MODEL',
      useFactory: () => require('mongoose').model(User.name, UserSchema),
    },
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}