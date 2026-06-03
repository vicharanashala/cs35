import { Injectable, Inject, Optional, OnModuleInit } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Faq } from '../../schemas/faq.schema';
import { Question } from '../../schemas/question.schema';
import { Answer } from '../../schemas/answer.schema';
import { Category } from '../../schemas/category.schema';
import { User } from '../../schemas/user.schema';
import { Notification } from '../../schemas/notification.schema';
import { SearchAnalytics } from '../../schemas/search-analytics.schema';
import { LocalDataService } from './local-data.service';
import { EventsGateway } from './events.gateway';


@Injectable()
export class FaqService implements OnModuleInit {
  private get hasMongoDB() {
    try {
      return !!this.faqModel && require('mongoose').connection.readyState === 1;
    } catch {
      return false;
    }
  }

  constructor(
    @Inject('FAQ_MODEL') private faqModel: any,
    @Inject('QUESTION_MODEL') private questionModel: any,
    @Inject('ANSWER_MODEL') private answerModel: any,
    @Inject('CATEGORY_MODEL') private categoryModel: any,
    @Inject('USER_MODEL') private userModel: any,
    @Inject('NOTIFICATION_MODEL') private notificationModel: any,
    @Inject('SEARCH_ANALYTICS_MODEL') private searchAnalyticsModel: any,
    private localData: LocalDataService,
    private eventsGateway: EventsGateway,
  ) {}

  async onModuleInit() {
    if (this.hasMongoDB) {
      await this.seedFromJson();
    }
  }

