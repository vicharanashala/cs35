import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { FaqService } from './faq.service';

@Controller()
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  // ── FAQ Routes ──────────────────────────────────────────────

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

  @Get('faqs/:id')
  getFaqById(@Param('id') id: string) {
    return this.faqService.getFaqById(id);
  }

  @Post('faqs')
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
  incrementFaqViews(@Param('id') id: string) {
    return this.faqService.incrementFaqViews(id);
  }

  @Delete('faqs/:id')
  deleteFaq(@Param('id') id: string) {
    return this.faqService.deleteFaq(id);
  }

  @Patch('faqs/:id/pin')
  pinFaq(@Param('id') id: string, @Body() body: { pinned: boolean }) {
    return this.faqService.pinFaq(id, body.pinned);
  }

  // ── Category Routes ─────────────────────────────────────────

  @Get('categories')
  getCategories() {
    return this.faqService.getCategories();
  }

  @Get('categories/stats')
  getCategoryStats() {
    return this.faqService.getCategoryStats();
  }

  @Post('categories')
  createCategory(@Body() body: { name: string }) {
    return this.faqService.createCategory(body.name);
  }

  // ── Question Routes ─────────────────────────────────────────

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

  @Get('questions')
  getAllQuestions(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('contributor') contributor?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.faqService.getAllQuestions(
      status,
      category,
      search,
      contributor,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

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
  deleteQuestion(@Param('id') id: string) {
    return this.faqService.deleteQuestion(id);
  }

  @Patch('questions/:id/close')
  closeQuestion(@Param('id') id: string) {
    return this.faqService.closeQuestion(id);
  }

  @Patch('questions/:id/reopen')
  reopenQuestion(@Param('id') id: string) {
    return this.faqService.reopenQuestion(id);
  }

  @Patch('questions/:id/convert-to-faq')
  convertToFaq(@Param('id') id: string, @Body() body: { answerId?: string }) {
    return this.faqService.convertToFaq(id, body.answerId);
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
  deleteAnswer(@Param('id') id: string) {
    return this.faqService.deleteAnswer(id);
  }

  @Patch('answers/:id/verify')
  verifyAnswer(@Param('id') id: string, @Body() body: { verified: boolean }) {
    return this.faqService.verifyAnswer(id, body.verified);
  }

  // ── User Routes ─────────────────────────────────────────────

  @Get('users')
  getAllUsers() {
    return this.faqService.getAllUsers();
  }

  @Patch('users/:id')
  updateUser(
    @Param('id') id: string,
    @Body() body: { isActive?: boolean; role?: string; reputation?: number },
  ) {
    return this.faqService.updateUser(id, body);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.faqService.deleteUser(id);
  }

  // ── Admin Stats ─────────────────────────────────────────────

  @Get('admin/stats')
  getStats() {
    return this.faqService.getStats();
  }

  // ── Notification Routes ──────────────────────────────────────

  @Get('notifications/:userId')
  getNotifications(@Param('userId') userId: string, @Query('isAdmin') isAdmin?: string) {
    return this.faqService.getNotifications(userId, isAdmin === 'true');
  }

  @Patch('notifications/:id/read')
  markNotificationRead(@Param('id') id: string) {
    return this.faqService.markNotificationRead(id);
  }
}
