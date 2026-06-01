import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
import { FaqModule } from './modules/faq/faq.module';
import { NotificationModule } from './modules/notification/notification.module';

// Stub for the Mongoose connection token.
// NestJS's internal mongoose providers depend on this token.
// Providing a no-op value prevents the "can't resolve dependencies of Mongoose"
// error when FaqModule uses mongoose.model() at startup without a real connection.
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

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), FaqModule, NotificationModule],
  providers: [STUB_MONGOOSE_CONNECTION],
})
export class AppModule {}