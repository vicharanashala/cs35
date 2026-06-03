import { Injectable } from '@nestjs/common';
import * as fs from 'fs';

// ─── Interfaces ─────────────────────────────────────────────

export interface FaqEntry {
  category: string;
  question: string;
  answer: string;
}

export interface Answer {
  _id: string;
  content: string;
  contributorName: string;
  isVerified: boolean;
  isAccepted?: boolean;
  upvotes: number;
  downvotes: number;
  pendingCategory?: string;   // set when answer adds a new category
  createdAt: string;
}

export interface Question {
  _id: string;
  question: string;
  category: string;
  pendingCategory?: string;   // student's custom category awaiting admin approval
  tags: string[];
  screenshotUrl?: string;
  status: 'open' | 'answered' | 'closed' | 'reopened';
  priority?: 'High' | 'Medium' | 'Low';
  answers: Answer[];
  contributorName: string;
  upvotes: number;
  downvotes: number;
  views: number;
  isReopened?: boolean;
  reopenReason?: string;
  createdAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link: string;
  senderName?: string;
  isRead: boolean;
  createdAt: string;
}

export interface SafeUser {
  _id: string;
  email: string;
  username: string;
  name: string;
  role: string;
  createdAt: string;
  questionsCount: number;
  answersCount: number;
  verifiedCount: number;
  following: string[];
  followers: string[];
  bookmarks: string[];
}

// ─── In-memory stores ────────────────────────────────────────