  async getSimilarFAQs(query: string, _threshold = 0.5, limit = 4) {
    if (!this.hasMongoDB || !this.faqModel) {
      return this.localData.getAllFAQs(undefined, query).slice(0, limit);
    }
    if (!query || query.trim().length < 3) return [];
    try {
      const q = query.toLowerCase();
      const allFaqs = await this.faqModel.find().lean().exec();
      return allFaqs
        .filter((faq: any) =>
          (faq.question || '').toLowerCase().includes(q) ||
          (faq.answer || '').toLowerCase().includes(q)
        )
        .slice(0, limit)
        .map((faq: any) => ({ ...faq, similarity: 0.6 }));
    } catch (err) {
      console.error('[FaqService] Error finding similar FAQs:', err);
      return [];
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
    if (!this.hasMongoDB) {
      const data = this.localData.getAllFAQs(category, search);
      return { data, total: data.length, page, limit };
    }
    try {
      const filter: Record<string, any> = {};
      if (category) filter.category = { $regex: `^${category}$`, $options: 'i' };

      let allFaqs: any[] = await this.faqModel.find(filter).lean().exec();

      if (search) {
        {
          // Text search
          allFaqs = allFaqs.filter(faq => {
            const q = search.toLowerCase();
            return (faq.question || '').toLowerCase().includes(q) ||
              (faq.answer || '').toLowerCase().includes(q) ||
              (faq.category || '').toLowerCase().includes(q);
          });
        }

        // Log search analytics (fire-and-forget)
        void this.logSearch(search, allFaqs.length === 0);
      } else {
        // Default sort
        allFaqs.sort((a: any, b: any) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      }

      const skip = (page - 1) * limit;
      const data = allFaqs.slice(skip, skip + limit);
      const total = allFaqs.length;
      
      return { data, total, page, limit };
    } catch (err) {
      console.error(err);
      const data = this.localData.getAllFAQs(category, search);
      return { data, total: data.length, page, limit };
    }
  }

  private async logSearch(query: string, failed: boolean) {
    if (!this.hasMongoDB || !this.searchAnalyticsModel) return;
    try {
      const normalized = query.trim().toLowerCase();
      await this.searchAnalyticsModel.findOneAndUpdate(
        { query: normalized },
        { $inc: { count: 1 }, $set: { failed, lastSearchedAt: new Date() } },
        { options: { upsert: true, new: true } },
      ).exec();
    } catch (err) {
      console.warn('[FaqService] Failed to log search analytics:', err);
    }
  }

  async getTrendingSearches(limit = 8) {
    if (!this.hasMongoDB || !this.searchAnalyticsModel) {
      return this.localData.getTrendingSearches();
    }
    try {
      return await this.searchAnalyticsModel
        .find({ failed: false })
        .sort({ count: -1 })
        .limit(limit)
        .select('query count')
        .lean()
        .exec();
    } catch {
      return this.localData.getTrendingSearches();
    }
  }

  async getFailedSearches(limit = 20) {
    if (!this.hasMongoDB || !this.searchAnalyticsModel) {
      return [];
    }
    try {
      return await this.searchAnalyticsModel
        .find({ failed: true })
        .sort({ count: -1 })
        .limit(limit)
        .select('query count lastSearchedAt')
        .lean()
        .exec();
    } catch {
      return [];
    }
  }

  async submitFaqFeedback(
    id: string,
    isHelpful: boolean,
    previousVote?: 'up' | 'down' | null,
    deselect?: boolean,
    reason?: string,
    userLabel?: string,
  ) {
    if (!this.hasMongoDB || !this.faqModel) {
      return this.localData.feedback(id, isHelpful);
    }
    try {
      let helpfulDelta = 0;
      let unhelpfulDelta = 0;

      if (deselect) {
        if (isHelpful) {
          helpfulDelta = -1;
        } else {
          unhelpfulDelta = -1;
        }
      } else {
        if (isHelpful) {
          helpfulDelta = 1;
          if (previousVote === 'down') {
            unhelpfulDelta = -1;
          }
        } else {
          unhelpfulDelta = 1;
          if (previousVote === 'up') {
            helpfulDelta = -1;
          }
        }
      }

      const update: any = {};
      const inc: any = {};

      if (helpfulDelta !== 0) {
        inc.helpfulCount = helpfulDelta;
      }
      if (unhelpfulDelta !== 0) {
        inc.unhelpfulCount = unhelpfulDelta;
      }

      if (Object.keys(inc).length > 0) {
        update.$inc = inc;
      }

      if (!isHelpful && reason && reason.trim()) {
        update.$push = {
          unhelpfulFeedbacks: {
            reason: reason.trim(),
            userLabel: userLabel || 'Anonymous',
            createdAt: new Date(),
          },
        };
      }

      return await this.faqModel.findByIdAndUpdate(id, update, { new: true }).exec();
    } catch {
      return this.localData.feedback(id, isHelpful);
    }
  }

  async getUnhelpfulFeedback() {
    if (!this.hasMongoDB || !this.faqModel) return [];
    try {
      const faqs = await this.faqModel
        .find({ 'unhelpfulFeedbacks.0': { $exists: true } })
        .select('question category unhelpfulFeedbacks')
        .lean()
        .exec();

      const feedbackList = [];
      for (const faq of faqs) {
        for (const fb of faq.unhelpfulFeedbacks || []) {
          feedbackList.push({
            faqId: faq._id,
            question: faq.question,
            category: faq.category,
            reason: fb.reason,
            userLabel: fb.userLabel || 'Anonymous',
            createdAt: fb.createdAt,
          });
        }
      }
      return feedbackList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.error('Error fetching unhelpful feedback in FAQ service:', err);
      return [];
    }
  }

  async getCategories() {
    if (!this.hasMongoDB || !this.faqModel) {
      const cats = this.localData.getCategories();
      return cats.map(name => ({ name, icon: this.generateCategoryIcon(name) }));
    }
    try {
      const cats = await this.categoryModel.find({ isActive: true }).select('name icon').lean().exec();
      if (cats.length > 0) {
        return cats.map((c: { name: string; icon?: string }) => ({ name: c.name, icon: c.icon || this.generateCategoryIcon(c.name) }));
      }
      const distinctCats = await this.faqModel.distinct('category').exec();
      return (distinctCats.filter(Boolean) as string[]).map(name => ({ name, icon: this.generateCategoryIcon(name) }));
    } catch {
      return this.localData.getCategories().map(name => ({ name, icon: this.generateCategoryIcon(name) }));
    }
  }

  async getFaqById(id: string) {
    if (!this.hasMongoDB || !this.faqModel) {
      return this.localData.getFaqById(id);
    }
    try {
      return await this.faqModel.findById(id).exec();
    } catch {
      return this.localData.getFaqById(id);
    }
  }

  async createFaq(data: any) {
    if (!this.hasMongoDB || !this.faqModel) {
      return this.localData.createFaq(data);
    }
    try {
      return await this.faqModel.create(data);
    } catch {
      return this.localData.createFaq(data);
    }
  }

  async updateFaq(id: string, data: any) {
    if (!this.hasMongoDB || !this.faqModel) {
      return this.localData.updateFaq(id, data);
    }
    try {
      return await this.faqModel.findByIdAndUpdate(id, data, { new: true }).exec();
    } catch {
      return this.localData.updateFaq(id, data);
    }
  }

  async deleteFaq(id: string) {
    if (!this.hasMongoDB || !this.faqModel) {
      return this.localData.deleteFaq(id);
    }
    try {
      return await this.faqModel.findByIdAndDelete(id).exec();
    } catch {
      return this.localData.deleteFaq(id);
    }
  }

  async upvoteFaq(id: string) {
    if (!this.hasMongoDB || !this.faqModel) {
      return this.localData.upvoteFaq(id);
    }
    try {
      return await this.faqModel.findByIdAndUpdate(id, { $inc: { upvotes: 1 } }, { new: true }).exec();
    } catch {
      return this.localData.upvoteFaq(id);
    }
  }

  async incrementFaqView(id: string) {
    if (!this.hasMongoDB || !this.faqModel) {
      return this.localData.incrementFaqView(id);
    }
    try {
      return await this.faqModel.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true }).exec();
    } catch {
      return this.localData.incrementFaqView(id);
    }
  }

