# AskSam — Project Tracking

## Project Overview

**AskSam** is a crowdsourced FAQ and Q&A portal for Samagama students, built with React 19 (frontend) and NestJS 11 (backend).

**Purpose:** Enable students to search existing FAQs, ask new questions, get community answers, and have verified answers highlighted. Incorrect answers can be flagged to reopen questions back into the queue.

---

## Platform Workflow

```text
Login/Signup → Search FAQ → Ask Question → Queue → Community Answers → Verified Answer → FAQ
Incorrect answer → Reopen Question → Queue again
```

---

## Tech Stack

### Frontend
- **Location:** `C:\Users\manos\OneDrive\Desktop\AskSam\frontend\`
- **React 19** + **Vite 8** + **Tailwind CSS v4**
- **TanStack Query v5** for data fetching
- **react-router-dom v7** for routing
- **socket.io-client** for real-time updates
- **react-quill-new** for rich text editing
- **axios** for HTTP
- Dev port: `5173` | Proxy: `/api` → `http://localhost:3000`

### Backend
- **Location:** `C:\Users\manos\OneDrive\Desktop\AskSam\backend\`
- **NestJS 11** + **Mongoose 9** + **@nestjs/config**
- **JWT & Guards** for Authentication and Authorization
- **Socket.IO** for real-time events (WebSockets)
- **AI Integration** via `@xenova/transformers` and `groq-sdk`
- **Port:** `3000`
- Fallback mode reads from `faqData.json` when MongoDB unavailable (though MongoDB is now integrated).

---

## Frontend Routes

| Route | Page | File | Status |
|-------|------|------|--------|
| `/` | FAQ homepage with search, categories, featured content | `HomePage.jsx` | ✅ Complete |
| `/login` | Authentication page | `LoginPage.jsx` | ✅ Complete |
| `/faqs` | Browse all FAQs | `FaqsPage.jsx` | ✅ Complete |
| `/faq/:id` | Individual FAQ detail view | `FaqPage.jsx` | ✅ Complete |
| `/ask` | Submit a new question | `AskPage.jsx` | ✅ Complete |
| `/queue` | Open/reopened questions (oldest first) | `QueuePage.jsx` | ✅ Complete |
| `/question/:id` | Question detail + answers + reply form | `QuestionPage.jsx` | ✅ Complete |
| `/my-questions` | User's asked questions | `MyQuestionsPage.jsx` | ✅ Complete |
| `/profile` | User profile and settings | `ProfilePage.jsx` | ✅ Complete |
| `/admin` | Admin dashboard for moderation | `AdminPage.jsx` | ✅ Complete |

---

## Frontend File Structure

```text
frontend/src/
├── main.jsx                    — QueryClientProvider + BrowserRouter
├── App.jsx                    — Lazy-loaded routes, Suspense, 404 fallback, Protected Routes
├── index.css                  — Design system (Tailwind v4 @theme)
├── components/
│   └── Navbar.jsx            — Sticky nav, mobile menu, keyboard nav
├── layouts/
│   └── MainLayout.jsx         — Shared layout wrapper
├── pages/
│   ├── HomePage.jsx          — Hero, carousel, topics, highlights, stories
│   ├── LoginPage.jsx         — Authentication
│   ├── QueuePage.jsx          — Moderation queue with grouping, stats, sidebar
│   ├── AskPage.jsx            — Advanced question submission workflow
│   ├── QuestionPage.jsx        — Discussion with trust indicators, sorting
│   ├── FaqPage.jsx            — FAQ detail view
│   ├── FaqsPage.jsx           — Browse all FAQs
│   ├── MyQuestionsPage.jsx    — User's questions dashboard
│   ├── ProfilePage.jsx        — User profile
│   └── AdminPage.jsx          — Moderation dashboard with split-panel layout
└── services/
    └── api.js                 — axios instance, API endpoints, interceptors
```

---

## Architecture Decisions

1. **Authentication & Authorization** — Implemented with JWT, global guards (`JwtAuthGuard`, `RolesGuard`), and roles (`admin`, `user`).
2. **Real-time Updates** — Integrated Socket.IO for real-time notifications and queue updates.
3. **Mongoose Schemas & DTOs** — Fully defined schemas (`user`, `question`, `answer`, `faq`, `notification`, `search-analytics`) replacing the previous schema-less design.
4. **try/catch fallback pattern** — MongoDB wrapped in try/catch, falls back to LocalDataService if offline.
5. **AI Module** — Included for smart search and similar question detection.
6. **Status auto-update** — verified answer triggers `answered` status.
7. **TanStack Query** for all server state.
8. **react-router-dom** used for routing.
9. **CSS-only animations** — keyframes defined in index.css, component styles use inline style objects.
10. **Skeleton classes use raw CSS** — no `@apply` chains due to Tailwind v4 processing constraints.
11. **Lazy loading** — pages loaded via `React.lazy()` + `Suspense` for code splitting.
12. **safeRequest wrapper** — all API calls wrapped to prevent unhandled rejections.

---

## Frontend Maturity Assessment

| Area | Completeness | Notes |
|------|-------------|-------|
| Pages | **100%** | All major pages built including Auth, Profile, My Questions |
| Design System | **100%** | Complete token set, raw CSS skeletons, gradients fixed |
| Navigation | **100%** | Mobile menu, scroll effects, keyboard nav, protected routes |
| Form UX | **100%** | Floating labels, review summary, checklist |
| Discussion UX | **100%** | Sorting controls, verified banner, related sidebar |
| API Service Layer | **100%** | All methods defined with safeRequest wrapper, auth headers |
| Routing | **100%** | Suspense, 404 fallback, code splitting, guards |
| Runtime Stability | **100%** | All known runtime errors fixed |
| Backend Integration| **100%** | API layer fully wired to pages |

**Overall frontend: 100% complete**

---

## API Service Layer (services/api.js)
The API service is fully fleshed out with endpoints for:
- `faqApi`
- `questionApi`
- `answerApi`
- `bookmarkApi`
- `followApi`
- `userStatsApi`
- `searchApi`
- `faqAdminApi`
- `categoryApi`
- `userApi`
- `adminApi`
- `authApi`
- `notificationApi`

---

## Backend Integration & MongoDB

### Status: ✅ Fully Integrated
- MongoDB Atlas/Local connection implemented via `MONGODB_URI`.
- Mongoose schemas for all major entities.
- JWT-based authentication in place.
- CORS enabled.
- Socket.IO gateway running.
- Throttler implemented for rate limiting.

---

## Known Issues

| Issue | Severity | Notes |
|------|---------|-------|
| Missing `.env` validation | Low | No runtime check for VITE_API_URL presence |
| Inline `<style>` tags in pages | Low | Keyframe animations in component files could be moved |

---

## Build & Test Status

| Scope | Command / Suite | Status | Notes |
|---------|---------|--------|-------|
| Frontend Build | `npm run build` | ✅ Success | Optimized production bundle generated cleanly |
| Backend Build | `npm run build` | ✅ Success | TypeScript compiler completes with 0 strict errors |
| E2E QA Audit | `node qa_audit.mjs` | ✅ Passed (10/10) | Headless MS Edge checks pass with 0 console errors |

---

## How to Run

```bash
# Terminal 1 — Backend
cd backend
npm run start:dev

# Terminal 2 — Frontend
cd frontend
npm run dev

# Terminal 3 — E2E Smoke & Crawl Test
cd scratch_puppeteer
node qa_audit.mjs
```

Open `http://localhost:5173`