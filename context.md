# AskSam — Project Tracking

## Project Overview

**AskSam** is a crowdsourced FAQ and Q&A portal for Samagama students, built with React 19 (frontend) and NestJS 11 (backend).

**Purpose:** Enable students to search existing FAQs, ask new questions, get community answers, and have verified answers highlighted. Incorrect answers can be flagged to reopen questions back into the queue.

---

## Platform Workflow

```
Search FAQ → Ask Question → Queue → Community Answers → Verified Answer → FAQ
Incorrect answer → Reopen Question → Queue again
```

---

## Tech Stack

### Frontend
- **Location:** `C:\Users\manos\OneDrive\Desktop\AskSam\frontend\`
- **React 19** + **Vite 8** + **Tailwind CSS v4**
- **TanStack Query v5** for data fetching
- **react-router-dom v7** for routing
- **axios** for HTTP
- Dev port: `5173` | Proxy: `/api` → `http://localhost:3000`

### Backend
- **Location:** `C:\Users\manos\OneDrive\Desktop\AskSam\backend\`
- **NestJS 11** + **Mongoose 9** + **@nestjs/config**
- **Port:** `3000`
- Fallback mode reads from `faqData.json` when MongoDB unavailable

### Data File
- `faqData.json` — read-only source of truth, flat `{ category, question, answer }` array

---

## Frontend Routes

| Route | Page | File | Status |
|-------|------|------|--------|
| `/` | FAQ homepage with search, categories, featured content | `HomePage.jsx` | ✅ Complete |
| `/faq/:id` | Individual FAQ detail view | `FaqPage.jsx` | ✅ Complete |
| `/ask` | Submit a new question | `AskPage.jsx` | ✅ Advanced UX |
| `/queue` | Open/reopened questions (oldest first) | `QueuePage.jsx` | ✅ Complete |
| `/question/:id` | Question detail + answers + reply form | `QuestionPage.jsx` | ✅ Professional Polish |
| `/admin` | Admin dashboard for moderation | `AdminPage.jsx` | ✅ Complete |

---

## Frontend File Structure

```
frontend/src/
├── main.jsx                    — QueryClientProvider + BrowserRouter
├── App.jsx                    — Lazy-loaded routes, Suspense, 404 fallback
├── index.css                  — Design system (Tailwind v4 @theme)
├── components/
│   └── Navbar.jsx            — Sticky nav, mobile menu, keyboard nav
├── layouts/
│   └── MainLayout.jsx         — Shared layout wrapper
├── pages/
│   ├── HomePage.jsx          — Hero, carousel, topics, highlights, stories
│   ├── QueuePage.jsx          — Moderation queue with grouping, stats, sidebar
│   ├── AskPage.jsx            — Advanced question submission workflow
│   ├── QuestionPage.jsx        — Discussion with trust indicators, sorting
│   ├── FaqPage.jsx            — FAQ detail view
│   └── AdminPage.jsx          — Moderation dashboard with split-panel layout
└── services/
    └── api.js                 — axios instance, faqApi, questionApi with safeRequest
