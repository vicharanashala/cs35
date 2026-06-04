# AskSam — Samagama Collaborative FAQ Platform

<div align="center">

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

> **A crowdsourced FAQ & Q&A portal for Samagama students** — built at the [Vicharanashala Lab for Education Design, IIT Ropar](https://vicharanashala.ai).
>
> Students ask questions → Community answers → Best answer is verified → Promoted to a canonical FAQ. Repeated questions get closed automatically.

</div>

---

## Table of Contents

- [Quick Stats](#quick-stats)
- [Platform Workflow](#platform-workflow)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Pages \& Routes](#pages--routes)
- [Environment Setup](#environment-setup)
- [Getting Started](#getting-started)
- [Build \& Test Status](#build--test-status)
- [Design System](#design-system)
- [FAQ](#faq)
- [Contributors](#contributors)
- [License](#license)

---

## Quick Stats

| Questions Answered | Canonical FAQs | Contributors | Commits |
|:---:|:---:|:---:|:---:|
| **500+** | **150+** | **10** | **146** |

---

## Platform Workflow

```
  ┌──────────┐     ┌────────────┐     ┌─────────┐     ┌──────────────┐
  │  Login / │ ──▶ │  Search    │ ──▶ │  Ask    │ ──▶ │    Queue     │
  │  Signup  │     │  Existing  │     │  New Q  │     │  (Open / Reopen)
  └──────────┘     └────────────┘     └─────────┘     └──────┬───────┘
                                                             │
                            ┌────────────────────────────────┘
                            ▼
                     ┌──────────────┐     ┌─────────────────────┐
                     │  Community   │ ──▶ │  Best Answer        │
                     │  Answers     │     │  Marked & Verified  │
                     └──────────────┘     └──────────┬──────────┘
                                                     │
                              ┌──────────────────────┴──────────────┐
                              ▼                                     ▼
                       ┌─────────────┐                      ┌──────────────┐
                       │  Promoted   │                      │  Flagged as  │
                       │  to FAQ     │                      │  Incorrect   │
                       │  ✅ FAQ     │                      │  🔄 Reopen   │
                       └─────────────┘                      └──────┬───────┘
                                                                    │
                                                               ┌────▼────┐
                                                               │ Back to │
                                                               │  Queue  │
                                                               └─────────┘
```

---

## Key Features

### Browse & Search

| Feature | Description |
|---|---|
| Full-text FAQ Search | Search across all canonical FAQs with category filters |
| Category Browsing | Browse FAQs and questions organized by topic |
| Tag-based Filtering | Filter content by tags on both questions and FAQs |
| Bookmarks | Logged-in users can bookmark any question for quick access |
| Trending Searches | See what questions are trending in the community |

### Ask & Answer

| Feature | Description |
|---|---|
| Question Submission | Submit questions with title, rich-text body, category, and optional screenshot |
| Community Answers | Multiple answers per question; all answer authors are tracked |
| Answer Verification | Mark the best answer as verified — auto-converts it into a canonical FAQ |
| Accept Answer | Question author can accept a specific answer as the best one |
| Upvote/Downvote | Community voting on both questions and individual answers |
| Reopen Logic | Flag a verified answer as incorrect → question re-enters the open queue |
| Moderation Queue | Open & reopened questions listed oldest-first for the community to pick up |

### Real-time & Social

| Feature | Description |
|---|---|
| Live Notifications | Socket.IO pushes for new answers, status changes, and admin actions |
| User Profiles | Track your asked questions, submitted answers, and overall activity |
| Follow System | Follow other users to see their activity |
| Activity Heatmap | Visualize your contribution activity over time |
| Role-based Access | JWT auth with `student` and `admin` roles; guards on all protected endpoints |
| Admin Dashboard | Tag, categorize, merge, close, pin, and manage all questions and FAQs |

### AI & Analytics

| Feature | Description |
|---|---|
| AI Moderation | Groq LLM integration for smart question pre-moderation |
| Full-text Search | Search across questions and FAQs |
| Search Analytics | Every search query recorded — trending queries and failed searches tracked |
| FAQ Feedback | Users can mark FAQs as helpful/unhelpful with reasons |

---

## Tech Stack

### Frontend

| | |
|---|---|
| **React 19** | UI framework with concurrent rendering |
| **Vite 8** | Build tool & HMR dev server |
| **Tailwind CSS v4** | Utility-first styling with `@theme` CSS variables |
| **TanStack Query v5** | Server-state, caching, background refetching |
| **React Router v7** | Client-side routing with lazy loading via `React.lazy()` + `Suspense` |
| **Socket.IO Client** | Real-time WebSocket event handling |
| **React Quill New** | Rich text editor for questions & answers |
| **Axios** | HTTP client with request/response interceptors and `safeRequest` wrapper |

### Backend

| | |
|---|---|
| **NestJS 11** | Progressive Node.js backend framework |
| **TypeScript** | Type-safe development, strict mode |
| **Mongoose 9** | MongoDB ODM & schema management |
| **MongoDB** | Primary document store (Atlas or local) |
| **JWT** | Stateless authentication |
| **Socket.IO** | WebSocket gateway for real-time events |
| **@nestjs/throttler** | API rate limiting (10 req/min on auth endpoints) |
| **bcrypt** | Password hashing |

### Infrastructure

| Detail | Value |
|---|---|
| Frontend dev port | `5173` (proxies `/api` → `http://localhost:3000`) |
| Backend API port | `3000` |
| API base path | `/api` |
| Database | MongoDB Atlas or local via `MONGODB_URI` |
| Offline fallback | `faqData.json` served read-only when DB is unreachable |
| AI (optional) | Groq LLM via `GROQ_API_KEY` — safe defaults if omitted |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Client (Browser)                              │
│                    React SPA — Port 5173 (dev)                          │
│  TanStack Query │ React Router v7 │ Socket.IO Client │ React Quill     │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │  HTTP + WebSocket
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    NestJS API — Port 3000                               │
│  JWT Guard │ Roles Guard │ Throttler │ Socket.IO Gateways               │
└──────────────┬──────────────────────────────────────────┬───────────────┘
               │                                          │
               ▼                                          ▼
┌─────────────────────────┐                  ┌─────────────────────────────┐
│        MongoDB          │                  │       faqData.json          │
│  (Primary document DB)  │                  │   (Read-only JSON fallback) │
└─────────────────────────┘                  └─────────────────────────────┘
```

---

## API Reference

All endpoints are prefixed with `/api`. Authentication via `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/auth/me` | Public* | Get current user from token |
| `POST` | `/auth/signup` | Public | Register with `fullName`, `username`, `password` |
| `POST` | `/auth/login` | Public | Login — `username`, `password`, `role: student\|admin` (rate-limited) |
| `POST` | `/auth/forgot-password` | Public | Reset password (rate-limited) |

### FAQs

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/faqs` | Public | List FAQs — `?category=`, `?search=`, `?page=`, `?limit=` |
| `GET` | `/faqs/:id` | Public | Get single FAQ |
| `POST` | `/faqs` | Admin | Create FAQ manually |
| `PATCH` | `/faqs/:id` | Admin | Update FAQ |
| `DELETE` | `/faqs/:id` | Admin | Delete FAQ |
| `PATCH` | `/faqs/:id/upvote` | User | Upvote an FAQ |
| `PATCH` | `/faqs/:id/view` | Public | Increment view counter |
| `PATCH` | `/faqs/:id/feedback` | Public | Submit helpful/unhelpful feedback |
| `PATCH` | `/faqs/:id/pin` | Admin | Pin/unpin FAQ |
| `GET` | `/faqs/similar` | User | Get similar FAQs by query |

### Questions

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/questions` | Public | List — `?search=`, `?category=`, `?status=`, `?contributorId=` |
| `GET` | `/questions/open` | Public | All open & reopened questions (queue view) |
| `GET` | `/questions/:id` | Public | Get question with all answers populated |
| `POST` | `/questions` | User | Submit question |
| `PATCH` | `/questions/:id` | User | Edit own question |
| `DELETE` | `/questions/:id` | User/Admin | Delete question |
| `PATCH` | `/questions/:id/close` | User/Admin | Close question |
| `PATCH` | `/questions/:id/reopen` | User | Flag answer incorrect → reopen with `reason?` |
| `PATCH` | `/questions/:id/answer` | User | Submit answer |
| `PATCH` | `/questions/:id/vote` | User | Vote on question or answer |
| `POST` | `/questions/:id/convert-to-faq` | Admin | Promote verified answer to canonical FAQ |

### Answers

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `PATCH` | `/answers/:id` | User | Edit own answer |
| `DELETE` | `/answers/:id` | User/Admin | Delete answer |
| `PATCH` | `/answers/:id/verify` | Admin | Mark answer as verified/not verified |
| `PATCH` | `/answers/:id/accept` | User | Accept/unaccept answer as question author |

### Categories

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/categories` | Public | List all categories |
| `GET` | `/categories/stats` | Public | Category stats with FAQ & question counts |
| `POST` | `/categories` | Admin | Create category |
| `PATCH` | `/categories/confirm` | Admin | Confirm a pending category |
| `PATCH` | `/categories/rename` | Admin | Rename a category |

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/users` | Admin | List all users |
| `GET` | `/users/:userId` | User | Get user profile |
| `PATCH` | `/users/:userId` | User | Update profile |
| `DELETE` | `/users/:userId` | Admin | Delete user |
| `PATCH` | `/users/:userId/bookmark/:questionId` | User | Toggle bookmark |
| `GET` | `/users/:userId/bookmarks` | User | Get bookmarked questions |
| `GET` | `/users/:userId/answers` | User | Get user's submitted answers |
| `GET` | `/users/:userId/stats` | User | Get user stats |
| `GET` | `/users/:userId/activity` | User | Get activity heatmap data |
| `PATCH` | `/users/:followerId/follow/:followingId` | User | Follow/unfollow user |
| `GET` | `/users/:userId/following` | User | Get following list |

### Search

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/search/full` | Public | Full-text search across questions and FAQs |
| `GET` | `/search/trending` | Public | Top 10 trending search queries |

### Notifications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/notifications/:userId` | User | Get notifications |
| `PATCH` | `/notifications/:id/read` | User | Mark notification as read |

### Admin

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/admin/stats` | Admin | Platform-wide stats |
| `GET` | `/admin/search/failed` | Admin | List failed search queries |
| `GET` | `/admin/feedback/unhelpful` | Admin | List unhelpful FAQ feedbacks |

---

## Pages & Routes

| Route | Page | Access |
|---|---|---|
| `/` | Home — hero, categories, featured FAQs | Student |
| `/login` | Login / Signup | Public |
| `/faqs` | Browse all canonical FAQs | Student |
| `/faq/:id` | FAQ detail view | Student |
| `/question/:id` | Question + answers + reply form | Student |
| `/ask` | Submit a new question | Student |
| `/queue` | Moderation queue (oldest first) | Student |
| `/my-questions` | User's submitted questions | Student |
| `/profile` | Profile, stats, bookmarks, following | Student |
| `/notifications` | Real-time notification feed | Student |
| `/admin` | Admin dashboard — moderation, stats, feedback | Admin |

---

## Environment Setup

### Backend — `backend/.env`

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/samagama
JWT_SECRET=your_super_secret_jwt_key_here
GROQ_API_KEY=your_groq_api_key_here   # Optional
```

### Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:3000/api
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)
- **npm** ≥ 9

### Run with npm

```bash
# 1 — Clone the repository
git clone https://github.com/vicharanashala/cs35.git
cd cs35

# 2 — Backend (Terminal 1)
cd backend
npm install
npm run start:dev

# 3 — Frontend (Terminal 2)
cd ../frontend
npm install
npm run dev

# 4 — Open your browser
open http://localhost:5173
```

### Production Build

```bash
# Backend
cd backend && npm run build && npm run start:prod

# Frontend
cd frontend && npm run build
# Serve frontend/dist/ with any static file server
```

### Database Scripts

```bash
cd backend/scripts

node seed_faqs.mjs           # Seed DB from faqData.json
node clear_db.mjs            # Drop all collections (⚠️ destructive)
node echo_env.mjs            # Print environment configuration
node recreate_email_index.mjs # Recreate MongoDB email index
```

---

## Build & Test Status

| Scope | Command / Suite | Status |
|---|---|---|
| Frontend build | `npm run build` | ✅ Passing |
| Backend build | `npm run build` | ✅ Passing |
| E2E QA (Puppeteer) | `node qa_audit.mjs` — 10/10 checks | ✅ Passing |

---

## Design System

AskSam uses a **Sage Green Academic Palette** built on Tailwind CSS v4 CSS variables via `@theme`.

```css
/* Brand — sage green */
--color-brand-50:  #f0f4ef;
--color-brand-100: #dde8db;
--color-brand-500: #5E7A5A;  /* primary */
--color-brand-900: #1f2b1e;

/* Warm accent — cream/sand */
--color-warm-50:   #fdf9f3;
--color-warm-500:  #c9b082;
--color-warm-600:  #b09363;

/* Background */
--color-sage-bg:    #F5F7F2;
--color-sage-card:  #FFFFFF;
--color-sage-border:#E2E8DE;

/* Status colors */
status-green-*, status-amber-*, status-red-*, status-orange-*
```

Animations (`fadeIn`, `slideUp`, `float`, `pulseGlow`) are defined as raw CSS keyframes in `index.css`. Component animations use inline `style` objects. No `@apply` chains are used — a Tailwind v4 constraint.

---

## FAQ

**Q: What happens if MongoDB is offline?**
> The backend falls back to `faqData.json` automatically and serves FAQ data read-only.

**Q: Is the AI moderation required?**
> No. `GROQ_API_KEY` is optional. Without it, AI features use safe default behaviors and never throw.

**Q: How does the reopen flow work?**
> Any user flags a verified answer as incorrect. This sets `status: 'reopened'`, `isReopened: true`, and records a `reopenReason`. The question immediately re-enters the queue.

**Q: How does the convert-to-FAQ flow work?**
> An admin calls `POST /questions/:id/convert-to-faq`. This creates a canonical FAQ linked to the original question.

**Q: Can I self-host this?**
> Yes. The backend just needs Node.js + MongoDB. The frontend is a static SPA — deploy `frontend/dist/` to any static host.

---

## Contributors

Built with ❤️ by **10 students** of the Vicharanashala internship program, IIT Ropar.

| | | |
|:---:|:---:|:---:|
| Mano Shruthi S | Frontend & Backend | [@manoshyth](https://github.com/manoshyth) |
| Pavan Kumar M | Frontend & Backend | [@pavankumar](https://github.com/pavankumar) |
| Dusi Keerthi Prasanna | Frontend & Backend | [@keerthi](https://github.com/keerthi) |
| Rashmi Risha J | Frontend & Backend | [@rashmirisha](https://github.com/rashmirisha) |
| Thivesha M. S | Frontend & Backend | [@thivesha](https://github.com/thivesha) |
| Dishi Gupta | Frontend & Backend | [@dishigpt](https://github.com/dishigpt) |
| Ambati Vedanandana | Frontend & Backend | [@vedanandana](https://github.com/vedanandana) |
| Divyadharshini S | Frontend & Backend | [@divyadharshini](https://github.com/divyadharshini) |
| Putta Sri Tejaswi | Frontend & Backend | [@tejaswi](https://github.com/tejaswi) |
| Akshaya Boggarapu | Frontend & Backend | [@akshaya](https://github.com/akshaya) |

> Special mention: **[GitHub Copilot](https://github.com/features/copilot)** — assisted with code review and documentation throughout development.

---
# Additional Enhancements

## Screenshots

### Home Page
![Home Page](docs/screenshots/home.png)

### FAQ Browser
![FAQ Browser](docs/screenshots/faqs.png)

### Question Detail Page
![Question Detail](docs/screenshots/question.png)

### Admin Dashboard
![Admin Dashboard](docs/screenshots/admin.png)

---

## Why AskSam?

- Reduces duplicate questions through intelligent FAQ promotion.
- Community-driven knowledge sharing platform.
- Real-time notifications using WebSockets.
- AI-assisted moderation for higher content quality.
- Academic-focused design for educational communities.
- Scalable NestJS + React architecture.

---

## Security Features

- JWT-based Authentication
- Password Hashing with bcrypt
- Rate Limiting on Authentication Endpoints
- Role-Based Access Control (RBAC)
- Protected API Routes
- Input Validation using DTOs
- Secure Environment Variable Management

---

## Performance Optimizations

- Lazy-loaded routes with React Router
- Query caching using TanStack Query
- Optimized MongoDB indexing
- WebSocket event batching
- API response compression
- Debounced search requests

---

## Project Structure

```text
cs35/
├── frontend/
│   ├── src/
│   ├── public/
│   └── components/
│
├── backend/
│   ├── src/
│   ├── scripts/
│   └── modules/
│
├── faqData.json
├── README.md
└── context.md
```

---

## User Roles

### Student

- Ask Questions
- Submit Answers
- Vote Content
- Bookmark Questions
- Follow Contributors

### Admin

- Verify Answers
- Promote FAQs
- Manage Categories
- View Analytics
- Moderate Content

---

## Deployment

### Frontend

Supported Platforms:

- Vercel
- Netlify
- GitHub Pages

### Backend

Supported Platforms:

- Railway
- Render
- AWS EC2
- DigitalOcean
- Docker Containers

### Database

- MongoDB Atlas

---

## Docker

### Build and Run

```bash
docker-compose up --build
```

### Stop Containers

```bash
docker-compose down
```

---

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push the branch.
5. Open a Pull Request.

Please follow the project's coding standards and naming conventions.

---

## Roadmap

### Version 2.0

- [ ] AI-powered duplicate question detection
- [ ] Semantic search using embeddings
- [ ] Multi-language support
- [ ] Mobile application
- [ ] Reputation and badge system
- [ ] Leaderboards
- [ ] Email notifications
- [ ] Dark mode
- [ ] Community moderation voting
- [ ] Advanced analytics dashboard

## License

Licensed under the **MIT License**. You are free to use, modify, and distribute this project with attribution.

[![Vicharanashala Lab](https://img.shields.io/badge/Built%20at-Vicharanashala%20Lab%20IIT%20Ropar-blue?style=for-the-badge)](https://vicharanashala.ai)

---

<div align="center">

**If this project helped you, consider giving it a ⭐ — it means a lot to the team!**

</div>
