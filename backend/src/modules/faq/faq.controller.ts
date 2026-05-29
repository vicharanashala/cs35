import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { FaqService } from './faq.service';

@Controller()
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @Get('faqs')
  getAllFAQs(@Query('category') category?: string, @Query('search') search?: string) {
    return this.faqService.getAllFAQs(category, search);
  }

  @Get('faqs/:id')
  getFaqById(@Param('id') id: string) {
    return this.faqService.getFaqById(id);
  }

  @Get('categories')
  getCategories() {
    return this.faqService.getCategories();
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
    @Body() body: { question: string; category: string; tags?: string[]; screenshotUrl?: string },
  ) {
    return this.faqService.createQuestion(body);
  }

  @Patch('questions/:id/answer')
  addAnswer(@Param('id') id: string, @Body() body: { content: string; contributorName: string }) {
    return this.faqService.addAnswer(id, body);
  }

  @Patch('questions/:id/reopen')
  reopenQuestion(@Param('id') id: string) {
    return this.faqService.reopenQuestion(id);
  }
}