import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  // Global prefix so frontend /api/* proxy routes work correctly
  app.setGlobalPrefix('api');

  // Allow cross-origin requests (needed if frontend ever calls backend directly)
  app.enableCors();

  await app.listen(port);
}
void bootstrap();
