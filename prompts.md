# AskSam — Final Architecture

## Tech Stack

Frontend:

* React
* Vite
* Tailwind CSS v4
* TanStack Router
* TanStack Query
* Axios

Backend:

* NestJS
* Express Adapter
* MongoDB
* Mongoose

---

## Core Pages

1. FAQ Homepage
   Route:
   /

Features:

* FAQ search
* category filters
* related questions
* answered badges
* popular questions
* ask question button

---

2.Queue Page
   Route:
   /queue

Features:

* unresolved questions
* oldest-first order
* pending badge
* answer count
* queue cards

---

3.Question Detail Page
   Route:
   /question/:id

Features:

* question details
* verified answer
* add answer
* related FAQs
* reopen question

---

4.Admin Page
   Route:
   /admin

Features:

* verify answers
* mark official FAQ
* reopen flagged questions

---

## Core Workflow

User searches FAQ
↓
If found → show answer

If not found → ask question
↓
Question enters queue
↓
Community answers
↓
Admin verifies answer
↓
Moves to FAQ section

If answer flagged wrong
↓
Question reopens into queue

---

## Database Collections

FAQ
Question
Answer

---

## Priority Features

1. Search
2. Queue system
3. Verified answers
4. Reopen workflow
5. Related questions
6. Screenshot upload
7. Speech-to-text (optional)

---

## Important Rules

* Keep architecture lightweight
* No unnecessary libraries
* No Redis
* No BullMQ
* No JWT
* No Socket.io
* No enterprise complexity
* Mobile-friendly UI
* Student-friendly UX