```

---

## Completed Frontend Features

### Pages

#### HomePage — Complete
- Hero section with search, category pills, quick action buttons
- Featured question spotlight with gradient styling
- FAQ carousel with auto-rotation and hover pause (3-card effect)
- Category analytics strip with resolution progress bars
- Trust indicators grid (10,000+ Questions, 2,500+ Students, 98% Resolution, <24h Response)
- "Why Students Use AskSam" feature cards (4 cards)
- Student Success Stories — 3 testimonial cards with quotes, badges
- Top contributors leaderboard with reputation badges
- Trending questions grid with search filtering
- Recently answered section with verified badges
- Quick FAQ lookup sidebar with search
- Topic blocks (NOC, Offer Letters, ViBe, Samagama, Stipend)
- Platform Highlights section — 4 feature showcase cards
- Scroll-triggered IntersectionObserver animations
- Related questions sidebar on FAQ detail pages

#### QueuePage — Complete
- Expandable question cards with full detail view
- Queue grouping: Reopened and Open Questions sections
- Status timeline indicators with timestamps
- Reopened question highlighting with reason display
- Contributor activity metadata (avatar, name, views, answers)
- Recently answered collapsible section
- Quick actions sidebar (Ask New Question, Browse FAQs)
- Stats cards: Open, Reopened, Answered Today
- Category filtering and search
- Loading skeletons and empty states
- Productivity improvements: sticky header, quick filters, keyboard hints
- Sort controls: oldest first, newest first

#### AskPage — Advanced UX
- 4-step progress indicator (Start → Write → Review → Done)
- Floating label inputs with animated focus states
- Auto-resizing textarea that grows with content
- Inline validation states with real-time error feedback
- Smart helper sidebar with submission progress tracking
- Animated context-aware helper messages
- Duplicate question detection with related FAQ suggestions
- ReviewSummaryCard — pre-submission review
- Estimated response time by category
- Pre-submit checklist with completion states
- Tooltip cards for question quality guidance
- Question quality tips section
- Polished success modal with coordinated animations
- Submitting loading state with spinner
- Screenshot uploader with keyboard accessibility
- Enhanced tags input (Enter/comma to add, Backspace to remove)
- Category selection with visual badge feedback
- Form grouping with card hierarchy
- Responsive multi-column desktop layout (lg:grid-cols-3)

#### QuestionPage — Professional Polish
- Contributor profiles with avatar and reputation badges
- Verified contributor styling (Expert, Top Contributor, Admin)
- Answer sorting controls (Verified / Newest / Most Helpful)
- Collapsible metadata sections
- Answer trust indicators (highly helpful badges, "X found helpful")
- Voting UI with upvote/downvote states
- Discussion separators with gradient dividers
- Answer content formatting (paragraphs, numbered lists)
- Collapsible long answers
- Related Discussion sidebar (desktop only, sticky)
- Screenshot preview with lightbox expansion
- Sticky discussion tools panel (desktop only)
- Timeline indicators (verified vs community counts)
- SubmitAnswerForm with validation
- SuccessToast notification on answer post

#### FaqPage — Complete
- FAQ detail view with full answer
- Category and status badges
- Related questions suggestions
- Screenshot preview support

### Components

#### Navbar
- Active route highlighting with animated underline
- Responsive mobile hamburger menu with slide-down overlay
- Scroll shadow effect
- Keyboard accessible (Escape closes menu)
- Sign In button styling

#### HomePage Sections
- FAQ carousel with dot navigation
- Category analytics strip
- Trust indicators grid
- "Why Use AskSam" feature cards
- Platform highlights (4 cards)
- Contributor leaderboard
- Topic blocks (NOC, Offer Letters, ViBe, Samagama, Stipend)
- StoryCard — student testimonials with glass-card styling

### Design System (index.css)

#### Containers & Layouts
- [x] `.section-container` — max-w-5xl, centered
- [x] `.section-container-narrow` — max-w-3xl, centered
- [x] `.section-container-wide` — max-w-6xl, centered
- [x] `.section-padding` — py-10 sm:py-12 lg:py-16
- [x] `.section-padding-sm` — py-6 sm:py-8

#### Gradients
- [x] `.gradient-hero` — sand to white gradient
- [x] `.gradient-card-hover` — white to sand
- [x] `.gradient-blue-subtle` — blue-50 to slate-blue-50
- [x] `.gradient-green-subtle` — green/emerald subtle

#### Cards
- [x] `.glass-card` — backdrop-blur, semi-transparent
- [x] `.glass-card-hover` — interactive glass effect
- [x] `.card` — elevated with hover effects
- [x] `.card-flat` — simple border card
- [x] `.card-elevated` — shadowed card
- [x] `.card-interactive` — cursor pointer, hover lift
- [x] `.story-card` — testimonial glass-card variant

#### Status Badges
- [x] `.badge` — base badge style
- [x] `.badge-open` — yellow
- [x] `.badge-answered` — green
- [x] `.badge-reopened` — orange
- [x] `.badge-verified` — green gradient
- [x] `.badge-solved` — green

#### Category Pills
- [x] `.category-pill` — base pill
- [x] `.category-pill-noc` — violet
- [x] `.category-pill-offer` — blue
- [x] `.category-pill-vibe` — cyan
- [x] `.category-pill-samagama` — emerald
- [x] `.category-pill-stipend` — amber
- [x] `.category-pill-general` — slate

#### Buttons
- [x] `.btn-primary` — blue CTA
- [x] `.btn-secondary` — outlined
- [x] `.btn-ghost` — text-only
- [x] `.btn-danger` — red destructive

#### Animations
- [x] `@keyframes skeleton` — shimmer loading
- [x] `@keyframes fade-in` — opacity transition
- [x] `@keyframes slide-up` — translateY transition
- [x] `@keyframes slide-down` — slide down
- [x] `@keyframes scale-in` — scale transition
- [x] `.animate-fade-in`, `.animate-slide-up`, `.animate-slide-down`, `.animate-scale-in`

#### Loading Skeletons
- [x] `.skeleton` — shimmer base (raw CSS, no @apply chain)
- [x] `.skeleton-text`, `.skeleton-text-sm`, `.skeleton-title`
- [x] `.skeleton-avatar`, `.skeleton-card`

#### Trust/Community Badges
- [x] `.trust-badge` — base badge
- [x] `.trust-badge-expert` — purple
- [x] `.trust-badge-contributor` — blue
- [x] `.trust-badge-admin` — red

#### Utilities
- [x] Custom scrollbar styling (webkit + Firefox)
- [x] `.backdrop-overlay` — fixed overlay
- [x] `.modal-backdrop` — modal backdrop
- [x] `.focus-ring` — focus outline
- [x] `.hide-on-mobile` / `.hide-on-desktop`
- [x] `.line-clamp-1/2/3` — text truncation
- [x] `prefers-reduced-motion` support

---

## Architecture Decisions

1. **faqData.json is read-only** — never modified by the app
2. **No authentication** — anyone can ask or answer
3. **No DTOs** — raw body objects passed through services
4. **try/catch fallback pattern** — MongoDB wrapped in try/catch, falls back to LocalDataService
5. **Flat faqData.json format** — mapped to full FAQ shape with `_id: local-faq-${i}`
6. **Status auto-update** — verified answer triggers `answered` status
7. **TanStack Query** for all server state
8. **react-router-dom** (NOT @tanstack/react-router)
9. **CSS-only animations** — keyframes defined in index.css, component styles use inline style objects
10. **Skeleton classes use raw CSS** — no `@apply` chains due to Tailwind v4 processing constraints
11. **Lazy loading** — pages loaded via `React.lazy()` + `Suspense` for code splitting
12. **safeRequest wrapper** — all API calls wrapped to prevent unhandled rejections

---

## Runtime Stability Cleanup — Completed

### Fixes Applied
- **HomePage** — fixed `idx is not defined` error in FAQCarousel (used `activeIndex` state instead of undefined map index variable)
- **HomePage** — added optional chaining `CATEGORY_DATA?.[cat]?.count ?? 0` for safe category stats
- **HomePage** — added safe fallback `CATEGORY_DATA?.[cat] ?? {}` for CategoryCard
- **QuestionPage** — added optional chaining `question.category?.charAt(0)` in RelatedDiscussionCard
- **HomePage** — fixed scrollbar Firefox `theme()` function with hardcoded rgba values
- **index.css** — fixed invalid `theme()` function calls in gradient classes
- **api.js** — added `safeRequest` wrapper, error interceptor, timeout, consistent headers
- **App.jsx** — added lazy loading, Suspense boundary, 404 fallback route
- **MainLayout.jsx** — verified safe children rendering, flex layout correct
- **Navbar.jsx** — verified clean (no issues found)
- **QueuePage.jsx** — verified clean (no issues found)
- **AskPage.jsx** — verified clean (no issues found)

### Build Status
- All 130 modules transform successfully
- Code splitting: HomePage, QueuePage, AskPage, QuestionPage, FaqPage as separate chunks
- No @apply chain errors
- No undefined variable errors
- CSS gradient functions use raw hex/rgba values (no invalid theme() references)

---

## Frontend Maturity Assessment

| Area | Completeness | Notes |
|------|-------------|-------|
| Pages (HomePage, QueuePage, AskPage, QuestionPage, FaqPage) | **95%** | All major pages built with polished UX |
| Design System (index.css utilities, animations, components) | **95%** | Complete token set, raw CSS skeletons, gradients fixed |
| Navigation (Navbar, routing, responsive behavior) | **95%** | Mobile menu, scroll effects, keyboard nav |
| Form UX (AskPage advanced interactions, validation, accessibility) | **95%** | Floating labels, review summary, checklist |
| Discussion UX (QuestionPage sorting, trust, sidebar) | **95%** | Sorting controls, verified banner, related sidebar |
| API Service Layer (services/api.js) | **85%** | All methods defined with safeRequest wrapper |
| Routing (App.jsx with lazy loading) | **95%** | Suspense, 404 fallback, code splitting |
| Runtime Stability | **95%** | All known runtime errors fixed |
| Backend Integration | **0%** | API layer defined but not wired to pages |
| AdminPage | **0%** | Stub exists, not routed |

**Overall frontend (mock data): ~90% complete**

---

## API Service Layer (services/api.js)

```js
// axios client with timeout, headers, error interceptor
const client = axios.create({ baseURL, timeout: 10000, headers });

