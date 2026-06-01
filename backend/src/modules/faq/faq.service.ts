import { Injectable, Inject } from '@nestjs/common';
import { LocalDataService } from './local-data.service';

@Injectable()
export class FaqService {
  constructor(
    @Inject('FAQ_MODEL') private faqModel: any,
    @Inject('QUESTION_MODEL') private questionModel: any,
    @Inject('ANSWER_MODEL') private answerModel: any,
    private localData: LocalDataService,
  ) {}

  async getAllFAQs(category?: string, search?: string) {
    return this.localData.getAllFAQs(category, search);
  }

  async getFaqById(id: string) {
    return this.localData.getFaqById(id);
  }

  async createFaq(data: any) {
    return this.localData.createFaq(data);
  }

  async updateFaq(id: string, data: any) {
    return this.localData.updateFaq(id, data);
  }

  async deleteFaq(id: string) {
    return this.localData.deleteFaq(id);
  }

  async upvoteFaq(id: string) {
    return this.localData.upvoteFaq(id);
  }

  async incrementFaqView(id: string) {
    return this.localData.incrementFaqView(id);
  }

  async feedback(id: string, helpful: boolean) {
    return { id, helpful };
  }

  async getAllQuestions(params: any = {}) {
    return this.localData.getAllQuestions(params);
  }

  async getOpenQuestions() {
    return this.localData.getOpenQuestions();
  }

  async getQuestionById(id: string) {
    return this.localData.getQuestionById(id);
  }

  async createQuestion(data: any) {
    return this.localData.createQuestion(data);
  }

  async updateQuestion(id: string, data: any) {
    return this.localData.updateQuestion(id, data);
  }

  async deleteQuestion(id: string) {
    return this.localData.deleteQuestion(id);
  }

  async closeQuestion(id: string) {
    return this.localData.closeQuestion(id);
  }

  async reopenQuestion(id: string, reason?: string) {
    return this.localData.reopenQuestion(id, reason);
  }

  async addAnswer(questionId: string, data: { content: string; contributorName: string }) {
    return this.localData.addAnswer(questionId, data);
  }

  async voteQuestion(questionId: string, direction: 'up' | 'down') {
    return this.localData.voteQuestion(questionId, direction);
  }

  async voteAnswer(questionId: string, answerId: string, direction: 'up' | 'down') {
    return this.localData.voteAnswer(questionId, answerId, direction);
  }

  async verifyAnswer(questionId: string, answerId: string, verified: boolean) {
    return this.localData.verifyAnswer(questionId, answerId, verified);
  }

  async acceptAnswer(questionId: string, answerId: string, accepted: boolean) {
    return this.localData.acceptAnswer(questionId, answerId, accepted);
  }

  async updateAnswer(answerId: string, data: { content: string }) {
    return this.localData.updateAnswer(answerId, data);
  }

  async deleteAnswer(answerId: string) {
    return this.localData.deleteAnswer(answerId);
  }

  async getCategories() {
    return this.localData.getCategories();
  }

  async getCategoryStats() {
    return this.localData.getCategoryStats();
  }

  async login(username: string, password: string) {
    return this.localData.login(username, password);
  }

  async signup(data: { fullName: string; username: string; password: string }) {
    return this.localData.signup(data);
  }

  async getMe(userId: string) {
    return this.localData.getMe(userId);
  }

  async getUsers() {
    return this.localData.getUsers();
  }

  async getLeaderboard() {
    return this.localData.getLeaderboard();
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

  async getUserStats(userId: string) {
    return this.localData.getUserStats(userId);
  }

  async toggleBookmark(userId: string, questionId: string) {
    return this.localData.toggleBookmark(userId, questionId);
  }

  async getBookmarks(userId: string) {
    return this.localData.getBookmarks(userId);
  }

  async toggleFollow(followerId: string, followingId: string) {
    return this.localData.toggleFollow(followerId, followingId);
  }

  async getFollowing(userId: string) {
    return this.localData.getFollowing(userId);
  }

  async getNotifications(userId: string, isAdmin = false) {
    return this.localData.getNotifications(userId, isAdmin);
  }

  async markNotificationRead(id: string) {
    return this.localData.markNotificationRead(id);
  }

  async getAdminStats() {
    return this.localData.getAdminStats();
  }

  async getTrendingSearches() {
    return this.localData.getTrendingSearches();
  }

  async fullTextSearch(q: string) {
    return this.localData.getFullTextSearch(q);
  }
}