  async feedback(id: string, helpful: boolean) {
    return this.submitFaqFeedback(id, helpful);
  }

  // ── Question Methods ─────────────────────────────────────────

  async getAllQuestions(params: any = {}) {
    if (!this.hasMongoDB || !this.questionModel) {
      return this.localData.getAllQuestions(params);
    }
    try {
      const filter: Record<string, any> = {};
      if (params.category) filter.category = params.category;
      if (params.status) filter.status = params.status;
      if (params.search) {
        filter.question = { $regex: params.search, $options: 'i' };
      }
      return await this.questionModel.find(filter).sort({ createdAt: -1 }).exec();
    } catch {
      return this.localData.getAllQuestions(params);
    }
  }

  async getOpenQuestions() {
    if (!this.hasMongoDB || !this.questionModel) {
      return this.localData.getOpenQuestions();
    }
    try {
      return await this.questionModel
        .find({ status: { $in: ['open', 'reopened'] } })
        .sort({ createdAt: -1 })
        .exec();
    } catch {
      return this.localData.getOpenQuestions();
    }
  }

  async getQuestionById(id: string) {
    if (!this.hasMongoDB || !this.questionModel) {
      return this.localData.getQuestionById(id);
    }
    try {
      // Return question with answers populated
      const question = await this.questionModel.findById(id).lean().exec();
      if (!question) return null;
      const answers = await this.answerModel
        .find({ questionId: new Types.ObjectId(id) })
        .sort({ createdAt: -1 })
        .lean()
        .exec();
      return { ...question, answers };
    } catch {
      return this.localData.getQuestionById(id);
    }
  }

  async createQuestion(data: any) {
    if (!this.hasMongoDB || !this.questionModel) {
      return this.localData.createQuestion(data);
    }
    try {
      const question = await this.questionModel.create({
        ...data,
        status: 'open',
        upvotes: 0,
        downvotes: 0,
        views: 0,
      });
      this.eventsGateway.emitQuestionAdded(question);
      return question;
    } catch {
      return this.localData.createQuestion(data);
    }
  }

  async updateQuestion(id: string, data: any) {
    if (!this.hasMongoDB || !this.questionModel) {
      return this.localData.updateQuestion(id, data);
    }
    try {
      const q = await this.questionModel.findByIdAndUpdate(id, data, { new: true }).exec();
      if (q && data.status) {
        this.eventsGateway.emitStatusUpdated(id, data.status);
      }
      return q;
    } catch {
      return this.localData.updateQuestion(id, data);
    }
  }

  async deleteQuestion(id: string) {
    if (!this.hasMongoDB || !this.questionModel) {
      return this.localData.deleteQuestion(id);
    }
    try {
      await this.answerModel.deleteMany({ questionId: new Types.ObjectId(id) }).exec();
      return await this.questionModel.findByIdAndDelete(id).exec();
    } catch {
      return this.localData.deleteQuestion(id);
    }
  }

  async closeQuestion(id: string) {
    return this.updateQuestion(id, { status: 'closed' });
  }

  async reopenQuestion(id: string, reason?: string) {
    return this.updateQuestion(id, { status: 'reopened', isReopened: true, reopenReason: reason });
  }