// safeRequest wrapper catches errors, logs, returns rejected promise

faqApi: {
  list(params)           // GET /faqs
  getById(id)           // GET /faqs/:id
  listCategories()      // GET /categories
}

questionApi: {
  listOpen()             // GET /questions/open
  getById(id)            // GET /questions/:id
  create(data)           // POST /questions
  addAnswer(id, data)    // PATCH /questions/:id/answer
  reopen(id)             // PATCH /questions/:id/reopen
  vote(questionId, answerId, direction)  // PATCH /questions/:id/vote
}
```

---

## Backend Integration Checklist

### Prerequisites (Critical)
- [ ] Fix conditional MongooseModule (start without MongoDB)
- [ ] Add CORS to backend (`app.enableCors()` in main.ts)
- [ ] Verify `faqData.json` fallback mode works correctly

### Wiring — Frontend to Backend
- [ ] Replace mock data in HomePage with `faqApi.list()` + `faqApi.listCategories()`
- [ ] Replace mock data in QueuePage with `questionApi.listOpen()`
- [ ] Replace mock data in QuestionPage with `questionApi.getById()`
- [ ] Wire AskPage form submit to `questionApi.create()`
- [ ] Wire answer form to `questionApi.addAnswer()`
- [ ] Wire voting buttons to `questionApi.vote()`
- [ ] Wire reopen button to `questionApi.reopen()`
- [ ] Add TanStack Query `useMutation` for write operations
- [ ] Add loading and error states per page
- [ ] Add `refetchInterval` for queue polling (optional)

### Backend Endpoints to Verify
- [ ] `GET /api/faqs` — list with category/search params
- [ ] `GET /api/faqs/:id` — single FAQ
- [ ] `GET /api/categories` — category list
- [ ] `GET /api/questions/open` — open queue
- [ ] `GET /api/questions/:id` — question with answers
- [ ] `POST /api/questions` — create question
- [ ] `PATCH /api/questions/:id/answer` — add answer
- [ ] `PATCH /api/questions/:id/reopen` — reopen question
- [ ] `PATCH /api/questions/:id/vote` — vote on answer

### Answer Verification
- [ ] Add answer verification endpoint (PATCH /questions/:id/verify)
- [ ] UI toggle for verified/unverified in QuestionPage or AdminPage

---

## MongoDB Atlas Integration

### Connection
- [ ] Create MongoDB Atlas cluster (free tier M0 or paid M10+)
- [ ] Get connection string: `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/asksam`
- [ ] Update `backend/.env` with `MONGODB_URI=<connection_string>`
- [ ] Update `frontend/.env` with `VITE_API_URL=https://<backend-url>/api`

