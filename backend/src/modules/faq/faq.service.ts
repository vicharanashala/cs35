import { Injectable, Optional, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Faq } from '../../schemas/faq.schema';
import { Question } from '../../schemas/question.schema';
import { Answer } from '../../schemas/answer.schema';
import { User } from '../../schemas/user.schema';
import { Notification } from '../../schemas/notification.schema';
import { SearchAnalytics } from '../../schemas/search-analytics.schema';
import { EventsGateway } from './events.gateway';
import { AiService } from '../ai/ai.service';
@Injectable()
export class FaqService implements OnModuleInit {
  private get hasMongoDB() {
    return !!this.faqModel;
  }

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
    @Optional()
    @InjectModel(SearchAnalytics.name)
    private searchAnalyticsModel: Model<SearchAnalytics> | undefined,
    private eventsGateway: EventsGateway,
    private aiService: AiService,
    ) {}

  async onModuleInit() {
    await this.seedFromJson();
    void this.backfillEmbeddings();
  }

  async backfillEmbeddings() {
    if (!this.hasMongoDB || !this.faqModel) return;
    try {
      const faqsWithoutEmbedding = await this.faqModel.find({
        $or: [
          { embedding: { $exists: false } },
          { embedding: { $size: 0 } }
        ]
      }).exec();

      if (faqsWithoutEmbedding.length > 0) {
        console.log(`[FaqService] Backfilling embeddings for ${faqsWithoutEmbedding.length} FAQs...`);
        let count = 0;
        for (const faq of faqsWithoutEmbedding) {
          const embedding = await this.aiService.generateEmbedding(faq.question);
          if (embedding && embedding.length > 0) {
            await this.faqModel.findByIdAndUpdate(faq._id, { $set: { embedding } }).exec();
            count++;
          }
        }
        console.log(`[FaqService] Successfully backfilled embeddings for ${count}/${faqsWithoutEmbedding.length} FAQs.`);
      }
    } catch (err) {
      console.error('[FaqService] Failed to backfill embeddings:', err);
    }
  }

  async getSimilarFAQs(query: string, threshold = 0.5, limit = 4) {
    if (!this.hasMongoDB || !this.faqModel) return [];
    if (!query || query.trim().length < 3) return [];

    try {
      const queryEmbedding = await this.aiService.generateEmbedding(query);
      if (!queryEmbedding || queryEmbedding.length === 0) return [];

      const allFaqs = await this.faqModel.find().lean().exec();

      const scoredFaqs = allFaqs
        .map(faq => {
          const similarity = faq.embedding && faq.embedding.length > 0
            ? this.aiService.cosineSimilarity(queryEmbedding, faq.embedding)
            : 0;
          return { ...faq, similarity };
        })
        .filter(faq => faq.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      return scoredFaqs;
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
    try {
      const filter: Record<string, any> = {};
      if (category) filter.category = category;
      
      let allFaqs: any[] = await this.faqModel.find(filter).lean().exec();

      if (search) {
        const queryEmbedding = await this.aiService.generateEmbedding(search);
        
        if (queryEmbedding.length > 0) {
          // Semantic Search
          allFaqs = allFaqs.map(faq => {
            const similarity = faq.embedding ? this.aiService.cosineSimilarity(queryEmbedding, faq.embedding) : 0;
            return { ...faq, similarity };
          }).sort((a: any, b: any) => b.similarity - a.similarity);
        } else {
          // Fallback to text search
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
      return { data: [], total: 0, page: 1, limit: 20 };
    }
  }

  private async logSearch(query: string, failed: boolean) {
    if (!this.searchAnalyticsModel) return;
    const normalized = query.trim().toLowerCase();
    await this.searchAnalyticsModel.findOneAndUpdate(
      { query: normalized },
      { $inc: { count: 1 }, $set: { failed, lastSearchedAt: new Date() } },
      { upsert: true, new: true },
    ).exec();
  }

  async getTrendingSearches(limit = 8) {
    if (!this.searchAnalyticsModel) return [];
    return this.searchAnalyticsModel
      .find({ failed: false })
      .sort({ count: -1 })
      .limit(limit)
      .select('query count')
      .lean()
      .exec();
  }

  async getFailedSearches(limit = 20) {
    if (!this.searchAnalyticsModel) return [];
    return this.searchAnalyticsModel
      .find({ failed: true })
      .sort({ count: -1 })
      .limit(limit)
      .select('query count lastSearchedAt')
      .lean()
      .exec();
  }

  async submitFaqFeedback(id: string, isHelpful: boolean) {
    if (!this.faqModel) return null;
    const inc = isHelpful ? { helpfulCount: 1 } : { unhelpfulCount: 1 };
    return this.faqModel.findByIdAndUpdate(id, { $inc: inc }, { new: true }).exec();
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
      const embedding = data.question ? await this.aiService.generateEmbedding(data.question) : [];
      return await this.faqModel.create({ ...data, embedding, isAnswered: true });
    } catch {
      return null;
    }
  }

  async updateFaq(id: string, data: Partial<Faq>) {
    try {
      const updateData = { ...data } as any;
      if (data.question) {
        updateData.embedding = await this.aiService.generateEmbedding(data.question);
      }
      return await this.faqModel
        .findByIdAndUpdate(id, updateData, { new: true })
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
    contributorId?: string,
    page = 1,
    limit = 20,
  ) {
    try {
      const filter: Record<string, unknown> = {};
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (search) {
        filter.$or = [
          { question: { $regex: search, $options: 'i' } },
          { details: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
          { tags: { $elemMatch: { $regex: search, $options: 'i' } } },
        ];
      }
      if (contributorName) filter.contributorName = contributorName;
      if (contributorId) filter.contributorId = contributorId;
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
        .sort({ isAccepted: -1, isVerified: -1, createdAt: 1 })
        .exec();
      return { ...question.toObject(), answers };
    } catch {
      return null;
    }
  }

  async createQuestion(data: any) {
    try {
      // 1. Yaksha Pre-Moderation
      const moderation = await this.aiService.yakshaPreModerate(data.question || '', data.details || '');
      
      // 2. Generate Semantic Embedding
      const embedding = await this.aiService.generateEmbedding(`${data.question} ${data.details}`);

      // 3. Apply Moderation & Embedding
      const newQuestionData = {
        ...data,
        question: moderation.improvedQuestion || data.question,
        category: moderation.suggestedCategory || data.category,
        embedding: embedding,
        status: (moderation.isApproved ? 'open' : 'closed') as 'open' | 'closed',
        contributorId: data.contributorId ? new Types.ObjectId(data.contributorId.toString()) : undefined,
      };

      const q = await this.questionModel.create(newQuestionData);
      this.eventsGateway.emitQuestionAdded(q);
      
      if (this.notificationModel) {
        await this.notificationModel.create({
          userId: 'admin',
          type: 'new_question',
          title: 'New Question',
          message: `${data.contributorName || 'A student'} asked: ${data.question}`,
          link: `/question/${q?._id || ''}`,
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
      
      // Update question status to 'answered' whenever an answer is added
      await this.questionModel.findByIdAndUpdate(questionId, { status: 'answered' });
      this.eventsGateway.emitStatusUpdated(questionId, 'answered');
      
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
    } catch (err) {
      console.error('[FaqService] Error adding answer:', err instanceof Error ? err.message : err);
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

      // NOTE: Question status is NOT changed here — that happens in createFaqFromAnswer
      // when the admin actually converts the question to an FAQ.

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
        this.eventsGateway.emitUserUpdated(answer.contributorId.toString());
      }

      return answer;
    } catch {
      return null;
    }
  }

  async createFaqFromAnswer(
    questionId: string,
    answerId?: string,
    category?: string,
    isNewCategory = false,
  ) {
    try {
      const question = await this.questionModel.findById(questionId).exec();
      if (!question) return null;

      // Determine answer content
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

      // Resolve category
      const finalCategory = category || question.category;

      // If a new category was requested, create it in the FAQ collection
      // (the categories list is derived from distinct FAQ categories)
      if (isNewCategory && finalCategory) {
        // Ensure at least one FAQ exists with this category by creating a placeholder
        // The category list is derived from distinct('category') on the FAQ collection
        // so we just create the FAQ with the new category name — no separate category doc needed
      }

      const faq = await this.faqModel.create({
        question: question.question,
        answer: answerContent,
        category: finalCategory,
        tags: question.tags || [],
        isAnswered: true,
        isPinned: false,
        views: 0,
      });

      // Close the question
      await this.questionModel
        .findByIdAndUpdate(questionId, { status: 'closed' })
        .exec();
      this.eventsGateway.emitStatusUpdated(questionId, 'closed');
      this.eventsGateway.emitFaqConverted(faq);

      return {
        faq,
        isNewCategory,
        category: finalCategory,
      };
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
      this.eventsGateway.emitVoteUpdated(id, answer.upvotes);
      return answer;
    } catch {
      return null;
    }
  }

  async acceptAnswer(id: string, accepted: boolean, questionId: string) {
    try {
      // If accepting, unaccept all other answers for this question first
      if (accepted) {
        await this.answerModel.updateMany(
          { questionId: new Types.ObjectId(questionId) },
          { $set: { isAccepted: false } }
        ).exec();
      }
      const answer = await this.answerModel.findByIdAndUpdate(
        id,
        { $set: { isAccepted: accepted } },
        { new: true }
      ).exec();
      if (answer) {
        this.eventsGateway.emitAnswerAccepted(id, questionId, accepted);
      }
      return answer;
    } catch {
      return null;
    }
  }

  // ── Bookmark Methods ─────────────────────────────────────────

  async toggleBookmark(userId: string, questionId: string) {
    try {
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
      return null;
    }
  }

  async getBookmarkedQuestions(userId: string) {
    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) return [];
      const ids = user.questionsBookmarked || [];
      if (ids.length === 0) return [];
      return this.questionModel
        .find({ _id: { $in: ids } })
        .sort({ createdAt: -1 })
        .exec();
    } catch {
      return [];
    }
  }

  async followUser(followerId: string, followingId: string) {
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
      return null;
    }
  }

  async getFollowing(userId: string) {
    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) return [];
      const ids = user.following || [];
      if (ids.length === 0) return [];
      return this.userModel
        .find({ _id: { $in: ids } })
        .select('-password')
        .exec();
    } catch {
      return [];
    }
  }

  async getActivityHeatmap(userId: string) {
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
      const verifiedAnswers = answers.filter((a: any) => a.isVerified);

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
    try {
      const [questionCount, answerCount, verifiedCount, totalReputation] =
        await Promise.all([
          this.questionModel.countDocuments({ contributorId: new Types.ObjectId(userId) }).exec(),
          this.answerModel.countDocuments({ contributorId: new Types.ObjectId(userId) }).exec(),
          this.answerModel.countDocuments({ contributorId: new Types.ObjectId(userId), isVerified: true }).exec(),
          this.userModel.findById(userId).select('reputation').lean().exec(),
        ]);
      return {
        questionCount,
        answerCount,
        verifiedCount,
        reputation: totalReputation?.reputation || 0,
      };
    } catch {
      return { questionCount: 0, answerCount: 0, verifiedCount: 0, reputation: 0 };
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
