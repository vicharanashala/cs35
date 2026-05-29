import { Injectable, Optional, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Faq } from '../../schemas/faq.schema';
import { Question } from '../../schemas/question.schema';
import { Answer } from '../../schemas/answer.schema';
import { User } from '../../schemas/user.schema';
import { LocalDataService } from './local-data.service';

@Injectable()
export class FaqService implements OnModuleInit {
  constructor(
    @Optional() @InjectModel(Faq.name) private faqModel: Model<Faq> | undefined,
    @Optional()
    @InjectModel(Question.name)
    private questionModel: Model<Question> | undefined,
    @Optional()
    @InjectModel(Answer.name)
    private answerModel: Model<Answer> | undefined,
    @Optional()
    @InjectModel(User.name)
    private userModel: Model<User> | undefined,
    @Optional() private localData: LocalDataService,
  ) {}

  private get hasMongoDB() {
    return !!this.faqModel && !!this.questionModel && !!this.answerModel;
  }

  async onModuleInit() {
    if (this.hasMongoDB) {
      await this.seedFromJson();
    }
  }

  private async seedFromJson() {
    try {
      const dataPath = resolve(process.cwd(), '..', 'faqData.json');
      const raw = readFileSync(dataPath, 'utf-8');
      const entries = JSON.parse(raw) as {
        category: string;
        question: string;
        answer: string;
      }[];

      if (!entries || entries.length === 0) return;

      for (const entry of entries) {
        const existing = await this.faqModel
          .findOne({
            question: entry.question,
          })
          .exec();
        if (!existing) {
          await this.faqModel.create({
            question: entry.question,
            answer: entry.answer,
            category: entry.category,
            tags: [],
            isAnswered: true,
            isPinned: false,
            views: 0,
          });
        }
      }
      console.log(
        `[FaqService] Seeded ${entries.length} FAQs from faqData.json`,
      );
    } catch (err) {
      console.warn(
        '[FaqService] Could not seed from faqData.json:',
        err instanceof Error ? err.message : err,
      );
    }
  }

  // ── FAQ Methods ──────────────────────────────────────────────

  async getAllFAQs(category?: string, search?: string) {
    if (!this.hasMongoDB) return this.localData.getAllFAQs(category, search);
    try {
      const filter: Record<string, unknown> = {};
      if (category) filter.category = category;
      if (search) filter.question = { $regex: search, $options: 'i' };
      return await this.faqModel
        .find(filter)
        .sort({ isPinned: -1, createdAt: -1 })
        .exec();
    } catch {
      return this.localData.getAllFAQs(category, search);
    }
  }

  async getCategories() {
    if (!this.hasMongoDB) return this.localData.getCategories();
    try {
      const cats = await this.faqModel.distinct('category').exec();
      return cats.filter(Boolean);
    } catch {
      return this.localData.getCategories();
    }
  }

  async getFaqById(id: string) {
    if (!this.hasMongoDB) return this.localData.getFaqById(id);
    try {
      return await this.faqModel.findById(id).exec();
    } catch {
      return this.localData.getFaqById(id);
    }
  }

  async createFaq(data: Partial<Faq>) {
    if (!this.hasMongoDB) return null;
    try {
      return await this.faqModel.create({ ...data, isAnswered: true });
    } catch {
      return null;
    }
  }

  async updateFaq(id: string, data: Partial<Faq>) {
    if (!this.hasMongoDB) return null;
    try {
      return await this.faqModel
        .findByIdAndUpdate(id, data, {
          new: true,
        })
        .exec();
    } catch {
      return null;
    }
  }

  async deleteFaq(id: string) {
    if (!this.hasMongoDB) return null;
    try {
      return await this.faqModel.findByIdAndDelete(id).exec();
    } catch {
      return null;
    }
  }

  async pinFaq(id: string, pinned: boolean) {
    if (!this.hasMongoDB) return null;
    try {
      return await this.faqModel
        .findByIdAndUpdate(id, { isPinned: pinned }, { new: true })
        .exec();
    } catch {
      return null;
    }
  }

  // ── Question Methods ─────────────────────────────────────────

