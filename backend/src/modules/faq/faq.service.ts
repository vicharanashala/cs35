import { Injectable, Inject, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Faq } from '../../schemas/faq.schema';
import { Question } from '../../schemas/question.schema';
import { Answer } from '../../schemas/answer.schema';
import { LocalDataService } from './local-data.service';

@Injectable()
export class FaqService {
  constructor(
    @Optional() @InjectModel(Faq.name) private faqModel: Model<Faq> | undefined,
    @Optional() @InjectModel(Question.name) private questionModel: Model<Question> | undefined,
    @Optional() @InjectModel(Answer.name) private answerModel: Model<Answer> | undefined,
    @Optional() private localData: LocalDataService,
  ) {}

  private get hasMongoDB() {
    return !!this.faqModel && !!this.questionModel && !!this.answerModel;
  }

  async getAllFAQs(category?: string, search?: string) {
    if (!this.hasMongoDB) return this.localData.getAllFAQs(category, search);
    try {
      const filter: Record<string, unknown> = { isAnswered: true };
      if (category) filter.category = category;
      if (search) filter.question = { $regex: search, $options: 'i' };
      return await this.faqModel!.find(filter).exec();
    } catch {
      return this.localData.getAllFAQs(category, search);
    }
  }

  async getCategories() {
    if (!this.hasMongoDB) return this.localData.getCategories();
    try {
      const cats = await this.faqModel!.distinct('category').exec();
      return cats.filter(Boolean);
    } catch {
      return this.localData.getCategories();
    }
  }

  async getFaqById(id: string) {
    if (!this.hasMongoDB) return this.localData.getFaqById(id);
    try {
      const faq = await this.faqModel!.findById(id).exec();
      return faq;
    } catch {
      return this.localData.getFaqById(id);
    }
  }

  async getOpenQuestions() {
    if (!this.hasMongoDB) return this.localData.getOpenQuestions();
    try {
      return await this.questionModel!
        .find({ status: { $in: ['open', 'reopened'] } })
        .sort({ createdAt: 1 })
        .exec();
    } catch {
      return this.localData.getOpenQuestions();
    }
  }

  async getQuestionById(id: string) {
    if (!this.hasMongoDB) return this.localData.getQuestionById(id);
    try {
      const question = await this.questionModel!.findById(id).exec();
      if (!question) return null;
      const answers = await this.answerModel!.find({ questionId: id }).exec();
      return { ...question.toObject(), answers };
    } catch {
      return this.localData.getQuestionById(id);
    }
  }

  async createQuestion(data: Partial<Question>) {
    if (!this.hasMongoDB) return this.localData.createQuestion(data);
    try {
      return await this.questionModel!.create({ ...data, status: 'open' });
    } catch {
      return this.localData.createQuestion(data);
    }
  }

  async addAnswer(questionId: string, data: { content: string; contributorName: string }) {
    if (!this.hasMongoDB) return this.localData.addAnswer(questionId, data);
    try {
      const answer = await this.answerModel!.create({ ...data, questionId });
      const hasVerified = await this.answerModel!.findOne({ questionId, isVerified: true }).exec();
      if (hasVerified) {
        await this.questionModel!.findByIdAndUpdate(questionId, { status: 'answered' });
      }
      return answer;
    } catch {
      return this.localData.addAnswer(questionId, data);
    }
  }

  async reopenQuestion(id: string) {
    if (!this.hasMongoDB) return this.localData.reopenQuestion(id);
    try {
      return await this.questionModel!.findByIdAndUpdate(
        id,
        { status: 'reopened' },
        { new: true },
      ).exec();
    } catch {
      return this.localData.reopenQuestion(id);
    }
  }
}