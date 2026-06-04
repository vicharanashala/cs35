# CS35 – Crowdsourced FAQ Repository

## Project Overview

CS35 is a collaborative FAQ management platform designed to create a centralized repository of frequently asked questions and their answers. The system enables users to search, browse, and contribute FAQs, making knowledge sharing easier and more accessible.

The project follows a full-stack architecture with separate frontend and backend components to ensure scalability, maintainability, and efficient data management.

## Objectives

* Provide a centralized knowledge repository
* Enable efficient FAQ search and retrieval
* Organize FAQs into categories
* Support community-driven content contributions
* Improve information accessibility and management

## System Architecture

The project consists of two major components:

### Frontend

The frontend provides the user interface through which users can:

* Browse FAQs
* Search for information
* View categorized content
* Interact with the platform

### Backend

The backend manages:

* FAQ data processing
* API services
* Search functionality
* Data storage and retrieval
* Business logic and validation

## Core Features

* FAQ Creation and Management
* Category-Based Organization
* Search and Filtering
* User-Friendly Interface
* Structured Data Storage
* Scalable Client-Server Architecture
* Collaborative Content Contribution

## Project Structure

```text
CS35/
├── frontend/          # User Interface
├── backend/           # Server-side APIs and logic
├── faqData.json       # FAQ data storage
├── backend.env.example
└── README.md
```

## Technology Stack

### Frontend

* React
* HTML5
* CSS3
* JavaScript

### Backend

* Node.js
* Express.js

### Data Storage

* MongoDB (if configured)
* JSON-based storage for development and testing

## Workflow

1. Users submit or access FAQ information.
2. Frontend sends requests to backend APIs.
3. Backend processes requests and retrieves data.
4. Relevant FAQs are returned to the frontend.
5. Users receive organized and searchable information.

## Future Scope

* AI-powered FAQ recommendations
* Intelligent search and ranking
* User authentication and authorization
* FAQ analytics dashboard
* Community moderation system
* Multi-language support
* Real-time collaboration features

## Team Collaboration

The project follows a Git-based workflow:

* Fork the repository
* Create a feature branch
* Implement changes
* Commit and push updates
* Submit a Pull Request for review

## Conclusion

CS35 aims to build a scalable and collaborative FAQ platform that simplifies knowledge management and information sharing. By combining modern frontend and backend technologies, the project provides an efficient solution for organizing and accessing frequently asked questions.

﻿# Samagama Collaborative FAQ Platform

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
**Sri Tejaswi Putta** — Feature enhancements, documentation refinement, and project collaboration.


## Recommended Next Steps

1. Add real media upload support to persist screenshot attachments.
2. Seed MongoDB with initial FAQ and category data.
3. Wire authentication tokens for protected routes and admin operations.
4. Extend the frontend for better mobile responsiveness and rich text answers.