  async addAnswer(questionId: string, data: { content: string; contributorName: string; contributorId?: string }) {
    if (!this.hasMongoDB || !this.answerModel) {
      return this.localData.addAnswer(questionId, data);
    }
    try {
      const answer = await this.answerModel.create({
        questionId: new Types.ObjectId(questionId),
        content: data.content,
        contributorName: data.contributorName,
        contributorId: data.contributorId ? new Types.ObjectId(data.contributorId) : undefined,
        isVerified: false,
        isAccepted: false,
        upvotes: 0,
        downvotes: 0,
      });

      // Update question status to answered if open
      const question = await this.questionModel.findById(questionId).exec();
      if (question && question.status === 'open') {
        question.status = 'answered';
        await question.save();
        this.eventsGateway.emitStatusUpdated(questionId, 'answered');
      }

      this.eventsGateway.emitAnswerAdded(answer);
      return answer;
    } catch {
      return this.localData.addAnswer(questionId, data);
    }
  }

  async voteQuestion(questionId: string, direction: 'up' | 'down') {
    if (!this.hasMongoDB || !this.questionModel) {
      return this.localData.voteQuestion(questionId, direction);
    }
    try {
      const inc = direction === 'up' ? { upvotes: 1 } : { downvotes: 1 };
      return await this.questionModel.findByIdAndUpdate(questionId, { $inc: inc }, { new: true }).exec();
    } catch {
      return this.localData.voteQuestion(questionId, direction);
    }
  }

  async voteAnswer(questionId: string, answerId: string, direction: 'up' | 'down') {
    if (!this.hasMongoDB || !this.answerModel) {
      return this.localData.voteAnswer(questionId, answerId, direction);
    }
    try {
      const inc = direction === 'up' ? { upvotes: 1 } : { downvotes: 1 };
      return await this.answerModel.findByIdAndUpdate(answerId, { $inc: inc }, { new: true }).exec();
    } catch {
      return this.localData.voteAnswer(questionId, answerId, direction);
    }
  }

  async verifyAnswer(questionId: string, answerId: string, verified: boolean) {
    if (!this.hasMongoDB || !this.answerModel) {
      return this.localData.verifyAnswer(questionId, answerId, verified);
    }
    try {
      const answer = await this.answerModel.findByIdAndUpdate(answerId, { isVerified: verified }, { new: true }).exec();

      // If verified, mark question as answered AND auto-add any pending category from the answer
      if (verified) {
        await this.questionModel.findByIdAndUpdate(questionId, { status: 'answered' }).exec();

        // Auto-confirm category from answer if it has a pending one
        if (answer?.pendingCategory) {
          await this.confirmCategory(answer.pendingCategory);
        }
      }
      return answer;
    } catch {
      return this.localData.verifyAnswer(questionId, answerId, verified);
    }
  }

  async acceptAnswer(questionId: string, answerId: string, accepted: boolean) {
    // Adapter to accept signature matching both branches
    if (!this.hasMongoDB || !this.answerModel) {
      return this.localData.acceptAnswer(questionId, answerId, accepted);
    }
    try {
      if (accepted) {
        await this.answerModel.updateMany(
          { questionId: new Types.ObjectId(questionId) },
          { $set: { isAccepted: false } }
        ).exec();
      }
      const answer = await this.answerModel.findByIdAndUpdate(
        answerId,
        { $set: { isAccepted: accepted } },
        { new: true }
      ).exec();
      if (answer) {
        this.eventsGateway.emitAnswerAccepted(answerId, questionId, accepted);
      }
      return answer;
    } catch {
      return this.localData.acceptAnswer(questionId, answerId, accepted);
    }
  }

  async updateAnswer(answerId: string, data: { content: string }) {
    if (!this.hasMongoDB || !this.answerModel) {
      return this.localData.updateAnswer(answerId, data);
    }
    try {
      return await this.answerModel.findByIdAndUpdate(answerId, { content: data.content }, { new: true }).exec();
    } catch {
      return this.localData.updateAnswer(answerId, data);
    }
  }

  async deleteAnswer(answerId: string) {
    if (!this.hasMongoDB || !this.answerModel) {
      return this.localData.deleteAnswer(answerId);
    }
    try {
      return await this.answerModel.findByIdAndDelete(answerId).exec();
    } catch {
      return this.localData.deleteAnswer(answerId);
    }
  }

