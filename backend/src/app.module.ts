import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
import { FaqModule } from './modules/faq/faq.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AuthModule } from './modules/auth/auth.module';

const STUB_MONGOOSE_CONNECTION = {
  provide: getConnectionToken(),
  useValue: {
    readyState: 0,
    asPromise: () => Promise.resolve(null),
    close: () => Promise.resolve(),
    model: () => null,
    collection: null,
  },
};

const STUB_DATABASE_CONNECTION = {
  provide: 'DatabaseConnection',
  useValue: {
    model: () => null,
    collection: null,
    readyState: 0,
  },
};

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), FaqModule, NotificationModule, AuthModule],
  providers: [STUB_MONGOOSE_CONNECTION, STUB_DATABASE_CONNECTION],
})
export class AppModule {}