### Schema Considerations
- [ ] Questions collection: `{ _id, question, category, tags, screenshotUrl, status, createdAt, contributor, views, answers[], isReopened, reopenReason, reopenedAt }`
- [ ] Answers subdocument: `{ _id, content, contributorName, isVerified, createdAt, upvotes, helpful }`
- [ ] FAQs collection: `{ _id, category, question, answer }`

### Production Backend
- [ ] Deploy NestJS to Azure App Service or container
- [ ] Enable persistent storage or Atlas connection for production
- [ ] Set environment variables in Azure portal

---

## Demo Preparation Checklist

### Frontend (Done)
- [x] All 5 pages render with mock data
- [x] Navigation, routing, responsive design
- [x] Form validation, submission flow, success modal
- [x] Queue filtering, expandable cards, grouping
- [x] Discussion sorting, voting UI, trust badges
- [x] Design system, animations, skeletons
- [x] Build succeeds (`npm run build`)
- [x] Runtime stability cleanup complete

### Backend (Pending)
- [ ] Start NestJS backend with MongoDB connected
- [ ] Verify all API endpoints respond correctly
- [ ] Test question submission persists to database
- [ ] Test answer submission persists
- [ ] Test voting persists
- [ ] Test reopen functionality persists

### Integration (Pending)
- [ ] Wire HomePage to live API
- [ ] Wire QueuePage to live API
- [ ] Wire QuestionPage to live API
- [ ] Wire AskPage submit to live API
- [ ] Verify live data flows end-to-end

