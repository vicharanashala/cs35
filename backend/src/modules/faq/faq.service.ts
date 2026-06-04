import { Injectable, Optional, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Faq } from '../../schemas/faq.schema';
import { Question } from '../../schemas/question.schema';
import { Answer } from '../../schemas/answer.schema';
import { User } from '../../schemas/user.schema';
import { Notification } from '../../schemas/notification.schema';
import { EventsGateway } from './events.gateway';
@Injectable()
export class FaqService implements OnModuleInit {
  private mongoConnected = false;

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
    @Optional()
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification> | undefined,
    private eventsGateway: EventsGateway,
  ) {
    this.mongoConnected = !!this.faqModel;
  }

  private get hasMongoDB() {
    return this.mongoConnected;
  }

  async onModuleInit() {
    await this.seedFromJson();
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
          .findOne({ question: entry.question })
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

  async getAllFAQs(category?: string, search?: string, page = 1, limit = 20) {
    try {
      const filter: Record<string, any> = {};
      if (category) filter.category = category;
      if (search) {
        const regex = { $regex: search, $options: 'i' };
        filter.$or = [
          { question: regex },
          { answer: regex },
          { category: regex },
          { tags: regex },
        ];
      }
      if (page === 1 && limit === 20) {
        return await this.faqModel
          .find(filter)
          .sort({ isPinned: -1, createdAt: -1 })
          .exec();
      }
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.faqModel
          .find(filter)
          .sort({ isPinned: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.faqModel.countDocuments(filter).exec(),
      ]);
      return { data, total, page, limit };
    } catch {
      return { data: [], total: 0, page: 1, limit: 20 };
    }
  }

  async getCategories() {
    try {
      const cats = await this.faqModel.distinct('category').exec();
      return cats.filter(Boolean);
    } catch {
      return [];
    }
  }

  async getFaqById(id: string) {
    try {
      return await this.faqModel.findById(id).exec();
    } catch {
      return null;
    }
  }

  async createFaq(data: Partial<Faq>) {
    try {
      return await this.faqModel.create({ ...data, isAnswered: true });
    } catch {
      return null;
    }
  }

  async updateFaq(id: string, data: Partial<Faq>) {
    try {
      return await this.faqModel
        .findByIdAndUpdate(id, data, { new: true })
        .exec();
    } catch {
      return null;
    }
  }

  async deleteFaq(id: string) {
    try {
      return await this.faqModel.findByIdAndDelete(id).exec();
    } catch {
      return null;
    }
  }

  async pinFaq(id: string, pinned: boolean) {
    try {
      return await this.faqModel
        .findByIdAndUpdate(id, { isPinned: pinned }, { new: true })
        .exec();
    } catch {
      return null;
    }
  }

  async incrementFaqViews(id: string) {
    try {
      return await this.faqModel
        .findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true })
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
    page = 1,
    limit = 20,
  ) {
    try {
      const filter: Record<string, unknown> = {};
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (search) filter.question = { $regex: search, $options: 'i' };
      if (contributorName) filter.contributorName = contributorName;
      if (page === 1 && limit === 20) {
        return await this.questionModel
          .find(filter)
          .sort({ createdAt: -1 })
          .exec();
      }
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.questionModel
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.questionModel.countDocuments(filter).exec(),
      ]);
      return { data, total, page, limit };
    } catch {
      return [];
    }
  }

  async getOpenQuestions(page = 1, limit = 20) {
    try {
      const filter = { status: { $in: ['open', 'reopened'] } } as any;
      if (page === 1 && limit === 20) {
        return await this.questionModel
          .find(filter)
          .sort({ createdAt: 1 })
          .exec();
      }
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.questionModel
          .find(filter)
          .sort({ createdAt: 1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.questionModel.countDocuments(filter).exec(),
      ]);
      return { data, total, page, limit };
    } catch {
      return { data: [], total: 0, page: 1, limit: 20 };
    }
  }

  async getQuestionById(id: string) {
    try {
      const question = await this.questionModel.findById(id).exec();
      if (!question) return null;
      const answers = await this.answerModel
        .find({ questionId: id })
        .sort({ isVerified: -1, createdAt: 1 })
        .exec();
      return { ...question.toObject(), answers };
    } catch {
      return null;
    }
  }

  async createQuestion(data: Partial<Question>) {
    try {
      const q = await this.questionModel.create({ ...data, status: 'open' });
      this.eventsGateway.emitQuestionAdded(q);
      
      if (this.notificationModel) {
        await this.notificationModel.create({
          userId: 'admin',
          type: 'new_question',
          title: 'New Question',
          message: `${data.contributorName || 'A student'} asked: ${data.question}`,
          link: `/question/${q._id}`,
        });
      }
      
      return q;
    } catch {
      return null;
    }
  }

  async updateQuestion(id: string, data: Partial<Question>) {
    try {
      return await this.questionModel
        .findByIdAndUpdate(id, data, { new: true })
        .exec();
    } catch {
      return null;
    }
  }

  async deleteQuestion(id: string) {
    try {
      await this.answerModel.deleteMany({ questionId: id }).exec();
      return await this.questionModel.findByIdAndDelete(id).exec();
    } catch {
      return null;
    }
  }

  async closeQuestion(id: string) {
    try {
      const q = await this.questionModel
        .findByIdAndUpdate(id, { status: 'closed', isClosed: true }, { new: true })
        .exec();
      if (q) this.eventsGateway.emitStatusUpdated(id, 'closed');
      return q;
    } catch {
      return null;
    }
  }

  async reopenQuestion(id: string) {
    try {
      const q = await this.questionModel
        .findByIdAndUpdate(id, { status: 'reopened', isClosed: false }, { new: true })
        .exec();
      if (q) this.eventsGateway.emitStatusUpdated(id, 'reopened');
      return q;
    } catch {
      return null;
    }
  }

  async convertToFaq(questionId: string, answerId?: string) {
    try {
      const question = await this.questionModel.findById(questionId).exec();
      if (!question) return null;

      let answerContent = '';
      if (answerId) {
        const answer = await this.answerModel.findById(answerId).exec();
        answerContent = answer?.content || '';
      } else {
        const verifiedAnswer = await this.answerModel
          .findOne({ questionId, isVerified: true })
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
        views: 0,
      });

      await this.questionModel.findByIdAndUpdate(questionId, { status: 'closed' }).exec();
      this.eventsGateway.emitStatusUpdated(questionId, 'closed');
      this.eventsGateway.emitFaqConverted(faq);
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
    try {
      const answer = await this.answerModel.create({
        ...data,
        questionId,
        isVerified: false,
        upvotes: 0,
      });
      const hasVerified = await this.answerModel
        .findOne({ questionId, isVerified: true })
        .exec();
      if (hasVerified) {
        await this.questionModel.findByIdAndUpdate(questionId, { status: 'answered' });
        this.eventsGateway.emitStatusUpdated(questionId, 'answered');
      }
      
      if (data.contributorId) {
        await this.userModel.findByIdAndUpdate(data.contributorId, { $inc: { reputation: 5 } }).exec();
      }
      
      if (this.notificationModel) {
        const q = await this.questionModel.findById(questionId).exec();
        if (q && q.contributorId) {
          await this.notificationModel.create({
            userId: q.contributorId.toString(),
            type: 'answer_added',
            title: 'New Answer',
            message: `${data.contributorName} answered your question.`,
            link: `/question/${questionId}`,
          });
        }
      }
      
      this.eventsGateway.emitAnswerAdded(answer);
      return answer;
    } catch {
      return null;
    }
  }

  async updateAnswer(id: string, data: { content: string }) {
    try {
      return await this.answerModel
        .findByIdAndUpdate(id, data, { new: true })
        .exec();
    } catch {
      return null;
    }
  }

  async deleteAnswer(id: string) {
    try {
      return await this.answerModel.findByIdAndDelete(id).exec();
    } catch {
      return null;
    }
  }

  async verifyAnswer(id: string, verified: boolean) {
    try {
      const answer = await this.answerModel.findById(id).exec();
      if (!answer) return null;
      answer.isVerified = verified;
      await answer.save();

      const hasVerified = await this.answerModel
        .findOne({ questionId: answer.questionId, isVerified: true })
        .exec();
      if (hasVerified) {
        await this.questionModel
          .findByIdAndUpdate(answer.questionId, { status: 'answered' })
          .exec();
        this.eventsGateway.emitStatusUpdated(answer.questionId.toString(), 'answered');
      } else {
        await this.questionModel
          .findByIdAndUpdate(answer.questionId, { status: 'open' })
          .exec();
        this.eventsGateway.emitStatusUpdated(answer.questionId.toString(), 'open');
      }
      
      if (verified && answer.contributorId) {
        await this.userModel.findByIdAndUpdate(answer.contributorId, { $inc: { reputation: 20 } }).exec();
        if (this.notificationModel) {
          await this.notificationModel.create({
            userId: answer.contributorId.toString(),
            type: 'answer_verified',
            title: 'Answer Verified',
            message: 'Your answer was verified by an admin! You earned 20 pts.',
            link: `/question/${answer.questionId}`,
          });
        }
      }
      
      return answer;
    } catch {
      return null;
    }
  }

  async voteAnswer(id: string, direction: number) {
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
    try {
      const existing = await this.faqModel.findOne({ category: name }).exec();
      if (existing) return { name, alreadyExists: true };
      return { name, alreadyExists: false };
    } catch {
      return null;
    }
  }

  async getCategoryStats() {
    if (!this.hasMongoDB || !this.faqModel || !this.questionModel) return [];
    try {
      const faqStats = (await this.faqModel
        .aggregate([
          { $match: { category: { $ne: null } } },
          { $group: { _id: '$category', faqCount: { $sum: 1 } } },
        ])
        .exec()) as { _id: string; faqCount: number }[];

      const questionStats = (await this.questionModel
        .aggregate([
          { $match: { category: { $ne: null }, status: { $ne: 'closed' } } },
          { $group: { _id: '$category', questionCount: { $sum: 1 } } },
        ])
        .exec()) as { _id: string; questionCount: number }[];

      const statsMap = new Map<string, { faqCount: number; questionCount: number }>();

      for (const item of faqStats) {
        if (item._id) {
          statsMap.set(item._id, { faqCount: item.faqCount, questionCount: 0 });
        }
      }

      for (const item of questionStats) {
        if (item._id) {
          const existing = statsMap.get(item._id) || { faqCount: 0, questionCount: 0 };
          existing.questionCount = item.questionCount;
          statsMap.set(item._id, existing);
        }
      }

      return Array.from(statsMap.entries()).map(([name, stats]) => ({
        name,
        faqCount: stats.faqCount,
        questionCount: stats.questionCount,
      }));
    } catch (err) {
      console.warn('[FaqService] Error gathering category stats via aggregation:', err);
      return [];
    }
  }

  // ── User Methods ─────────────────────────────────────────────

  async getAllUsers() {
    try {
      return await this.userModel
        .find({}, { password: 0 })
        .sort({ createdAt: -1 })
        .exec();
    } catch {
      return [];
    }
  }

  async updateUser(id: string, data: { isActive?: boolean; role?: string; reputation?: number }) {
    try {
      const user = await this.userModel
        .findByIdAndUpdate(id, data, { new: true })
        .select('-password')
        .exec();
        
      if (data.reputation !== undefined && this.notificationModel && user) {
        await this.notificationModel.create({
          userId: id,
          type: 'points_adjusted',
          title: 'Reputation Adjusted',
          message: `An admin has adjusted your reputation points. You now have ${user.reputation} pts.`,
          link: `/profile`,
        });
      }
      
      return user;
    } catch {
      return null;
    }
  }

  async deleteUser(id: string) {
    try {
      return await this.userModel.findByIdAndDelete(id).exec();
    } catch {
      return null;
    }
  }

  // ── Stats ────────────────────────────────────────────────────

  async getStats() {
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
        this.questionModel.countDocuments({ status: { $in: ['open', 'reopened'] } }).exec(),
        this.questionModel.countDocuments({ status: 'answered' }).exec(),
        this.answerModel.countDocuments({ isVerified: true }).exec(),
        this.faqModel.countDocuments().exec(),
        this.faqModel.distinct('category').then((c) => c.filter(Boolean).length),
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

  // ── Notifications ───────────────────────────────────────────

  async getNotifications(userId: string, isAdmin = false) {
    if (!this.notificationModel) return [];
    try {
      const userIds = [userId];
      if (isAdmin) userIds.push('admin');
      
      return await this.notificationModel
        .find({ userId: { $in: userIds } })
        .sort({ createdAt: -1 })
        .limit(20)
        .exec();
    } catch {
      return [];
    }
  }

  async markNotificationRead(id: string) {
    if (!this.notificationModel) return null;
    try {
      return await this.notificationModel
        .findByIdAndUpdate(id, { isRead: true }, { new: true })
        .exec();
    } catch {
      return null;
    }
  }
}