  // ── Bookmark Methods ─────────────────────────────────────────

  async toggleBookmark(userId: string, questionId: string) {
    if (!this.hasMongoDB || !this.userModel) {
      return this.localData.toggleBookmark(userId, questionId);
    }
    try {
      // Only allow bookmarking verified FAQs, not open questions
      const faq = await this.faqModel.findById(questionId).lean().exec();
      if (!faq) {
        throw new Error('Only verified FAQs can be bookmarked');
      }

      const user = await this.userModel.findById(userId).exec();
      if (!user) return null;
      const bookmarked = user.questionsBookmarked || [];
      const idx = bookmarked.findIndex(
        (b: any) => b.toString() === questionId
      );
      let bookmarkedUpdated: Types.ObjectId[];
      if (idx >= 0) {
        bookmarkedUpdated = bookmarked.filter(
          (_: any, i: number) => i !== idx
        );
      } else {
        bookmarkedUpdated = [...bookmarked, new Types.ObjectId(questionId)];
      }
      await this.userModel.findByIdAndUpdate(userId, {
        questionsBookmarked: bookmarkedUpdated,
      }).exec();
      return { bookmarked: idx < 0, questionId };
    } catch {
      return this.localData.toggleBookmark(userId, questionId);
    }
  }

  async getBookmarkedQuestions(userId: string) {
    if (!this.hasMongoDB || !this.userModel) {
      return this.localData.getBookmarks(userId);
    }
    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) return [];
      const ids = user.questionsBookmarked || [];
      if (ids.length === 0) return [];
      
      const questions = await this.questionModel
        .find({ _id: { $in: ids } })
        .lean()
        .exec();
      
      const faqs = await this.faqModel
        .find({ _id: { $in: ids } })
        .lean()
        .exec();

      const mappedFaqs = faqs.map((faq: any) => ({
        _id: faq._id.toString(),
        question: faq.question,
        details: faq.answer,
        category: faq.category,
        status: 'verified',
        createdAt: faq.createdAt || new Date(),
        answers: [],
      }));

