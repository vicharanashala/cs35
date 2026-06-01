import { Module } from '@nestjs/common';
import { Faq, FaqSchema } from '../../schemas/faq.schema';
import { Question, QuestionSchema } from '../../schemas/question.schema';
import { Answer, AnswerSchema } from '../../schemas/answer.schema';
import { FaqService } from './faq.service';
import { FaqController } from './faq.controller';
import { LocalDataService } from './local-data.service';

@Module({
  controllers: [FaqController],
  providers: [
    FaqService,
    LocalDataService,
    // Create Mongoose models at startup via useFactory.
    // Importing mongoose here (not at the top of the file) prevents NestJS
    // from auto-registering mongoose's DI tokens before the factory runs.
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
  ],
})
export class FaqModule {}