const inMemoryQuestions: Question[] = [
  {
    _id: 'local-q-0',
    question: 'How do I apply for an NOC?',
    category: 'NOC',
    tags: ['noc', 'application'],
    screenshotUrl: '',
    status: 'open',
    priority: 'High',
    answers: [],
    contributorName: 'Aryan Singh',
    upvotes: 0,
    downvotes: 0,
    views: 12,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    _id: 'local-q-1',
    question: 'When will the offer letter be released?',
    category: 'Offer Letter',
    tags: ['offer-letter', 'timing'],
    screenshotUrl: '',
    status: 'open',
    priority: 'Medium',
    answers: [],
    contributorName: 'Sneha Reddy',
    upvotes: 0,
    downvotes: 0,
    views: 8,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: 'local-q-2',
    question: 'How does ViBe attendance work?',
    category: 'ViBe',
    tags: ['vibe', 'attendance'],
    screenshotUrl: '',
    status: 'answered',
    priority: 'Medium',
    answers: [
      {
        _id: 'local-a-2-1',
        content:
          'ViBe attendance is tracked automatically based on your login activity. You need a minimum of 80% participation to be eligible for stipend clearance.',
        contributorName: 'Priya Sharma',
        isVerified: true,
        isAccepted: true,
        upvotes: 5,
        downvotes: 0,
        createdAt: new Date(Date.now() - 43200000).toISOString(),
      },
    ],
    contributorName: 'Karthik Nair',
    upvotes: 0,
    downvotes: 0,
    views: 45,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    _id: 'local-q-3',
    question: 'What is the Samagama stipend disbursement process?',
    category: 'Samagama',
    tags: ['stipend', 'disbursement'],
    screenshotUrl: '',
    status: 'answered',
    priority: 'High',
    answers: [
      {
        _id: 'local-a-3-1',
        content:
          'Stipend is disbursed on the 28th of every month via bank transfer. Make sure your bank details are updated in the Samagama portal under Profile > Bank Info.',
        contributorName: 'Ravi Kumar',
        isVerified: true,
        isAccepted: true,
        upvotes: 8,
        downvotes: 0,
        createdAt: new Date(Date.now() - 21600000).toISOString(),
      },
    ],
    contributorName: 'Meera Joshi',
    upvotes: 0,
    downvotes: 0,
    views: 67,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    _id: 'local-q-4',
    question: 'Is there a deadline for submitting the NOC application?',
    category: 'NOC',
    tags: ['noc', 'deadline'],
    screenshotUrl: '',
    status: 'reopened',
    priority: 'Low',
    answers: [
      {
        _id: 'local-a-4-1',
        content: 'NOC applications are processed within 5 working days.',
        contributorName: 'Admin',
        isVerified: false,
        isAccepted: false,
        upvotes: 0,
        downvotes: 0,
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
    ],
    contributorName: 'Aditya Verma',
    upvotes: 0,
    downvotes: 0,
    views: 23,
    isReopened: true,
    reopenReason: 'Need more specific timeline',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    _id: 'local-q-5',
    question: 'Can I update my Samagama profile after registration?',
    category: 'Samagama',
    tags: ['profile', 'registration'],
    screenshotUrl: '',
    status: 'open',
    priority: 'Low',
    answers: [],
    contributorName: 'Nisha Gupta',
    upvotes: 0,
    downvotes: 0,
    views: 5,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: 'local-q-6',
    question: 'What is the selection process for Phase 2?',
    category: 'Selection Process',
    tags: ['selection', 'phase-2'],
    screenshotUrl: '',
    status: 'answered',
    priority: 'High',
    answers: [
      {
        _id: 'local-a-6-1',
        content: 'Phase 2 selection consists of a technical interview followed by an HR round. The technical interview covers your domain knowledge and problem-solving skills.',
        contributorName: 'Vikram Singh',
        isVerified: true,
        isAccepted: true,
        upvotes: 12,
        downvotes: 0,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ],
    contributorName: 'Rohan Pillai',
    upvotes: 0,
    downvotes: 0,
    views: 89,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
];

const inMemoryNotifications: Notification[] = [
  {
    _id: 'notif-1',
    userId: 'user-1',
    title: 'New answer on your question',
    message: 'Priya Sharma answered "How does ViBe attendance work?"',
    type: 'answer_added',
    link: '/questions/local-q-2',
    senderName: 'Priya',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: 'notif-2',
    userId: 'user-1',
    title: 'Your answer was verified',
    message: 'An admin verified your answer on "NOC deadline"',
    type: 'answer_verified',
    link: '/questions/local-q-4',
    senderName: 'Admin',
    isRead: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const inMemoryCategories = [
  'NOC', 'Offer Letter', 'ViBe', 'Samagama', 'Selection Process',
  'Interviews', 'Certificate', 'Rosetta', 'Phase 1', 'Yaksha', 'Team',
  'Work & Mentorship', 'Code of Conduct', 'About the Internship', 'Timing & Schedule',
];

interface InMemoryUser {
  _id: string;
  email: string;
  username: string;
  password: string;
  name: string;
  role: string;
  createdAt: string;
  questionsCount: number;
  answersCount: number;
  verifiedCount: number;
  following: string[];
  followers: string[];
  bookmarks: string[];
}

const inMemoryUsers: InMemoryUser[] = [
  {
    _id: 'user-1',
    email: 'mahi@example.com',
    username: 'mahi_patel',
    password: 'password123',
    name: 'Mahi Patel',
    role: 'admin',
    createdAt: '2025-09-01T00:00:00.000Z',
    questionsCount: 5,
    answersCount: 12,
    verifiedCount: 3,
    following: [],
    followers: [],
    bookmarks: [],
  },
];

let nextUserId = 2;

@Injectable()
export class LocalDataService {
  private dataPath = 'C:\\Users\\manos\\OneDrive\\Desktop\\AskSam\\faqData.json';
  private userBookmarks: string[] = [];
  private userFollowing: string[] = [];
  private userFollowers: string[] = [];

  private readData(): FaqEntry[] {
    try {
      const raw = fs.readFileSync(this.dataPath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  // ─── FAQs ──────────────────────────────────────────────────

  getAllFAQs(category?: string, search?: string): FaqEntry[] {
    const data = this.readData();
    let result = data.map((entry, i) => ({
      _id: `local-faq-${i}`,
      question: entry.question,
      answer: entry.answer,
      category: entry.category,
      tags: [] as string[],
      views: Math.floor(Math.random() * 200),
      upvotes: Math.floor(Math.random() * 30),
      isAnswered: true,
      isPinned: false,
      createdAt: new Date().toISOString(),
    }));

    if (category) result = result.filter(f => f.category === category);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(f => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
    }
    return result;
  }

  getFaqById(id: string): (FaqEntry & { _id: string; views: number; upvotes: number; isAnswered: boolean; isPinned: boolean; tags: string[]; createdAt: string }) | null {
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
      views: Math.floor(Math.random() * 200),
      upvotes: Math.floor(Math.random() * 30),
      isAnswered: true,
      isPinned: false,
      createdAt: new Date().toISOString(),
    };
  }

  createFaq(data: { question: string; answer: string; category: string; tags?: string[] }) {
    return {
      _id: `local-faq-${Date.now()}`,
      ...data,
      tags: data.tags || [],
      views: 0,
      upvotes: 0,
      isAnswered: true,
      isPinned: false,
      createdAt: new Date().toISOString(),
    };
  }

  updateFaq(id: string, data: Partial<{ question: string; answer: string; category: string; tags: string[]; isPinned: boolean }>) {
    return { _id: id, ...data };
  }

  deleteFaq(id: string) {
    return { deleted: true, _id: id };
  }

  upvoteFaq(id: string) {
    return { _id: id, upvotes: 1 };
  }

  incrementFaqView(id: string) {
    return { _id: id, views: 1 };
  }

  feedback(id: string, isHelpful: boolean) {
    const faq = this.getFaqById(id);
    if (!faq) return null;
    return { ...faq, helpfulCount: isHelpful ? 1 : 0, unhelpfulCount: isHelpful ? 0 : 1 };
  }

  // ─── Questions ─────────────────────────────────────────────

  getAllQuestions(params: { search?: string; category?: string; status?: string } = {}): Question[] {
    let result = [...inMemoryQuestions];
    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter(x => x.question.toLowerCase().includes(q));
    }
    if (params.category && params.category !== 'All Categories') {
      result = result.filter(x => x.category === params.category);
    }
    if (params.status === 'Unanswered') result = result.filter(x => x.answers.length === 0);
    if (params.status === 'Answered') result = result.filter(x => x.answers.length > 0);
    return result;
  }

  getOpenQuestions(): Question[] {
    return inMemoryQuestions
      .filter(q => q.status === 'open' || q.status === 'reopened')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getQuestionById(id: string): Question | null {
    return inMemoryQuestions.find(q => q._id === id) ?? null;
  }

  createQuestion(data: { question: string; category: string; pendingCategory?: string; tags?: string[]; screenshotUrl?: string; contributorName?: string }): Question {
    const newQ: Question = {
      _id: `local-q-${Date.now()}`,
      question: data.question,
      category: data.category || 'General',
      pendingCategory: data.pendingCategory,   // undefined for existing cats, set for new cats
      tags: data.tags || [],
      screenshotUrl: data.screenshotUrl,
      status: 'open',
      priority: 'Medium',
      answers: [],
      contributorName: data.contributorName || 'Anonymous',
      upvotes: 0,
      downvotes: 0,
      views: 0,
      createdAt: new Date().toISOString(),
    };
    inMemoryQuestions.push(newQ);
    return newQ;
  }

  updateQuestion(id: string, data: Partial<Question>): Question | null {
    const q = inMemoryQuestions.find(q => q._id === id);
    if (!q) return null;
    Object.assign(q, data);
    return q;
  }

  deleteQuestion(id: string): { deleted: boolean } | null {
    const idx = inMemoryQuestions.findIndex(q => q._id === id);
    if (idx === -1) return null;
    inMemoryQuestions.splice(idx, 1);
    return { deleted: true };
  }

  closeQuestion(id: string): Question | null {
    const q = inMemoryQuestions.find(q => q._id === id);
    if (!q) return null;
    q.status = 'closed';
    return q;
  }

  reopenQuestion(id: string, reason?: string): Question | null {
    const q = inMemoryQuestions.find(q => q._id === id);
    if (!q) return null;
    q.status = 'reopened';
    q.isReopened = true;
    q.reopenReason = reason;
    return q;
  }

  addAnswer(questionId: string, data: { content: string; contributorName: string }): Answer | null {
    const q = inMemoryQuestions.find(q => q._id === questionId);
    if (!q) return null;
    const newAnswer: Answer = {
      _id: `local-a-${Date.now()}`,
      content: data.content,
      contributorName: data.contributorName,
      isVerified: false,
      isAccepted: false,
      upvotes: 0,
      downvotes: 0,
      createdAt: new Date().toISOString(),
    };
    q.answers.push(newAnswer);
    if (q.status === 'open') q.status = 'answered';
    return newAnswer;
  }

  voteQuestion(questionId: string, direction: 'up' | 'down') { return null; }

  voteAnswer(questionId: string, answerId: string, direction: 'up' | 'down'): Answer | null {
    const q = inMemoryQuestions.find(q => q._id === questionId);
    if (!q) return null;
    const a = q.answers.find(a => a._id === answerId);
    if (!a) return null;
    if (direction === 'up') a.upvotes++;
    else a.downvotes++;
    return a;
  }

  verifyAnswer(questionId: string, answerId: string, verified: boolean): Answer | null {
    const q = inMemoryQuestions.find(q => q._id === questionId);
    if (!q) return null;
    const a = q.answers.find(a => a._id === answerId);
    if (!a) return null;
    a.isVerified = verified;
    return a;
  }

  acceptAnswer(questionId: string, answerId: string, accepted: boolean): Question | null {
    const q = inMemoryQuestions.find(q => q._id === questionId);
    if (!q) return null;
    q.answers.forEach(a => { a.isAccepted = false; });
    if (accepted) {
      const a = q.answers.find(a => a._id === answerId);
      if (a) a.isAccepted = true;
    }
    return q;
  }

  updateAnswer(answerId: string, data: { content: string }): Answer | null {
    for (const q of inMemoryQuestions) {
      const a = q.answers.find(a => a._id === answerId);
      if (a) { a.content = data.content; return a; }
    }
    return null;
  }

  deleteAnswer(answerId: string): { deleted: boolean } | null {
    for (const q of inMemoryQuestions) {
      const idx = q.answers.findIndex(a => a._id === answerId);
      if (idx !== -1) { q.answers.splice(idx, 1); return { deleted: true }; }
    }
    return null;
  }

  // ─── Categories ─────────────────────────────────────────────

  getCategories(): string[] {
    return inMemoryCategories;
  }

  // Internal helper to add a new category at runtime (demo mode)
  _addCategory(name: string) {
    if (!inMemoryCategories.includes(name)) {
      inMemoryCategories.push(name);
    }
  }

  getCategoryStats(): Record<string, number> {
    return inMemoryQuestions.reduce((acc, q) => {
      acc[q.category] = (acc[q.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  // ─── Auth ──────────────────────────────────────────────────

  login(username: string, password: string): { token: string; user: SafeUser } | null {
    const user = inMemoryUsers.find(u => u.username === username || u.email === username);
    if (!user || user.password !== password) return null;
    const { password: _pw, ...safeUser } = user;
    return { token: `token-${user._id}`, user: safeUser as SafeUser };
  }

  signup(data: { fullName: string; username: string; password: string }): { token: string; user: SafeUser } | null {
    if (inMemoryUsers.find(u => u.username === data.username)) return null;
    const user: InMemoryUser = {
      _id: `user-${nextUserId++}`,
      email: `${data.username}@asksam.com`,
      username: data.username,
      password: data.password,
      name: data.fullName,
      role: 'student',
      createdAt: new Date().toISOString(),
      questionsCount: 0,
      answersCount: 0,
      verifiedCount: 0,
      following: [],
      followers: [],
      bookmarks: [],
    };
    inMemoryUsers.push(user);
    const { password: _pw, ...safeUser } = user;
    return { token: `token-${user._id}`, user: safeUser as SafeUser };
  }

  getMe(userId: string): SafeUser | null {
    const user = inMemoryUsers.find(u => u._id === userId);
    if (!user) return null;
    const { password: _pw, ...safeUser } = user;
    return safeUser as SafeUser;
  }

  getUsers(): SafeUser[] {
    return inMemoryUsers.map(({ password: _pw, ...u }) => u as SafeUser);
  }

  // ─── User Profile / Stats ───────────────────────────────────

  getUserProfile(): SafeUser {
    return {
      _id: 'user-1',
      email: 'mahi@example.com',
      username: 'mahi_patel',
      name: 'Mahi Patel',
      role: 'admin',
      createdAt: '2025-09-01T00:00:00.000Z',
      questionsCount: 5,
      answersCount: 12,
      verifiedCount: 3,
      following: [],
      followers: [],
      bookmarks: [],
    };
  }

  getUserQuestions(_userId: string) {
    return inMemoryQuestions.map(q => ({
      _id: q._id,
      title: q.question,
      category: q.category,
      status: q.status,
      createdAt: q.createdAt,
      answerCount: q.answers.length,
    }));
  }

  getUserActivity(_userId: string) {
    return {
      questions: inMemoryQuestions.map(q => ({ _id: q._id, question: q.question, createdAt: q.createdAt, answerCount: q.answers.length })),
      answers: inMemoryQuestions.flatMap(q => q.answers.map(a => ({ ...a, questionId: q._id, question: q.question }))),
      heatmap: [],
    };
  }

  getUserStats(_userId: string) {
    return { questions: 5, answers: 12, verified: 3 };
  }

  // ─── Notifications ──────────────────────────────────────────

  getNotifications(userId: string, _isAdmin = false): Notification[] {
    return inMemoryNotifications.filter(n => n.userId === userId);
  }

  markNotificationRead(id: string): Notification | null {
    const n = inMemoryNotifications.find(n => n._id === id);
    if (n) n.isRead = true;
    return n ?? null;
  }

  // ─── Admin ─────────────────────────────────────────────────

  getAdminStats() {
    const questions = inMemoryQuestions.length;
    const open = inMemoryQuestions.filter(q => q.status === 'open' || q.status === 'reopened').length;
    const answered = inMemoryQuestions.filter(q => q.status === 'answered').length;
    const users = inMemoryUsers.length;
    return { questions, open, answered, users, totalAnswers: inMemoryQuestions.reduce((s, q) => s + q.answers.length, 0) };
  }

  // ─── Search ─────────────────────────────────────────────────

  getTrendingSearches(): string[] {
    return ['NOC process', 'offer letter status', 'ViBe attendance', 'stipend'];
  }

  getFullTextSearch(q: string): Question[] {
    const lower = q.toLowerCase();
    return inMemoryQuestions.filter(x => x.question.toLowerCase().includes(lower) || x.category.toLowerCase().includes(lower));
  }

  // ─── Bookmarks / Follow ─────────────────────────────────────

  toggleBookmark(_userId: string, questionId: string) {
    const idx = this.userBookmarks.indexOf(questionId);
    if (idx === -1) this.userBookmarks.push(questionId);
    else this.userBookmarks.splice(idx, 1);
    return { bookmarked: idx === -1 };
  }

  getBookmarks(_userId: string): any[] {
    const questions = inMemoryQuestions.filter(q => this.userBookmarks.includes(q._id));
    const faqs = this.getAllFAQs().filter((f: any) => this.userBookmarks.includes(f._id));
    return [...questions, ...faqs];
  }

  toggleFollow(followerId: string, followingId: string) {
    const fIdx = this.userFollowing.indexOf(followingId);
    if (fIdx === -1) { this.userFollowing.push(followingId); this.userFollowers.push(followerId); }
    else { this.userFollowing.splice(fIdx, 1); }
    return { following: this.userFollowing, followers: this.userFollowers };
  }

  getFollowing(_userId: string): SafeUser[] {
    return [];
  }
}