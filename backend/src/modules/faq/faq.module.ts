import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Faq, FaqSchema } from '../../schemas/faq.schema';
import { Question, QuestionSchema } from '../../schemas/question.schema';
import { Answer, AnswerSchema } from '../../schemas/answer.schema';
import { FaqService } from './faq.service';
import { FaqController } from './faq.controller';
import { LocalDataService } from './local-data.service';

const mongooseImports: any[] = [];
if (process.env.MONGODB_URI) {
  mongooseImports.push(
    MongooseModule.forFeature([
      { name: Faq.name, schema: FaqSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: Answer.name, schema: AnswerSchema },
    ]),
  );
}

@Module({
  imports: mongooseImports,
  controllers: [FaqController],
  providers: [FaqService, LocalDataService],
})
export class FaqModule {}