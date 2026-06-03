import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import mongoose from 'mongoose';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  
  const configService = app.get(ConfigService);
  
  const mongoUri = configService.get<string>('MONGODB_URI');
  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri);
      console.log('Successfully connected to MongoDB.');
    } catch (err) {
      console.error('MongoDB connection error:', err);
    }
  }
  
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
}
bootstrap();