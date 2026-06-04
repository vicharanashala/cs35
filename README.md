# Samagama Collaborative FAQ Platform

A collaborative knowledge base for internship and course-related questions.
This project helps users ask, answer, validate, and consume FAQ-style content across a shared platform.
It includes a React frontend and a NestJS backend with support for user contributions, categories, search, user activity, admin moderation, and AI-powered tooling.

## Project Overview

The platform is designed to reduce repeated questions across websites and support forums by enabling:
- Question submission with optional screenshot/media references
- Community answers, verification, and conversion into canonical FAQs
- Category-based browsing and search
- User profiles, bookmarks, and notifications
- Admin review, moderation, and analytics
- AI-assisted question pre-moderation and FAQ synthesis

## Tech Stack

- Backend: NestJS, TypeScript, MongoDB, Mongoose, JWT authentication
- AI: Groq LLM integration and Xenova embedding pipeline for semantic matching
- Frontend: React 19, Vite, Tailwind CSS, React Router, React Query, Axios
- Real-time/notifications: Socket.IO compatible architecture

## Repository Structure

- `backend/` - NestJS server and API
- `frontend/` - React application and UI
- `faqData.json` - seed or static FAQ dataset

## Key Features

- `GET /api/faqs` - list FAQs with category and search support
- `POST /api/questions` - submit questions with screenshot URL and details
- `PATCH /api/questions/:id/answer` - add answers to questions
- `POST /api/questions/:id/convert-to-faq` - create canonical FAQs from verified answers
- `GET /api/search/full` - full-text search across questions
- `GET /api/categories` - category listing and stats
- `PATCH /api/users/:userId/bookmark/:questionId` - bookmarks
- AI moderation and question quality improvements via `AiService`

## Environment Variables

Create a `.env` file in `backend/` with values like:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/samagama
JWT_SECRET=your-secret
GROQ_API_KEY=your-groq-api-key
```

`GROQ_API_KEY` is optional; without it AI features fall back to safe defaults.

## Setup & Run

Install dependencies and start both apps:

```bash
cd Thivesha-M-S/backend
npm install
npm run start:dev
```

In a separate terminal:

```bash
cd Thivesha-M-S/frontend
npm install
npm run dev
```

The frontend expects the backend API at `http://localhost:3000/api` by default. Adjust `VITE_API_URL` in frontend environment if needed.

## Notes

- The backend uses `app.setGlobalPrefix('api')`, so all endpoints are namespaced under `/api`.
- If `MONGODB_URI` is not present, only the FAQ module loads; auth and AI modules require database connectivity.
- The frontend includes pages for home, ask, FAQs, question detail, queue, profile, notifications, and admin.

## Contributors
- Divyadharshini S (original README contribution)
- GitHub Copilot assistant (merge cleanup)

## Recommended Next Steps

1. Add real media upload support to persist screenshot attachments.
2. Seed MongoDB with initial FAQ and category data.
3. Wire authentication tokens for protected routes and admin operations.
4. Extend the frontend for better mobile responsiveness and rich text answers.
