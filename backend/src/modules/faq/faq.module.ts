import { Module, Type, DynamicModule, ForwardReference } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Faq, FaqSchema } from '../../schemas/faq.schema';
import { Question, QuestionSchema } from '../../schemas/question.schema';
import { Answer, AnswerSchema } from '../../schemas/answer.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import {
  Notification,
  NotificationSchema,
} from '../../schemas/notification.schema';
import {
  SearchAnalytics,
  SearchAnalyticsSchema,
} from '../../schemas/search-analytics.schema';
import { FaqService } from './faq.service';
import { FaqController } from './faq.controller';
import { EventsGateway } from './events.gateway';
import { AiModule } from '../ai/ai.module';

type NestModuleImport =
  | Type<any>
  | DynamicModule
  | Promise<DynamicModule>
  | ForwardReference<any>;

const mongooseImports: NestModuleImport[] = [];
if (process.env.MONGODB_URI) {
  mongooseImports.push(
    MongooseModule.forFeature([
      { name: Faq.name, schema: FaqSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: Answer.name, schema: AnswerSchema },
      { name: User.name, schema: UserSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: SearchAnalytics.name, schema: SearchAnalyticsSchema },
    ]),
  );
}

@Module({
  imports: [...mongooseImports, AiModule, AuthModule],
  controllers: [FaqController],
  providers: [FaqService, EventsGateway],
})
export class FaqModule {}
