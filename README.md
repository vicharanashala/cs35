# cs35
# CS35 - Community Q&A Platform

A full-stack Question & Answer platform built using React, NestJS, and MongoDB. Users can ask questions, browse FAQs, track their submissions, and interact with a moderated community knowledge base.

## Features

* User Authentication

  * Login with OTP verification
  * Secure user management

* FAQ Management

  * Browse frequently asked questions
  * Search and filter FAQs
  * Rich text answers

* Question Submission

  * Ask new questions
  * Track question status
  * View personal question history

* Admin Dashboard

  * Manage incoming questions
  * Create and update FAQ entries
  * Moderate platform content

* Real-Time Updates

  * WebSocket integration using Socket.IO
  * Live notifications and queue updates

## Tech Stack

### Frontend

* React
* Vite
* React Router
* React Query
* Tailwind CSS
* Axios
* Socket.IO Client

### Backend

* NestJS
* MongoDB
* Mongoose
* JWT Authentication
* Nodemailer
* Socket.IO

## Project Structure

```text
cs35/
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   ├── test/
│   └── package.json
│
├── faqData.json
└── README.md
```

## Installation

### Clone Repository

```bash
git clone <repository-url>
cd cs35
```

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file using:

```bash
cp ../backend.env.example .env
```

Start the backend server:

```bash
npm run start:dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Example backend configuration:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email
EMAIL_PASSWORD=your_email_password
```

## Available Scripts

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

### Backend

```bash
npm run start
npm run start:dev
npm run build
npm run test
npm run test:e2e
npm run lint
```

## API Modules

* Authentication Module
* FAQ Module
* Question Management
* Notification System
* Real-Time Events Gateway

## Future Improvements

* Advanced search and filtering
* User reputation system
* AI-powered FAQ suggestions
* Email notifications
* Analytics dashboard

## License

This project is licensed under the terms specified in the LICENSE file.

