import { Module } from '@nestjs/common';
import { Faq, FaqSchema } from '../../schemas/faq.schema';
import { Question, QuestionSchema } from '../../schemas/question.schema';
import { Answer, AnswerSchema } from '../../schemas/answer.schema';
import { Category, CategorySchema } from '../../schemas/category.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { Notification, NotificationSchema } from '../../schemas/notification.schema';
import { SearchAnalytics, SearchAnalyticsSchema } from '../../schemas/search-analytics.schema';
import { FaqService } from './faq.service';
import { FaqController } from './faq.controller';
import { LocalDataService } from './local-data.service';
import { EventsGateway } from './events.gateway';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [FaqController],
  providers: [
    FaqService,
    LocalDataService,
    EventsGateway,
    {
      provide: 'FAQ_MODEL',
      useFactory: () => require('mongoose').model(Faq.name, FaqSchema),
    },
    {
      provide: 'QUESTION_MODEL',
      useFactory: () => require('mongoose').model(Question.name, QuestionSchema),
    },
    {
      provide: 'ANSWER_MODEL',
      useFactory: () => require('mongoose').model(Answer.name, AnswerSchema),
    },
    {
      provide: 'USER_MODEL',
      useFactory: () => require('mongoose').model(User.name, UserSchema),
    },
    {
      provide: 'NOTIFICATION_MODEL',
      useFactory: () => require('mongoose').model(Notification.name, NotificationSchema),
    },
    {
      provide: 'SEARCH_ANALYTICS_MODEL',
      useFactory: () => require('mongoose').model(SearchAnalytics.name, SearchAnalyticsSchema),
    },
    {
      provide: 'CATEGORY_MODEL',
      useFactory: () => require('mongoose').model(Category.name, CategorySchema),
    },
  ],
})
export class FaqModule {}