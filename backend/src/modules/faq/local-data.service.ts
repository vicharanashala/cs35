import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface FaqEntry {
  category: string;
  question: string;
  answer: string;
}

const DATA_PATH = path.resolve(
  __dirname,
  '../../../../faqData.json',
);

@Injectable()
export class LocalDataService {
  private readData(): FaqEntry[] {
    try {
      const raw = fs.readFileSync(DATA_PATH, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  getAllFAQs(category?: string, search?: string) {
    const data = this.readData();
    let result = data.map((entry, i) => ({
      _id: `local-faq-${i}`,
      question: entry.question,
      answer: entry.answer,
      category: entry.category,
      tags: [],
      views: 0,
      isAnswered: true,
      createdAt: new Date().toISOString(),
    }));

    if (category) result = result.filter((f) => f.category === category);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((f) => f.question.toLowerCase().includes(q));
    }
    return result;
  }

  getCategories(): string[] {
    const data = this.readData();
    return [...new Set(data.map((e) => e.category).filter(Boolean))];
  }

  getFaqById(id: string) {
    const data = this.readData();
    const match = id.match(/^local-faq-(\d+)$/);
    if (!match) return null;
    const i = parseInt(match[1], 10);
    if (i < 0 || i >= data.length) return null;
    const entry = data[i];
    return {
      _id: `local-faq-${i}`,
      question: entry.question,
      answer: entry.answer,
      category: entry.category,
      tags: [],
      views: 0,
      isAnswered: true,
      createdAt: new Date().toISOString(),
    };
  }

  getOpenQuestions() {
    return [];
  }

  getQuestionById(_id: string) {
    return null;
  }

  createQuestion(_data: unknown) {
    return null;
  }

  addAnswer(_questionId: string, _data: { content: string; contributorName: string }) {
    return null;
  }

  reopenQuestion(_id: string) {
    return null;
  }
}