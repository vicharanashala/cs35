import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { FaqService } from './faq.service';
import { AiService } from '../ai/ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class FaqController {
  constructor(
    private readonly faqService: FaqService,
    private readonly aiService: AiService,
  ) {}

  // ── FAQ Routes ──────────────────────────────────────────────

  @Public()
  @Get('faqs')
  getAllFAQs(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.faqService.getAllFAQs(
      category,
      search,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Public()
  @Get('faqs/similar')
  getSimilarFAQs(@Query('q') q: string) {
    return this.faqService.getSimilarFAQs(q);
  }

  @Public()
  @Get('faqs/:id')
  getFaqById(@Param('id') id: string) {
    return this.faqService.getFaqById(id);
  }

  @Post('faqs')
  @Roles('admin')
  createFaq(
    @Body()
    body: {
      question: string;
      answer: string;
      category: string;
      tags?: string[];
    },
  ) {
    return this.faqService.createFaq(body);
  }

  @Patch('faqs/:id')
  @Roles('admin')
  updateFaq(
    @Param('id') id: string,
    @Body()
    body: {
      question?: string;
      answer?: string;
      category?: string;
      tags?: string[];
    },
  ) {
    return this.faqService.updateFaq(id, body);
  }

  @Patch('faqs/:id/view')
  @Public()
  incrementFaqViews(@Param('id') id: string) {
    return this.faqService.incrementFaqViews(id);
  }

  @Delete('faqs/:id')
  @Roles('admin')
  deleteFaq(@Param('id') id: string) {
    return this.faqService.deleteFaq(id);
  }

  @Patch('faqs/:id/pin')
  @Roles('admin')
  pinFaq(@Param('id') id: string, @Body() body: { pinned: boolean }) {
    return this.faqService.pinFaq(id, body.pinned);
  }

  @Patch('faqs/:id/feedback')
  @Public()
  submitFaqFeedback(@Param('id') id: string, @Body() body: { helpful: boolean }) {
    return this.faqService.submitFaqFeedback(id, body.helpful);
  }

  // ── Search Routes ───────────────────────────────────────────

  @Public()
  @Get('search/trending')
  getTrendingSearches() {
    return this.faqService.getTrendingSearches();
  }

  @Roles('admin')
  @Get('admin/search/failed')
  getFailedSearches() {
    return this.faqService.getFailedSearches();
  }

  @Public()
  @Get('search/full')
  fullTextSearch(@Query('q') q: string) {
    return this.faqService.getAllQuestions(undefined, undefined, q);
  }

  // ── Category Routes ─────────────────────────────────────────

  @Public()
  @Get('categories')
  getCategories() {
    return this.faqService.getCategories();
  }

  @Public()
  @Get('categories/stats')
  getCategoryStats() {
    return this.faqService.getCategoryStats();
  }

  @Post('categories')
  @Roles('admin')
  createCategory(@Body() body: { name: string }) {
    return this.faqService.createCategory(body.name);
  }

  // ── Question Routes ─────────────────────────────────────────

  @Public()
  @Get('questions/open')
  getOpenQuestions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.faqService.getOpenQuestions(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Public()
  @Get('questions')
  getAllQuestions(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('contributor') contributor?: string,
    @Query('contributorId') contributorId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.faqService.getAllQuestions(
      status,
      category,
      search,
      contributor,
      contributorId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Public()
  @Get('questions/:id')
  getQuestionById(@Param('id') id: string) {
    return this.faqService.getQuestionById(id);
  }

  @Post('questions')
  createQuestion(
    @Body()
    body: {
      question: string;
      category: string;
      details?: string;
      tags?: string[];
      screenshotUrl?: string;
      contributorName?: string;
      contributorId?: string;
    },
  ) {
    return this.faqService.createQuestion(body);
  }

  @Patch('questions/:id')
  updateQuestion(
    @Param('id') id: string,
    @Body()
    body: {
      question?: string;
      category?: string;
      priority?: 'Low' | 'Medium' | 'High';
    },
  ) {
    return this.faqService.updateQuestion(id, body);
  }

  @Delete('questions/:id')
  @Roles('admin')
  deleteQuestion(@Param('id') id: string) {
    return this.faqService.deleteQuestion(id);
  }

  @Patch('questions/:id/close')
  @Roles('admin')
  closeQuestion(@Param('id') id: string) {
    return this.faqService.closeQuestion(id);
  }

  @Patch('questions/:id/reopen')
  @Roles('admin')
  reopenQuestion(@Param('id') id: string) {
    return this.faqService.reopenQuestion(id);
  }

  @Post('questions/:id/convert-to-faq')
  @Roles('admin')
  convertToFaq(
    @Param('id') id: string,
    @Body()
    body: {
      answerId?: string;
      category?: string;
      isNewCategory?: boolean;
    },
  ) {
    return this.faqService.createFaqFromAnswer(
      id,
      body.answerId,
      body.category,
      body.isNewCategory ?? false,
    );
  }

  @Patch('questions/:id/vote')
  voteQuestion(
    @Param('id') id: string,
    @Body() body: { answerId: string; direction: number },
  ) {
    return this.faqService.voteAnswer(body.answerId, body.direction);
  }

  // ── Answer Routes ────────────────────────────────────────────

  @Patch('questions/:id/answer')
  addAnswer(
    @Param('id') id: string,
    @Body()
    body: { content: string; contributorName: string; contributorId?: string },
  ) {
    return this.faqService.addAnswer(id, body);
  }

  @Patch('answers/:id')
  updateAnswer(@Param('id') id: string, @Body() body: { content: string }) {
    return this.faqService.updateAnswer(id, body);
  }

  @Delete('answers/:id')
  @Roles('admin')
  deleteAnswer(@Param('id') id: string) {
    return this.faqService.deleteAnswer(id);
  }

  @Patch('answers/:id/verify')
  @Roles('admin')
  verifyAnswer(@Param('id') id: string, @Body() body: { verified: boolean }) {
    return this.faqService.verifyAnswer(id, body.verified);
  }

  @Patch('answers/:id/accept')
  acceptAnswer(
    @Param('id') id: string,
    @Body() body: { accepted: boolean; questionId: string },
  ) {
    return this.faqService.acceptAnswer(id, body.accepted, body.questionId);
  }

  // ── Bookmark Routes ─────────────────────────────────────────

  @Patch('users/:userId/bookmark/:questionId')
  toggleBookmark(
    @Param('userId') userId: string,
    @Param('questionId') questionId: string,
    @CurrentUser() user: { sub?: string; role?: string },
  ) {
    if (user.role !== 'admin' && user.sub !== userId) {
      throw new ForbiddenException('You can only manage your own bookmarks');
    }
    return this.faqService.toggleBookmark(userId, questionId);
  }

  @Get('users/:userId/bookmarks')
  getBookmarkedQuestions(
    @Param('userId') userId: string,
    @CurrentUser() user: { sub?: string; role?: string },
  ) {
    if (user.role !== 'admin' && user.sub !== userId) {
      throw new ForbiddenException('You can only view your own bookmarks');
    }
    return this.faqService.getBookmarkedQuestions(userId);
  }

  // ── Follow Routes ───────────────────────────────────────────

  @Patch('users/:followerId/follow/:followingId')
  followUser(
    @Param('followerId') followerId: string,
    @Param('followingId') followingId: string,
    @CurrentUser() user: { sub?: string; role?: string },
  ) {
    if (user.role !== 'admin' && user.sub !== followerId) {
      throw new ForbiddenException('You can only manage your own follow list');
    }
    return this.faqService.followUser(followerId, followingId);
  }

  @Get('users/:userId/following')
  getFollowing(
    @Param('userId') userId: string,
    @CurrentUser() user: { sub?: string; role?: string },
  ) {
    if (user.role !== 'admin' && user.sub !== userId) {
      throw new ForbiddenException('You can only view your own following list');
    }
    return this.faqService.getFollowing(userId);
  }

  // ── User Stats / Activity ───────────────────────────────────

  @Get('users/:userId/activity')
  getActivityHeatmap(
    @Param('userId') userId: string,
    @CurrentUser() user: { sub?: string; role?: string },
  ) {
    if (user.role !== 'admin' && user.sub !== userId) {
      throw new ForbiddenException('You can only view your own activity');
    }
    return this.faqService.getActivityHeatmap(userId);
  }

  @Get('users/:userId/stats')
  getUserStats(
    @Param('userId') userId: string,
    @CurrentUser() user: { sub?: string; role?: string },
  ) {
    if (user.role !== 'admin' && user.sub !== userId) {
      throw new ForbiddenException('You can only view your own stats');
    }
    return this.faqService.getUserStats(userId);
  }

  // ── User Routes ─────────────────────────────────────────────

  @Get('users')
  @Roles('admin')
  getAllUsers() {
    return this.faqService.getAllUsers();
  }

  @Patch('users/:id')
  updateUser(
    @Param('id') id: string,
    @Body() body: { isActive?: boolean; role?: string; reputation?: number; notificationPreferences?: any },
    @CurrentUser() user: { sub?: string; role?: string },
  ) {
    if (user.role !== 'admin' && user.sub !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }
    if (user.role !== 'admin') {
      delete body.isActive;
      delete body.role;
      delete body.reputation;
    }
    return this.faqService.updateUser(id, body);
  }

  @Delete('users/:id')
  @Roles('admin')
  deleteUser(@Param('id') id: string) {
    return this.faqService.deleteUser(id);
  }

  // ── Admin Stats ─────────────────────────────────────────────

  @Get('admin/stats')
  @Roles('admin')
  getStats() {
    return this.faqService.getStats();
  }

  // ── Notification Routes ──────────────────────────────────────

  @Get('notifications/:userId')
  getNotifications(
    @Param('userId') userId: string,
    @CurrentUser() user: { sub?: string; role?: string },
    @Query('isAdmin') isAdmin?: string,
  ) {
    if (user.role !== 'admin' && user.sub !== userId) {
      throw new ForbiddenException('You can only view your own notifications');
    }
    return this.faqService.getNotifications(userId, isAdmin === 'true');
  }

  @Patch('notifications/:id/read')
  markNotificationRead(
    @Param('id') id: string,
    @CurrentUser() user: { sub?: string; role?: string },
  ) {
    return this.faqService.markNotificationRead(id);
  }
}