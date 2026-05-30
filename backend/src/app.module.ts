import 'dotenv/config';
import { Module, Type, DynamicModule, ForwardReference } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { FaqModule } from './modules/faq/faq.module';
import { AuthModule } from './modules/auth/auth.module';
import { AiModule } from './modules/ai/ai.module';

type NestModuleImport =
  | Type<any>
  | DynamicModule
  | Promise<DynamicModule>
  | ForwardReference<any>;

const mongooseImports: NestModuleImport[] = [];
if (process.env.MONGODB_URI) {
  mongooseImports.push(
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        bufferCommands: false,
      }),
    }),
  );
}

const featureModules: NestModuleImport[] = [];
if (process.env.MONGODB_URI) {
  featureModules.push(FaqModule, AuthModule, AiModule);
} else {
  featureModules.push(FaqModule);
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000,
        limit: 100,
      },
      {
        name: 'login',
        ttl: 60000,
        limit: 5,
      },
    ]),
    ...mongooseImports,
    ...featureModules,
  ],
})
export class AppModule {}