### Demo Flow
1. Show HomePage — hero, carousel, topics, trust indicators
2. Show QueuePage — open/reopened questions, stats, filters
3. Show AskPage — 4-step workflow, duplicate detection, review summary
4. Submit question — shows success modal
5. Show QuestionPage — answers, voting, sorting, verified badge
6. Show FaqPage — individual FAQ detail
7. Show mobile responsiveness
8. End: all pages render without console errors

---

## Known Issues

| Issue | Severity | Notes |
|------|---------|-------|
| Partial API integration | High | HomePage, QueuePage, QuestionPage wired; AskPage, AdminPage still use mock data |
| MongoDB Atlas not configured | High | Need to set up Atlas cluster and connection string |
| No real user auth | Low | Anyone can post as any name |
| No pagination | Low | FAQ list will grow unbounded |
| No real-time updates | Low | Queue requires manual refresh or polling |
| Dead `@tanstack/react-router` dependency | Low | Import exists in package.json but not used |
| Dead AppController + AppService in backend | Low | Backend has unused default NestJS scaffold |

---

## Technical Debt & Cleanup Notes

| Item | Severity | Notes |
|------|----------|-------|
| Skeleton @apply chain | Fixed | Rewrote skeleton classes as raw CSS |
| CSS theme() function invalid | Fixed | Replaced with hardcoded hex/rgba values |
| FAQCarousel idx undefined | Fixed | Used activeIndex state instead |
| HomePage unsafe optional chaining | Fixed | Added `?.` for category data access |
| QuestionPage unsafe charAt | Fixed | Added optional chaining for category |
| API unhandled rejections | Fixed | Added safeRequest wrapper + error interceptor |
| No 404 route | Fixed | Added `path="*"` catch-all route |
| No loading boundaries | Fixed | Added Suspense + PageLoader for lazy routes |
| Missing `.env` validation | Low | No runtime check for VITE_API_URL presence |
| No error boundaries | Low | React components lack error boundary wrappers |
| Inline `<style>` tags in pages | Low | Keyframe animations in component files |

