import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { User, UserSchema } from '../../schemas/user.schema';
import { Otp, OtpSchema } from '../../schemas/otp.schema';

const mongooseImports: any[] = [];
if (process.env.MONGODB_URI) {
  mongooseImports.push(
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Otp.name, schema: OtpSchema },
    ]),
  );
}

@Module({
  imports: mongooseImports,
  controllers: [AuthController],
  providers: [AuthService, EmailService],
})
export class AuthModule {}
