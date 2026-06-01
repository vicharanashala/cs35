/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Groq } from 'groq-sdk';
import { pipeline } from '@xenova/transformers';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private groq: Groq | null = null;
  private embedder: any = null;
  private isEmbedderReady = false;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (apiKey) {
      this.groq = new Groq({ apiKey });
      this.logger.log('Groq API initialized.');
    } else {
      this.logger.warn(
        'GROQ_API_KEY is not set. LLM features will be disabled.',
      );
    }

    void this.initEmbedder();
  }

  private async initEmbedder() {
    try {
      this.embedder = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
      );
      this.isEmbedderReady = true;
      this.logger.log('Xenova MiniLM embedder loaded successfully.');
    } catch (error) {
      this.logger.error('Failed to load Xenova embedder', error);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isEmbedderReady || !this.embedder) {
      this.logger.warn('Embedder not ready. Returning empty embedding.');
      return [];
    }

    try {
      const output = await this.embedder(text, {
        pooling: 'mean',
        normalize: true,
      });
      return Array.from(output.data);
    } catch (error) {
      this.logger.error('Error generating embedding', error);
      return [];
    }
  }

  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0)
      return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async suggestCategory(
    question: string,
  ): Promise<{ category: string; confidence: number }> {
    const CATEGORIES = [
      'NOC',
      'Offer Letter',
      'ViBe',
      'Samagama',
      'Stipend',
      'General',
    ];
    if (!this.groq) {
      return { category: 'General', confidence: 0 };
    }

    try {
      const prompt = `You are a category classifier for the Samagama student Q&A platform.
Given the question title below, pick the single best category from this list: ${CATEGORIES.join(', ')}.
Return ONLY a JSON object: {"category": "the best category"}`;

      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: `Question: "${question}"` },
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const raw = chatCompletion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(raw);
      const suggested = parsed.category?.trim();

      if (
        CATEGORIES.some((c) => c.toLowerCase() === suggested?.toLowerCase())
      ) {
        const match = CATEGORIES.find(
          (c) => c.toLowerCase() === suggested.toLowerCase(),
        );
        return { category: match, confidence: 0.85 };
      }
      return { category: 'General', confidence: 0.5 };
    } catch (error) {
      this.logger.error('Error in suggestCategory', error);
      return { category: 'General', confidence: 0 };
    }
  }

  async yakshaPreModerate(
    question: string,
    details: string,
  ): Promise<{
    isApproved: boolean;
    suggestedCategory: string;
    improvedQuestion: string;
    reason: string;
  }> {
    if (!this.groq) {
      return {
        isApproved: true,
        suggestedCategory: 'General',
        improvedQuestion: question,
        reason: 'Groq API disabled. Auto-approved.',
      };
    }

    try {
      const prompt = `
You are Yaksha, the AI moderator for the Samagama student Q&A platform.
Please evaluate the following user question:
Title: "${question}"
Details: "${details}"

Tasks:
1. Is it appropriate? (Reject spam, hate speech, or complete nonsense).
2. Suggest the best category from: Admissions, Campus Life, Placements, Academics, Technical, Administrative, General.
3. Improve the question title for clarity and professionalism (keep it brief).

Respond ONLY with a valid JSON object matching this schema:
{
  "isApproved": boolean,
  "suggestedCategory": string,
  "improvedQuestion": string,
  "reason": "Brief explanation of your decision"
}`;

      const chatCompletion = await this.groq.chat.completions.create({
        messages: [{ role: 'system', content: prompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const responseText = chatCompletion.choices[0]?.message?.content || '{}';
      return JSON.parse(responseText);
    } catch (error) {
      this.logger.error('Error in Yaksha Pre-Moderation', error);
      return {
        isApproved: true,
        suggestedCategory: 'General',
        improvedQuestion: question,
        reason: 'Error occurred during AI processing. Defaulting to approved.',
      };
    }
  }

  async generateMasterFAQ(
    questions: { title: string; details: string; answers: any[] }[],
  ): Promise<{
    masterQuestion: string;
    masterAnswer: string;
    category: string;
  }> {
    if (!this.groq || questions.length === 0) {
      return null;
    }

    try {
      const dataStr = JSON.stringify(
        questions.map((q) => ({
          q: q.title,
          a: q.answers
            .filter((ans) => ans.isVerified)
            .map((ans) => ans.content)
            .join(' '),
        })),
      );

      const prompt = `
You are an expert technical writer for the Samagama knowledge base.
I will provide you a JSON list of highly similar user questions and their verified answers.
Your task is to synthesize them into ONE single, high-quality "Master FAQ".

Data: ${dataStr}

Respond ONLY with a valid JSON object matching this schema:
{
  "masterQuestion": "A clear, general question that captures the intent of all these questions",
  "masterAnswer": "A comprehensive, well-formatted markdown answer synthesizing the best information",
  "category": "The most appropriate category"
}`;

      const chatCompletion = await this.groq.chat.completions.create({
        messages: [{ role: 'system', content: prompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const responseText = chatCompletion.choices[0]?.message?.content || '{}';
      return JSON.parse(responseText);
    } catch (error) {
      this.logger.error('Error generating Master FAQ', error);
      return null;
    }
  }
}