---

## Environment Variables

**Backend `backend/.env`:**
```
MONGODB_URI=mongodb://localhost:27017/asksam
PORT=3000
```

**Frontend `frontend/.env`:**
```
VITE_API_URL=http://localhost:3000/api
```

---

## Build Status

| Project | Command | Status |
|---------|---------|--------|
| Frontend | `npm run build` | ✅ Success |
| Backend | `npm run build` | ✅ Success |

---

## How to Run

```bash
# Terminal 1 — Backend
cd backend
npm run start:dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open `http://localhost:5173`

---

## Frontend Completion Review

### Frontend Readiness Assessment
- **Status:** ✅ Frontend is demo-ready with live API integration
- **Build:** `npm run build` succeeds — 131 modules, code splitting active
- **Runtime:** No console errors — all known runtime issues resolved
- **Pages:** All 6 pages (HomePage, QueuePage, AskPage, QuestionPage, FaqPage, AdminPage) render correctly
- **API:** HomePage, QueuePage, QuestionPage wired to backend endpoints

### Stable Pages
| Page | Stability | Notes |
|------|-----------|-------|
| HomePage | ✅ Stable | Hero, carousel, topics, highlights, stories, analytics |
| QueuePage | ✅ Stable | Expandable cards, grouping, filters, stats, sidebar |
| AskPage | ✅ Stable | 4-step workflow, validation, uploader, tags, success modal |
| QuestionPage | ✅ Stable | Sorting, voting, verified badges, sidebar, lightbox |
| FaqPage | ✅ Stable | Detail view, related questions, screenshots |
| AdminPage | ✅ Stable | Split-panel layout, queue list, question details, admin answer form, verify toggle |

### Runtime Issues Fixed
- `idx is not defined` in FAQCarousel → replaced with `activeIndex` state
- Missing optional chaining in category lookups → `CATEGORY_DATA?.[cat]?.count`
- Invalid CSS `theme()` functions → hardcoded hex/rgba values
- Unhandled API rejections → `safeRequest` wrapper added
- Missing 404 fallback route → `path="*"` catch-all added
- No loading boundaries → `Suspense` + `PageLoader` spinner added
- No error boundary → `ErrorBoundary` class component with fallback UI

### Remaining Frontend Cleanup Tasks
| Priority | Task | Effort |
|----------|------|--------|
| Low | Remove dead `@tanstack/react-router` import from package.json | 5 min |
| Low | Add `.env` validation for `VITE_API_URL` presence | 15 min |
| Low | Migrate inline `<style>` keyframes to index.css | 30 min |
| ✅ Done | AdminPage moderation dashboard | ✅ Done |
| ✅ Done | Admin route + navbar link | ✅ Done |
| ✅ Done | Answer verification UI | ✅ Done (in AdminPage) |

### Backend Integration Readiness
- **API Layer:** `services/api.js` fully defined with 7 methods
- **safeRequest:** All API calls wrapped with error handling
- **TanStack Query:** Ready for `useQuery` and `useMutation` integration
- **Mock Data:** All pages use local mock data — swap for API calls to go live

### API Integration Priorities (Next Steps)
1. **High:** Wire AskPage submit `questionApi.create()`
2. **High:** Wire answer form `questionApi.addAnswer()`
3. **High:** Wire voting `questionApi.vote()`
4. **High:** Wire reopen `questionApi.reopen()`
5. **High:** Wire AdminPage to backend API
6. **Medium:** Wire AdminPage submit answer to API
7. **Medium:** Wire "Mark Verified" toggle to API
8. **Low:** Add `refetchInterval` for queue polling
9. ❌ Backend endpoints return null in JSON fallback mode — need MongoDB connection for full CRUD

