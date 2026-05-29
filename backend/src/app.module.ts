import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { FaqModule } from './modules/faq/faq.module';
import { AuthModule } from './modules/auth/auth.module';

const mongooseImports: any[] = [];
if (process.env.MONGODB_URI) {
  mongooseImports.push(
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI')!,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        bufferCommands: false,
      }),
    }),
  );
}

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ...mongooseImports, FaqModule, AuthModule],
})
export class AppModule {}