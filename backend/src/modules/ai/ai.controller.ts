import { Controller, Get, Query } from '@nestjs/common';
import { AiService } from './ai.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Public()
  @Get('suggest-category')
  async suggestCategory(@Query('title') title: string) {
    if (!title || title.trim().length < 4) {
      return { category: null, confidence: 0 };
    }
    return this.aiService.suggestCategory(title.trim());
  }
}