  async getAllQuestions(
    status?: string,
    category?: string,
    search?: string,
    contributorName?: string,
  ) {
    if (!this.hasMongoDB) return [];
    try {
      const filter: Record<string, unknown> = {};
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (search) filter.question = { $regex: search, $options: 'i' };
      if (contributorName) filter.contributorName = contributorName;
      return await this.questionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .exec();
    } catch {
      return [];
    }
  }

  async getOpenQuestions() {
    if (!this.hasMongoDB) return this.localData.getOpenQuestions();
    try {
      return await this.questionModel
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
      const question = await this.questionModel.findById(id).exec();
      if (!question) return null;
      const answers = await this.answerModel
        .find({ questionId: id })
        .sort({ isVerified: -1, createdAt: 1 })
        .exec();
      return { ...question.toObject(), answers };
    } catch {
      return this.localData.getQuestionById(id);
    }
  }

  async createQuestion(data: Partial<Question>) {
    if (!this.hasMongoDB) return this.localData.createQuestion(data);
    try {
      return await this.questionModel.create({ ...data, status: 'open' });
    } catch {
      return this.localData.createQuestion(data);
    }
  }

  async updateQuestion(id: string, data: Partial<Question>) {
    if (!this.hasMongoDB) return null;
    try {
      return await this.questionModel
        .findByIdAndUpdate(id, data, {
          new: true,
        })
        .exec();
    } catch {
      return null;
    }
  }

  async deleteQuestion(id: string) {
    if (!this.hasMongoDB) return null;
    try {
      await this.answerModel.deleteMany({ questionId: id }).exec();
      return await this.questionModel.findByIdAndDelete(id).exec();
    } catch {
      return null;
    }
  }

  async closeQuestion(id: string) {
    if (!this.hasMongoDB) return null;
    try {
      return await this.questionModel
        .findByIdAndUpdate(
          id,
          { status: 'closed', isClosed: true },
          { new: true },
        )
        .exec();
    } catch {
      return null;
    }
  }

  async reopenQuestion(id: string) {
    if (!this.hasMongoDB) return this.localData.reopenQuestion(id);
    try {
      return await this.questionModel
        .findByIdAndUpdate(
          id,
          { status: 'reopened', isClosed: false },
          { new: true },
        )
        .exec();
    } catch {
      return this.localData.reopenQuestion(id);
    }
  }

  async convertToFaq(questionId: string, answerId?: string) {
    if (!this.hasMongoDB) return null;
    try {
      const question = await this.questionModel.findById(questionId).exec();
      if (!question) return null;

      let answerContent = '';
      if (answerId) {
        const answer = await this.answerModel.findById(answerId).exec();
        answerContent = answer?.content || '';
      } else {
        const verifiedAnswer = await this.answerModel
          .findOne({
            questionId,
            isVerified: true,
          })
          .exec();
        answerContent = verifiedAnswer?.content || '';
      }

      const faq = await this.faqModel.create({
        question: question.question,
        answer: answerContent,
        category: question.category,
        tags: question.tags || [],
        isAnswered: true,
        isPinned: false,
      });

      await this.questionModel
        .findByIdAndUpdate(questionId, {
          status: 'closed',
        })
        .exec();

      return faq;
    } catch {
      return null;
    }
  }

  // ── Answer Methods ───────────────────────────────────────────

  async addAnswer(
    questionId: string,
    data: { content: string; contributorName: string; contributorId?: string },
  ) {
    if (!this.hasMongoDB) return this.localData.addAnswer(questionId, data);
    try {
      const answer = await this.answerModel.create({
        ...data,
        questionId,
        isVerified: false,
        upvotes: 0,
      });
      const hasVerified = await this.answerModel
        .findOne({
          questionId,
          isVerified: true,
        })
        .exec();
      if (hasVerified) {
        await this.questionModel.findByIdAndUpdate(questionId, {
          status: 'answered',
        });
      }
      return answer;
    } catch {
      return this.localData.addAnswer(questionId, data);
    }
  }

  async updateAnswer(id: string, data: { content: string }) {
    if (!this.hasMongoDB) return null;
    try {
      return await this.answerModel
        .findByIdAndUpdate(id, data, {
          new: true,
        })
        .exec();
    } catch {
      return null;
    }
  }

  async deleteAnswer(id: string) {
    if (!this.hasMongoDB) return null;
    try {
      return await this.answerModel.findByIdAndDelete(id).exec();
    } catch {
      return null;
    }
  }

