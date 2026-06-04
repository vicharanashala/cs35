<div align="center">

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-flat-square&logo=nestjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-flat-square&logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-flat-square&logo=mongodb&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-flat-square&logo=socket.io&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-flat-square&logo=tailwindcss&logoColor=white)

**A collaborative FAQ and Q&A platform built for Samagama students at the [Vicharanashala Lab for Education Design, IIT Ropar](https://vicharanashala.ai).**

</div>

---

## 📌 Features

- **Knowledge Discovery:** Full-text search across FAQs and open questions.
- **Q&A Workflow:** Moderation queue with oldest-first routing for open questions.
- **Answer Verification:** Authors and admins can verify the best answer, generating a canonical FAQ automatically.
- **Reopen Flow:** Verified answers can be flagged as incorrect to re-enter the moderation queue.
- **Real-Time Notifications:** Live updates via Socket.IO for new answers and status changes.
- **Access Control:** Role-based access for students and administrators.
- **Offline Resilience:** Falls back to a read-only JSON representation if the primary database is offline.

---

## 🏗️ Architecture Workflow

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

---

## 📂 Project Structure

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

---

## 🚀 Getting Started

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

```bash
# Backend
cd backend && npm run test

# Frontend
cd frontend && npm run test
```

---

## 🔌 Core API Endpoints

The API is prefixed with `/api`. Protected routes require a Bearer token in the `Authorization` header.

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/auth/login` | `POST` | Authenticate and retrieve JWT |
| `/api/faqs` | `GET` | Retrieve canonical FAQs |
| `/api/questions` | `GET` | List questions based on filters |
| `/api/questions` | `POST` | Submit a new question |
| `/api/questions/:id/answer` | `PATCH` | Submit an answer to a question |
| `/api/questions/:id/convert-to-faq`| `POST` | (Admin) Promote verified answer |
| `/api/search/full` | `GET` | Full-text search across all content |

---

## 👥 Contributors

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

---

## 📜 License

This project is licensed under the MIT License.