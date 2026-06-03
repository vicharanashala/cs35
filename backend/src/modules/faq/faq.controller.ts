import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Headers, ForbiddenException, UseGuards } from '@nestjs/common';
import { FaqService } from './faq.service';
import { CurrentUser, Public, Roles } from '../../common/decorators';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  // ── FAQs ─────────────────────────────────────────────────

  @Public()
  @Get('faqs')
  getAllFAQs(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '2000'
  ) {
    return this.faqService.getAllFAQs(category, search, parseInt(page), parseInt(limit));
  }

  @Public()
  @Get('faqs/:id')
  getFaqById(@Param('id') id: string) {
    return this.faqService.getFaqById(id);
  }

  @Post('faqs')
  createFaq(@Body() body: { question: string; answer: string; category: string; tags?: string[] }) {
    return this.faqService.createFaq(body);
  }

  @Patch('faqs/:id')
  updateFaq(@Param('id') id: string, @Body() body: any) {
    return this.faqService.updateFaq(id, body);
  }

  @Delete('faqs/:id')
  deleteFaq(@Param('id') id: string) {
    return this.faqService.deleteFaq(id);
  }

  @Post('faqs/:id/upvote')
  upvoteFaq(@Param('id') id: string) {
    return this.faqService.upvoteFaq(id);
  }

  @Patch('faqs/:id/view')
  incrementView(@Param('id') id: string) {
    return this.faqService.incrementFaqView(id);
  }

  @Patch('faqs/:id/feedback')
  @Public()
  submitFaqFeedback(
    @Param('id') id: string,
    @Body()
    body: {
      helpful: boolean;
      previousVote?: 'up' | 'down' | null;
      deselect?: boolean;
      reason?: string;
      userLabel?: string;
    },
  ) {
    return this.faqService.submitFaqFeedback(
      id,
      body.helpful,
      body.previousVote,
      body.deselect,
      body.reason,
      body.userLabel,
    );
  }

  @Get('search/trending')
  getTrending() {
    return this.faqService.getTrendingSearches();
  }

  @Roles('admin')
  @Get('admin/search/failed')
  getFailedSearches() {
    return this.faqService.getFailedSearches();
  }

  @Roles('admin')
  @Get('admin/feedback/unhelpful')
  getUnhelpfulFeedback() {
    return this.faqService.getUnhelpfulFeedback();
  }

  @Public()
  @Get('search/full')
  fullTextSearch(@Query('q') q: string) {
    return this.faqService.fullTextSearch(q);
  }

  @Get('faqs/similar')
  getSimilar(@Query('q') q: string) {
    return this.faqService.getAllFAQs(undefined, q);
  }

  // ── Questions ─────────────────────────────────────────────

  @Get('questions')
  getAllQuestions(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('contributorId') contributorId?: string,
    @Query('answeredBy') answeredBy?: string,
  ) {
    return this.faqService.getAllQuestions({ search, category, status, contributorId, answeredBy });
  }

  @Get('questions/open')
  getOpenQuestions() {
    return this.faqService.getOpenQuestions();
  }

  @Get('questions/:id')
  getQuestionById(@Param('id') id: string) {
    return this.faqService.getQuestionById(id);
  }

  @Post('questions')
  createQuestion(
    @Body() body: { question: string; category: string; tags?: string[]; screenshotUrl?: string; pendingCategory?: string },
    @CurrentUser() user: { id?: string; name?: string }
  ) {
    return this.faqService.createQuestion({ 
      ...body, 
      contributorId: user.id,
      contributorName: user.name || 'Student' 
    });
  }

  @Patch('questions/:id')
  updateQuestion(@Param('id') id: string, @Body() body: any) {
    return this.faqService.updateQuestion(id, body);
  }

  @Delete('questions/:id')
  deleteQuestion(@Param('id') id: string) {
    return this.faqService.deleteQuestion(id);
  }

  @Patch('questions/:id/close')
  closeQuestion(@Param('id') id: string) {
    return this.faqService.closeQuestion(id);
  }

  @Patch('questions/:id/reopen')
  reopenQuestion(@Param('id') id: string, @Body() body?: { reason?: string }) {
    return this.faqService.reopenQuestion(id, body?.reason);
  }

  @Patch('questions/:id/answer')
  addAnswer(
    @Param('id') id: string,
    @Body() body: { content: string; contributorName?: string; pendingCategory?: string },
    @CurrentUser() user: { id?: string; name?: string }
  ) {
    return this.faqService.addAnswer(id, {
      ...body,
      contributorId: user.id,
      contributorName: user.name || body.contributorName || 'Student'
    });
  }

  @Patch('questions/:questionId/vote')
  voteQuestion(
    @Param('questionId') questionId: string,
    @Body() body: { answerId?: string; direction: any },
    @CurrentUser() user: { id?: string },
  ) {
    if (body.answerId) {
      return this.faqService.voteAnswer(questionId, body.answerId, body.direction, user?.id || 'anonymous');
    }
    return this.faqService.voteQuestion(questionId, body.direction);
  }

  @Post('questions/:id/convert-to-faq')
  convertToFaq(
    @Param('id') id: string,
    @Body() body: { answerId?: string; category?: string; isNewCategory?: boolean },
  ) {
    return this.faqService.convertToFaq(id, body.answerId, body.category);
  }

  // ── Answers ───────────────────────────────────────────────

  @Patch('answers/:id')
  updateAnswer(@Param('id') id: string, @Body() body: { content: string }) {
    return this.faqService.updateAnswer(id, body);
  }

  @Delete('answers/:id')
  deleteAnswer(@Param('id') id: string) {
    return this.faqService.deleteAnswer(id);
  }

  @Patch('answers/:id/verify')
  verifyAnswer(@Param('id') answerId: string, @Body() body: { verified: boolean; questionId?: string }) {
    return this.faqService.verifyAnswer(body.questionId || '', answerId, body.verified);
  }

  @Patch('answers/:id/accept')
  acceptAnswer(@Param('id') answerId: string, @Body() body: { accepted: boolean; questionId: string }) {
    return this.faqService.acceptAnswer(body.questionId, answerId, body.accepted);
  }

  // ── Categories ────────────────────────────────────────────

  @Get('categories')
  listCategories() {
    return this.faqService.getCategories();
  }

  @Get('categories/stats')
  getCategoryStats() {
    return this.faqService.getCategoryStats();
  }

  @Post('categories')
  createCategory(@Body() body: { name: string; confirmed?: boolean }) {
    return this.faqService.createCategory(body.name, body.confirmed);
  }

  @Patch('categories/confirm')
  confirmCategory(@Body() body: { name: string }) {
    return this.faqService.confirmCategory(body.name);
  }

  @Patch('users/:userId/bookmark/:questionId')
  toggleBookmark(
    @Param('userId') userId: string,
    @Param('questionId') questionId: string,
    @CurrentUser() user: { id?: string; role?: string },
  ) {
    if (user.role !== 'admin' && user.id !== userId) {
      throw new ForbiddenException('You can only manage your own bookmarks');
    }
    return this.faqService.toggleBookmark(userId, questionId);
  }

  @Get('users/:userId/bookmarks')
  getBookmarkedQuestions(
    @Param('userId') userId: string,
    @CurrentUser() user: { id?: string; role?: string },
  ) {
    if (user.role !== 'admin' && user.id !== userId) {
      throw new ForbiddenException('You can only view your own bookmarks');
    }
    return this.faqService.getBookmarkedQuestions(userId);
  }

  @Get('users/:userId/answers')
  getUserAnswers(
    @Param('userId') userId: string,
    @CurrentUser() user: { id?: string; role?: string },
  ) {
    if (user.role !== 'admin' && user.id !== userId) {
      throw new ForbiddenException('You can only view your own answers');
    }
    return this.faqService.getUserAnswers(userId);
  }

  // ── Follow Routes ───────────────────────────────────────────

  @Patch('users/:followerId/follow/:followingId')
  followUser(
    @Param('followerId') followerId: string,
    @Param('followingId') followingId: string,
    @CurrentUser() user: { id?: string; role?: string },
  ) {
    if (user.role !== 'admin' && user.id !== followerId) {
      throw new ForbiddenException('You can only manage your own follow list');
    }
    return this.faqService.followUser(followerId, followingId);
  }

  @Get('users/:userId/following')
  getFollowing(
    @Param('userId') userId: string,
    @CurrentUser() user: { id?: string; role?: string },
  ) {
    if (user.role !== 'admin' && user.id !== userId) {
      throw new ForbiddenException('You can only view your own following list');
    }
    return this.faqService.getFollowing(userId);
  }

  // ── User Stats / Activity ───────────────────────────────────

  @Get('users/:userId/activity')
  getActivityHeatmap(
    @Param('userId') userId: string,
    @CurrentUser() user: { id?: string; role?: string },
  ) {
    if (user.role !== 'admin' && user.id !== userId) {
      throw new ForbiddenException('You can only view your own activity');
    }
    return this.faqService.getActivityHeatmap(userId);
  }

  @Get('users/:userId/stats')
  getUserStats(
    @Param('userId') userId: string,
    @CurrentUser() user: { id?: string; role?: string },
  ) {
    if (user.role !== 'admin' && user.id !== userId) {
      throw new ForbiddenException('You can only view your own stats');
    }
    return this.faqService.getUserStats(userId);
  }

  // ── Users ─────────────────────────────────────────────────

  @Get('users')
  listUsers() {
    return this.faqService.getUsers();
  }

  @Patch('users/:id')
  updateUser(
    @Param('id') id: string,
    @Body() body: { isActive?: boolean; role?: string; notificationPreferences?: any },
    @CurrentUser() user: { id?: string; role?: string },
  ) {
    if (user.role !== 'admin' && user.id !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }
    if (user.role !== 'admin') {
      delete body.isActive;
      delete body.role;
    }
    return this.faqService.updateUser(id, body);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return { deleted: true, _id: id };
  }



  // ── Notifications ─────────────────────────────────────────

  @Get('notifications/:userId')
  getNotifications(
    @Param('userId') userId: string,
    @CurrentUser() user: { id?: string; role?: string },
    @Query('isAdmin') isAdmin?: string,
  ) {
    if (user.role !== 'admin' && user.id !== userId) {
      throw new ForbiddenException('You can only view your own notifications');
    }
    return this.faqService.getNotifications(userId, isAdmin === 'true');
  }

  @Patch('notifications/:id/read')
  markNotificationRead(
    @Param('id') id: string,
    @CurrentUser() user: { id?: string; role?: string },
  ) {
    return this.faqService.markNotificationRead(id);
  }

  // ── Admin ─────────────────────────────────────────────────

  @Get('admin/stats')
  getAdminStats() {
    return this.faqService.getAdminStats();
  }

  @Patch('faqs/:id/pin')
  pinFaq(@Param('id') id: string, @Body('pinned') pinned: boolean) {
    return this.faqService.updateFaq(id, { isPinned: pinned });
  }

  // ── User Profile (legacy) ─────────────────────────────────

  @Get('user/profile')
  getUserProfile() {
    return this.faqService.getUserProfile();
  }

  @Get('user/questions')
  getUserQuestions() {
    return this.faqService.getUserQuestions('user-1');
  }
}