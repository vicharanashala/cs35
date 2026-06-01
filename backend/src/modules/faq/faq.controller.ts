import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Headers } from '@nestjs/common';
import { FaqService } from './faq.service';

@Controller()
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  // ── FAQs ─────────────────────────────────────────────────

  @Get('faqs')
  getAllFAQs(@Query('category') category?: string, @Query('search') search?: string) {
    return this.faqService.getAllFAQs(category, search);
  }

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
  feedback(@Param('id') id: string, @Body('helpful') helpful: boolean) {
    return this.faqService.feedback(id, helpful);
  }

  @Get('search/trending')
  getTrending() {
    return this.faqService.getTrendingSearches();
  }

  @Get('search/full')
  fullTextSearch(@Query('q') q: string) {
    return this.faqService.fullTextSearch(q);
  }

  @Get('admin/search/failed')
  getFailedSearches() {
    return [];
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
  ) {
    return this.faqService.getAllQuestions({ search, category, status });
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
  createQuestion(@Body() body: { question: string; category: string; tags?: string[]; screenshotUrl?: string }) {
    return this.faqService.createQuestion({ ...body, contributorName: 'Mahi Patel' });
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
    @Body() body: { content: string; contributorName: string },
  ) {
    return this.faqService.addAnswer(id, body);
  }

  @Patch('questions/:questionId/vote')
  voteQuestion(
    @Param('questionId') questionId: string,
    @Body() body: { answerId?: string; direction: 'up' | 'down' },
  ) {
    if (body.answerId) {
      return this.faqService.voteAnswer(questionId, body.answerId, body.direction);
    }
    return this.faqService.voteQuestion(questionId, body.direction);
  }

  @Post('questions/:id/convert-to-faq')
  convertToFaq(
    @Param('id') id: string,
    @Body() body: { answerId?: string; category: string; isNewCategory?: boolean },
  ) {
    return this.faqService.getQuestionById(id);
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
  createCategory(@Body() body: { name: string }) {
    return { name: body.name };
  }

  // ── Auth ──────────────────────────────────────────────────

  @Post('auth/login')
  login(@Body() body: { username: string; password: string }) {
    return this.faqService.login(body.username, body.password);
  }

  @Post('auth/signup')
  signup(@Body() body: { fullName: string; username: string; password: string }) {
    return this.faqService.signup(body);
  }

  @Post('auth/forgot-password')
  forgotPassword(@Body() body: { username: string }) {
    return { success: true, message: 'Password reset link sent' };
  }

  @Get('auth/me')
  getMe(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    const userId = token?.replace('token-', '');
    return this.faqService.getMe(userId || 'user-1');
  }

  // ── Users ─────────────────────────────────────────────────

  @Get('users')
  listUsers() {
    return this.faqService.getUsers();
  }

  @Get('users/leaderboard')
  getLeaderboard() {
    return this.faqService.getLeaderboard();
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() body: any) {
    return { _id: id, ...body };
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return { deleted: true, _id: id };
  }

  @Get('users/:userId/bookmarks')
  getBookmarks(@Param('userId') userId: string) {
    return this.faqService.getBookmarks(userId);
  }

  @Patch('users/:userId/bookmark/:questionId')
  toggleBookmark(@Param('userId') userId: string, @Param('questionId') questionId: string) {
    return this.faqService.toggleBookmark(userId, questionId);
  }

  @Patch('users/:followerId/follow/:followingId')
  toggleFollow(@Param('followerId') followerId: string, @Param('followingId') followingId: string) {
    return this.faqService.toggleFollow(followerId, followingId);
  }

  @Get('users/:userId/following')
  getFollowing(@Param('userId') userId: string) {
    return this.faqService.getFollowing(userId);
  }

  @Get('users/:userId/activity')
  getUserActivity(@Param('userId') userId: string) {
    return this.faqService.getUserActivity(userId);
  }

  @Get('users/:userId/stats')
  getUserStats(@Param('userId') userId: string) {
    return this.faqService.getUserStats(userId);
  }

  // ── Notifications ─────────────────────────────────────────

  @Get('notifications/:userId')
  getNotifications(@Param('userId') userId: string, @Query('isAdmin') isAdmin?: string) {
    return this.faqService.getNotifications(userId, isAdmin === 'true');
  }

  @Patch('notifications/:id/read')
  markRead(@Param('id') id: string) {
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