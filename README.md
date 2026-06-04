# 🚀 Key Features

## 📚 Browse & Search

| Feature              | Description                                                |
| -------------------- | ---------------------------------------------------------- |
| Full-text FAQ Search | Search across all canonical FAQs with category filters     |
| Category Browsing    | Browse FAQs and questions organized by topic               |
| Tag-based Filtering  | Filter content by tags on both questions and FAQs          |
| Bookmarks            | Logged-in users can bookmark any question for quick access |
| Trending Searches    | See what questions are trending in the community           |

---

## ❓ Ask & Answer

| Feature             | Description                                                                          |
| ------------------- | ------------------------------------------------------------------------------------ |
| Question Submission | Submit questions with title, rich-text body, category, and optional screenshot       |
| Community Answers   | Multiple answers per question; all answer authors are tracked                        |
| Answer Verification | Mark the best answer as verified and automatically convert it into a canonical FAQ   |
| Accept Answer       | Question author can accept a specific answer as the best one                         |
| Upvote/Downvote     | Community voting on both questions and individual answers                            |
| Reopen Logic        | Flag a verified answer as incorrect, causing the question to re-enter the open queue |
| Moderation Queue    | Open and reopened questions are listed oldest-first for community review             |

---

## 🔔 Real-time & Social

| Feature            | Description                                                                |
| ------------------ | -------------------------------------------------------------------------- |
| Live Notifications | Socket.IO pushes for new answers, status changes, and admin actions        |
| User Profiles      | Track your asked questions, submitted answers, and overall activity        |
| Follow System      | Follow other users to see their activity                                   |
| Activity Heatmap   | Visualize your contribution activity over time                             |
| Role-based Access  | JWT authentication with student and admin roles, protected by route guards |
| Admin Dashboard    | Tag, categorize, merge, close, pin, and manage all questions and FAQs      |

---

## 🤖 AI & Analytics

| Feature          | Description                                                     |
| ---------------- | --------------------------------------------------------------- |
| AI Moderation    | Groq LLM integration for intelligent question pre-moderation    |
| Full-text Search | Search across both questions and FAQs                           |
| Search Analytics | Track trending queries and failed searches through search logs  |
| FAQ Feedback     | Users can mark FAQs as helpful or unhelpful and provide reasons |