      const combined = [...questions, ...mappedFaqs];
      return combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return this.localData.getBookmarks(userId);
    }
  }

  async getBookmarks(userId: string) {
    return this.getBookmarkedQuestions(userId);
  }

  async getUserAnswers(userId: string) {
    if (!this.hasMongoDB || !this.answerModel || !this.questionModel) return [];
    try {
      const answers = await this.answerModel
        .find({ contributorId: new Types.ObjectId(userId) })
        .lean()
        .exec();
      
      const populated = [];
      for (const answer of answers) {
        const question = await this.questionModel
          .findById(answer.questionId)
          .select('question category status')
          .lean()
          .exec();
        if (question) {
          populated.push({
            ...answer,
            question,
          });
        }
      }
      return populated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return [];
    }
  }

  // ── Follow Methods ───────────────────────────────────────────

  async followUser(followerId: string, followingId: string) {
    if (!this.hasMongoDB || !this.userModel) {
      return this.localData.toggleFollow(followerId, followingId);
    }
    try {
      const follower = await this.userModel.findById(followerId).exec();
      if (!follower) return null;
      const following = follower.following || [];
      const idx = following.findIndex(
        (f: any) => f.toString() === followingId
      );
      let followingUpdated: Types.ObjectId[];
      let isFollowing: boolean;
      if (idx >= 0) {
        followingUpdated = following.filter(
          (_: any, i: number) => i !== idx
        );
        isFollowing = false;
      } else {
        followingUpdated = [...following, new Types.ObjectId(followingId)];
        isFollowing = true;
      }
      await this.userModel.findByIdAndUpdate(followerId, {
        following: followingUpdated,
      }).exec();

      // Update followers of the followed user
      const followed = await this.userModel.findById(followingId).exec();
      if (followed) {
        const followers = followed.followers || [];
        let followersUpdated: Types.ObjectId[];
        if (isFollowing) {
          followersUpdated = [...followers, new Types.ObjectId(followerId)];
        } else {
          followersUpdated = followers.filter(
            (f: any) => f.toString() !== followerId
          );
        }
        await this.userModel.findByIdAndUpdate(followingId, {
          followers: followersUpdated,
        }).exec();
      }

      return { following: isFollowing };
    } catch {
      return this.localData.toggleFollow(followerId, followingId);
    }
  }

  async toggleFollow(followerId: string, followingId: string) {
    return this.followUser(followerId, followingId);
  }

  async getFollowing(userId: string) {
    if (!this.hasMongoDB || !this.userModel) {
      return this.localData.getFollowing(userId);
    }
    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) return [];
      const ids = user.following || [];
      if (ids.length === 0) return [];
      return await this.userModel
        .find({ _id: { $in: ids } })
        .select('-password')
        .exec();
    } catch {
      return this.localData.getFollowing(userId);
    }
  }

  // ── User Activity / Stats ────────────────────────────────────

  async getActivityHeatmap(userId: string) {
    if (!this.hasMongoDB || !this.questionModel || !this.answerModel) {
      return {};
    }
    try {
      const [questions, answers] = await Promise.all([
        this.questionModel
          .find({ contributorId: new Types.ObjectId(userId) })
          .select('createdAt')
          .lean()
          .exec(),
        this.answerModel
          .find({ contributorId: new Types.ObjectId(userId) })
          .select('createdAt isVerified')
          .lean()
          .exec(),
      ]);

      const dateMap = new Map<string, { questions: number; answers: number; verified: number }>();
      const now = new Date();
      // Initialize last 365 days
      for (let i = 364; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        dateMap.set(key, { questions: 0, answers: 0, verified: 0 });
      }
      for (const q of questions) {
        const key = new Date(q.createdAt).toISOString().split('T')[0];
        if (dateMap.has(key)) {
          const entry = dateMap.get(key)!;
          entry.questions++;
        }
      }
      for (const a of answers) {
        const key = new Date(a.createdAt).toISOString().split('T')[0];
        if (dateMap.has(key)) {
          const entry = dateMap.get(key)!;
          entry.answers++;
          if (a.isVerified) entry.verified++;
        }
      }
      const flatMap: Record<string, number> = {};
      for (const [date, stats] of dateMap) {
        flatMap[date] = stats.questions + stats.answers + stats.verified;
      }
      return flatMap;
    } catch {
      return {};
    }
  }

  async getUserStats(userId: string) {
    if (!this.hasMongoDB || !this.questionModel || !this.answerModel) {
      return this.localData.getUserStats(userId);
    }
    try {
      const [questionCount, answerCount, verifiedCount] =
        await Promise.all([
          this.questionModel.countDocuments({ contributorId: new Types.ObjectId(userId) }).exec(),
          this.answerModel.countDocuments({ contributorId: new Types.ObjectId(userId) }).exec(),
          this.answerModel.countDocuments({ contributorId: new Types.ObjectId(userId), isVerified: true }).exec(),
        ]);
      return {
        questionCount,
        answerCount,
        verifiedCount,
      };
    } catch {
      return this.localData.getUserStats(userId);
    }
  }

  // ── Category Methods ─────────────────────────────────────────

  // ── Icon generation for categories ──────────────────────────────────────

  private generateCategoryIcon(name: string): string {
    const iconMap: Record<string, string> = {
      'NOC': '📄', 'Offer Letter': '📝', 'ViBe': '🎵', 'Samagama': '💰',
      'Selection Process': '🎯', 'Interviews': '🎤', 'Certificate': '🏆',
      'Rosetta': '🔤', 'Phase 1': '1️⃣', 'Yaksha': '🔥', 'Team': '👥',
      'Work & Mentorship': '💼', 'Code of Conduct': '📋', 'About the Internship': '💡',
      'Timing & Schedule': '⏰', 'General': '💬', 'FAQ': '❓',
    };
    // Check exact match first
    if (iconMap[name]) return iconMap[name];
    // Keyword-based fallback
    const lower = name.toLowerCase();
    if (lower.includes('offer') || lower.includes('letter')) return '📝';
    if (lower.includes('noc')) return '📄';
    if (lower.includes('music') || lower.includes('vibe')) return '🎵';
    if (lower.includes('payment') || lower.includes('stipend') || lower.includes('samagama')) return '💰';
    if (lower.includes('select') || lower.includes('interview')) return '🎯';
    if (lower.includes('certificate') || lower.includes('cert')) return '🏆';
    if (lower.includes('team') || lower.includes('mentor')) return '👥';
    if (lower.includes('time') || lower.includes('schedule') || lower.includes('timing')) return '⏰';
    if (lower.includes('work') || lower.includes('project')) return '💼';
    if (lower.includes('rules') || lower.includes('conduct') || lower.includes('policy')) return '📋';
    if (lower.includes('about') || lower.includes('internship') || lower.includes('program')) return '💡';
    // Default: pick from a pool based on name length
    const pool = ['📁', '🏷️', '📌', '🗂️', '📦', '🔗', '🧩', '⭐', '🌟', '📪', '🔔', '🗝️', '🔑', '📎', '✏️', '🖊️'];
    return pool[name.length % pool.length];
  }

  // ── Create / confirm categories ────────────────────────────────────────────

  async createCategory(name: string, confirmed = false) {
    if (!name || !name.trim()) return { name: '', alreadyExists: false, saved: false };
    const trimmed = name.trim();
    if (!this.hasMongoDB || !this.categoryModel) {
      // Demo mode: add to local list if not present
      if (!this.localData.getCategories().includes(trimmed)) {
        (this.localData as any)._addCategory?.(trimmed); // hook for local mode
      }
      return { name: trimmed, alreadyExists: false, saved: true };
    }
    try {
      // Check if already exists (active or pending)
      const existing = await this.categoryModel.findOne({ name: { $regex: `^${trimmed}$`, $options: 'i' } }).exec();
      if (existing) return { name: trimmed, alreadyExists: true, saved: false };
      // Save new category with icon, inactive until confirmed
      const icon = this.generateCategoryIcon(trimmed);
      await this.categoryModel.create({ name: trimmed, icon, isActive: confirmed });
      return { name: trimmed, alreadyExists: false, saved: true, icon };
    } catch (err) {
      console.error('createCategory error:', err);
      return { name: trimmed, alreadyExists: false, saved: false };
    }
  }

  async confirmCategory(name: string) {
    // Admin confirms a pending category → activate it
    if (!this.hasMongoDB || !this.categoryModel) {
      return { success: true, name };
    }
    try {
      const icon = this.generateCategoryIcon(name);
      await this.categoryModel.findOneAndUpdate(
        { name: { $regex: `^${name}$`, $options: 'i' } },
        { isActive: true, icon },
        { upsert: true, new: true },
      ).exec();
      return { success: true, name, icon };
    } catch (err) {
      console.error('confirmCategory error:', err);
      return { success: false };
    }
  }

  async getCategoryStats() {
    if (!this.hasMongoDB || !this.faqModel || !this.questionModel) {
      const stats = this.localData.getCategoryStats();
      const cats = this.localData.getCategories();
      return cats.map(name => ({
        name,
        icon: this.generateCategoryIcon(name),
        faqCount: 0,
        questionCount: stats[name] || 0,
      }));
    }
    try {
      const [faqStats, questionStats, allCategories] = await Promise.all([
        this.faqModel
          .aggregate([
            { $match: { category: { $ne: null } } },
            { $group: { _id: '$category', faqCount: { $sum: 1 } } },
          ])
          .exec(),
        this.questionModel
          .aggregate([
            { $match: { category: { $ne: null } } },
            { $group: { _id: '$category', questionCount: { $sum: 1 } } },
          ])
          .exec(),
        this.categoryModel.find({ isActive: true }).select('name icon').lean().exec(),
      ]);

      const faqMap = Object.fromEntries((faqStats as { _id: string; faqCount: number }[]).map(s => [s._id, s.faqCount]));
      const qMap = Object.fromEntries((questionStats as { _id: string; questionCount: number }[]).map(s => [s._id, s.questionCount]));
      const catMap = Object.fromEntries((allCategories as { name: string; icon?: string }[]).map(c => [c.name, c.icon || this.generateCategoryIcon(c.name)]));

      const allCatNames = [...new Set([...Object.keys(faqMap), ...Object.keys(qMap)])];
      return allCatNames.map(name => ({
        name,
        icon: catMap[name] || this.generateCategoryIcon(name),
        faqCount: faqMap[name] || 0,
        questionCount: qMap[name] || 0,
      }));
    } catch {
      const stats = this.localData.getCategoryStats();
      return this.localData.getCategories().map(name => ({
        name,
        icon: this.generateCategoryIcon(name),
        faqCount: 0,
        questionCount: stats[name] || 0,
      }));
    }
  }

  // ── User Methods ─────────────────────────────────────────────

  async getAllUsers() {
    if (!this.hasMongoDB || !this.userModel) {
      return this.localData.getUsers();
    }
    try {
      return await this.userModel
        .find({}, { password: 0 })
        .sort({ createdAt: -1 })
        .exec();
    } catch {
      return this.localData.getUsers();
    }
  }

  async getUsers() {
    return this.getAllUsers();
  }

  async updateUser(id: string, data: { isActive?: boolean; role?: string; notificationPreferences?: any }) {
    if (!this.hasMongoDB || !this.userModel) {
      return { _id: id, ...data };
    }
    try {
      const user = await this.userModel
        .findByIdAndUpdate(id, data, { new: true })
        .select('-password')
        .exec();
      
      return user;
    } catch {
      return { _id: id, ...data };
    }
  }

  async deleteUser(id: string) {
    if (!this.hasMongoDB || !this.userModel) {
      return { deleted: true, _id: id };
    }
    try {
      return await this.userModel.findByIdAndDelete(id).exec();
    } catch {
      return { deleted: true, _id: id };
    }
  }

  // ── Stats ────────────────────────────────────────────────────

  async getStats() {
    if (!this.hasMongoDB) {
      return this.getAdminStats();
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
        this.questionModel.countDocuments({ status: { $in: ['open', 'reopened'] } }).exec(),
        this.questionModel.countDocuments({ status: 'answered' }).exec(),
        this.answerModel.countDocuments({ isVerified: true }).exec(),
        this.faqModel.countDocuments().exec(),
        this.faqModel.distinct('category').then((c: any[]) => c.filter(Boolean).length),
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
      return this.getAdminStats();
    }
  }

  async getAdminStats() {
    if (!this.hasMongoDB) {
      return this.localData.getAdminStats();
    }
    try {
      const [questions, open, answered, users, totalAnswers] = await Promise.all([
        this.questionModel.countDocuments().exec(),
        this.questionModel.countDocuments({ status: { $in: ['open', 'reopened'] } }).exec(),
        this.questionModel.countDocuments({ status: 'answered' }).exec(),
        this.userModel.countDocuments({ role: 'student' }).exec(),
        this.answerModel.countDocuments().exec(),
      ]);
      return { questions, open, answered, users, totalAnswers };
    } catch {
      return this.localData.getAdminStats();
    }
  }

  // ── Notifications ───────────────────────────────────────────

  async getNotifications(userId: string, isAdmin = false) {
    if (!this.hasMongoDB || !this.notificationModel) {
      return this.localData.getNotifications(userId, isAdmin);
    }
    try {
      const userIds = [userId];
      if (isAdmin) userIds.push('admin');

      return await this.notificationModel
        .find({ userId: { $in: userIds } })
        .sort({ createdAt: -1 })
        .limit(20)
        .exec();
    } catch {
      return this.localData.getNotifications(userId, isAdmin);
    }
  }

  async markNotificationRead(id: string) {
    if (!this.hasMongoDB || !this.notificationModel) {
      return this.localData.markNotificationRead(id);
    }
    try {
      return await this.notificationModel
        .findByIdAndUpdate(id, { isRead: true }, { new: true })
        .exec();
    } catch {
      return this.localData.markNotificationRead(id);
    }
  }

  // ── Legacy Forwarding compatibility ──────────────────────────
  async login(username: string, password: string) {
    return this.localData.login(username, password);
  }

  async signup(data: any) {
    return this.localData.signup(data);
  }

  async getMe(userId: string) {
    return this.localData.getMe(userId);
  }

  async getUserProfile() {
    return this.localData.getUserProfile();
  }

  async getUserQuestions(userId: string) {
    return this.localData.getUserQuestions(userId);
  }

  async getUserActivity(userId: string) {
    return this.localData.getUserActivity(userId);
  }

  async fullTextSearch(q: string) {
    if (!this.hasMongoDB || !this.questionModel) {
      return this.localData.getFullTextSearch(q);
    }
    try {
      const lower = q.toLowerCase();
      return await this.questionModel.find({
        $or: [
          { question: { $regex: lower, $options: 'i' } },
          { category: { $regex: lower, $options: 'i' } }
        ]
      }).exec();
    } catch {
      return this.localData.getFullTextSearch(q);
    }
  }
}