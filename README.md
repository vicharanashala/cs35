# AskSam

AskSam is a collaborative FAQ and Q&A platform built for Samagama students at the Vicharanashala Lab for Education Design, IIT Ropar. The platform allows students to ask questions, provides community answers, and automatically promotes verified answers into canonical FAQs.

## Features

- **Knowledge Discovery:** Full-text search across FAQs and open questions.
- **Q&A Workflow:** Moderation queue with oldest-first routing for open questions.
- **Answer Verification:** Authors and admins can verify the best answer, which automatically generates a canonical FAQ.
- **Reopen Flow:** Verified answers can be flagged as incorrect to re-enter the moderation queue.
- **Real-Time Notifications:** Live updates via Socket.IO for new answers and status changes.
- **Access Control:** Role-based access for students and administrators.
- **Offline Resilience:** Falls back to a read-only JSON representation if the primary database is offline.

## Tech Stack

**Frontend:**
- React 19, Vite 8
- Tailwind CSS v4
- TanStack Query v5, React Router v7
- Socket.IO Client

**Backend:**
- NestJS 11, TypeScript
- MongoDB (Mongoose 9)
- Socket.IO

## Architecture Workflow

```text
  [Login / Signup] -> [Search] -> [Ask Question] -> [Queue (Open)]
                                                          |
  [Community Answers] <- [Best Answer Verified] <---------+
                               |
            +------------------+------------------+
            |                                     |
  [Promoted to FAQ]                      [Flagged Incorrect]
                                                  |
                                             [Back to Queue]
```

## Project Structure

```text
cs35/
├── backend/          # NestJS application and MongoDB schemas
│   ├── src/          # API Controllers, Services, and Gateways
│   └── scripts/      # Database seeding and utility scripts
├── frontend/         # React SPA built with Vite
│   ├── src/          # UI Components, Pages, and Hooks
│   └── public/       # Static assets
├── assets/           # Project diagrams and images
└── README.md         # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB
- npm (v9 or higher)

### Environment Variables

You need to set up environment variables for both the backend and frontend.

**Backend (`backend/.env`):**
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/samagama
JWT_SECRET=your_super_secret_jwt_key
GROQ_API_KEY=optional_api_key
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:3000/api
```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/vicharanashala/cs35.git
   cd cs35
   ```

2. Start the Backend server:
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

3. Start the Frontend client:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

The application will be available at `http://localhost:5173`.

### Running Tests

To verify the integrity of the application, you can run the automated test suites:

```bash
# In the backend directory
npm run test

# In the frontend directory
npm run test
```

## Core API Endpoints

The API is prefixed with `/api`. Protected routes require a Bearer token in the `Authorization` header.

- `POST /api/auth/login` - Authenticate and retrieve JWT
- `GET /api/faqs` - Retrieve canonical FAQs
- `GET /api/questions` - List questions based on filters
- `POST /api/questions` - Submit a new question
- `PATCH /api/questions/:id/answer` - Submit an answer to a question
- `POST /api/questions/:id/convert-to-faq` - (Admin) Promote verified answer
- `GET /api/search/full` - Full-text search across all content

## Contributors

- Mano Shruthi S
- Pavan Kumar M
- Dusi Keerthi Prasanna
- Rashmi Risha J
- Thivesha M. S
- Dishi Gupta
- Ambati Vedanandana
- Divyadharshini S
- Putta Sri Tejaswi
- Akshaya Boggarapu

## License

This project is licensed under the MIT License.