  async verifyAnswer(id: string, verified: boolean) {
    if (!this.hasMongoDB) return null;
    try {
      const answer = await this.answerModel.findById(id).exec();
      if (!answer) return null;
      answer.isVerified = verified;
      await answer.save();

      const hasVerified = await this.answerModel
        .findOne({
          questionId: answer.questionId,
          isVerified: true,
        })
        .exec();
      if (hasVerified) {
        await this.questionModel
          .findByIdAndUpdate(answer.questionId, {
            status: 'answered',
          })
          .exec();
      } else {
        await this.questionModel
          .findByIdAndUpdate(answer.questionId, {
            status: 'open',
          })
          .exec();
      }
      return answer;
    } catch {
      return null;
    }
  }

  async voteAnswer(id: string, direction: number) {
    if (!this.hasMongoDB) return null;
    try {
      const answer = await this.answerModel.findById(id).exec();
      if (!answer) return null;
      answer.upvotes = Math.max(0, (answer.upvotes || 0) + direction);
      await answer.save();
      return answer;
    } catch {
      return null;
    }
  }

  // ── Category Methods ─────────────────────────────────────────

  async createCategory(name: string) {
    if (!this.hasMongoDB) return null;
    try {
      const existing = await this.faqModel.findOne({ category: name }).exec();
      if (existing) return { name, alreadyExists: true };
      return { name, alreadyExists: false };
    } catch {
      return null;
    }
  }

  async getCategoryStats() {
    if (!this.hasMongoDB) return [];
    try {
      const categories = await this.faqModel.distinct('category').exec();
      const stats = await Promise.all(
        categories.filter(Boolean).map(async (cat) => {
          const faqCount = await this.faqModel
            .countDocuments({
              category: cat,
            })
            .exec();
          const questionCount = await this.questionModel
            .countDocuments({
              category: cat,
              status: { $ne: 'closed' },
            })
            .exec();
          return { name: cat, faqCount, questionCount };
        }),
      );
      return stats;
    } catch {
      return [];
    }
  }

  // ── User Methods ─────────────────────────────────────────────

  async getAllUsers() {
    if (!this.hasMongoDB) return [];
    try {
      return await this.userModel
        .find({}, { password: 0 })
        .sort({ createdAt: -1 })
        .exec();
    } catch {
      return [];
    }
  }

  async updateUser(id: string, data: { isActive?: boolean; role?: string }) {
    if (!this.hasMongoDB) return null;
    try {
      return await this.userModel
        .findByIdAndUpdate(id, data, { new: true })
        .select('-password')
        .exec();
    } catch {
      return null;
    }
  }

  async deleteUser(id: string) {
    if (!this.hasMongoDB) return null;
    try {
      return await this.userModel.findByIdAndDelete(id).exec();
    } catch {
      return null;
    }
  }

  // ── Stats ────────────────────────────────────────────────────

  async getStats() {
    if (!this.hasMongoDB) {
      return {
        totalQuestions: 0,
        openQuestions: 0,
        answeredQuestions: 0,
        verifiedQuestions: 0,
        totalFaqs: 0,
        totalCategories: 0,
        totalUsers: 0,
      };
    }
    try {
      const [
        totalQuestions,
        openQuestions,
        answeredQuestions,
        verifiedQuestions,
        totalFaqs,
        totalCategories,
        totalUsers,
      ] = await Promise.all([
        this.questionModel.countDocuments().exec(),
        this.questionModel
          .countDocuments({
            status: { $in: ['open', 'reopened'] },
          })
          .exec(),
        this.questionModel.countDocuments({ status: 'answered' }).exec(),
        this.answerModel.countDocuments({ isVerified: true }).exec(),
        this.faqModel.countDocuments().exec(),
        this.faqModel
          .distinct('category')
          .then((c) => c.filter(Boolean).length),
        this.userModel.countDocuments({ role: 'student' }).exec(),
      ]);
      return {
        totalQuestions,
        openQuestions,
        answeredQuestions,
        verifiedQuestions,
        totalFaqs,
        totalCategories,
        totalUsers,
      };
    } catch {
      return {
        totalQuestions: 0,
        openQuestions: 0,
        answeredQuestions: 0,
        verifiedQuestions: 0,
        totalFaqs: 0,
        totalCategories: 0,
        totalUsers: 0,
      };
    }
  }
}