### MongoDB Connection Preparation
- [ ] Confirm MongoDB Atlas cluster exists or create M0 free tier
- [ ] Get connection string: `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/asksam`
- [ ] Update `backend/.env` with `MONGODB_URI=<connection_string>`
- [ ] Test local MongoDB connection first: `mongodb://localhost:27017/asksam`
- [ ] Verify backend starts without MongoDB (conditional MongooseModule)
- [ ] Add `app.enableCors()` in `backend/src/main.ts`

### Demo Preparation Priorities
| Phase | Priority | Task |
|-------|----------|------|
| 1 | ✅ Done | Frontend builds and runs standalone |
| 2 | ✅ Done | All pages render with mock data |
| 3 | ✅ Done | Runtime stability cleanup complete |
| 4 | 🔴 Next | Connect backend to MongoDB |
| 5 | 🔴 Next | Wire API calls end-to-end |
| 6 | 🟡 Later | Deploy backend to Azure App Service |
| 7 | 🟡 Later | Configure production MongoDB Atlas |

---

## Development Progress

| Date | Updates |
|------|---------|
| 2026-05-29 | Complete frontend polish: HomePage topics, QueuePage workflow, AskPage UX, QuestionPage trust indicators, design system enhancements |
| 2026-05-29 | Add Student Success Stories to HomePage; fix skeleton @apply chain build error; enhance AskPage with floating labels, auto-resize textarea, tooltip cards, keyboard-accessible uploader, tags UX, loading state, responsive layout |
| 2026-05-29 | Add Platform Highlights section to HomePage; add ReviewSummaryCard and estimated response time to AskPage; add answer sorting controls, collapsible metadata, related discussion sidebar to QuestionPage; productivity improvements to QueuePage |
| 2026-05-29 | Runtime stability cleanup: fix FAQCarousel idx error, add optional chaining to category lookups, fix CSS theme() function references, add safeRequest wrapper to API, add Suspense/lazy loading/404 to App.jsx |
| 2026-05-29 | Wire HomePage, QueuePage, QuestionPage to backend API with TanStack Query; add loading/error states; add AdminPage moderation dashboard with split-panel layout; add Admin route + navbar link; update CONTEXT.md |

---

## Final Stabilization Checklist

### Backend (JSON Fallback Mode)
- [x] NestJS starts without MongoDB → uses faqData.json fallback
- [x] `@Optional()` + `hasMongoDB` guard for FaqService model dependencies
- [x] Conditional MongooseModule for FaqModule (empty array when no URI)
- [x] All 10 API routes register correctly
- [x] CORS enabled (`app.enableCors()` in main.ts)
- [x] No runtime crashes in fallback mode

### Frontend — API Integration
- [x] HomePage: `faqApi.list()` + `faqApi.listCategories()` via `useQuery`
- [x] QueuePage: `questionApi.listOpen()` via `useQuery`
- [x] QuestionPage: `questionApi.getById()` via `useQuery` + `useParams`
- [x] Loading states (skeleton shimmer) for all pages
- [x] Error states with graceful fallback UIs
- [x] Safe `.map()` / `.filter()` on API arrays (avoid crashes on empty)

### Frontend — Admin & Navigation
- [x] AdminPage: split-panel layout with queue list + question detail
- [x] AdminPage: stat cards, search, category filter, answer form
- [x] AdminPage: "Mark Verified" toggle + "Submit Answer" button
- [x] AdminPage: loading/empty states with placeholder UI
- [x] App.jsx: AdminPage route `/admin`
- [x] Navbar: "Admin" link added to NAV_LINKS (desktop + mobile menu)

### Frontend — Design System
- [x] Tailwind v4 build succeeds (no `@apply` chain errors)
- [x] CSS gradient hardcoded values (no invalid `theme()` calls)
- [x] Skeleton classes as raw CSS (no `@apply` chain)
- [x] ErrorBoundary class component with fallback UI
- [x] 404 fallback route with `path="*"`

---

_Last updated: 2026-05-29_