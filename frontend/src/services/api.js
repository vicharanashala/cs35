import axios from 'axios'

const client = axios.create({ baseURL: '/api' })

async function handleResponse(res) {
  const data = res.data
  if (!res.ok) throw new Error(data?.error || 'Something went wrong')
  return data
}

// ─── FAQ Endpoints ────────────────────────────────────────────
export const faqApi = {
  getAll: (params = {}) => client.get('/faqs', { params }).then(r => r.data),

  getById: (id) => client.get(/faqs/).then(r => r.data),

  search: (q) => client.get('/faqs/search', { params: { q } }).then(r => r.data),

  create: (faqData) => client.post('/faqs', faqData).then(r => r.data),

  upvote: (id) => client.post(/faqs//upvote).then(r => r.data),
}

// ─── Question Endpoints ────────────────────────────────────────
export const questionApi = {
  getOpen: () => client.get('/questions/open').then(r => r.data),

  getById: (id) => client.get(/questions/).then(r => r.data),

  submit: (data) => client.post('/questions', data).then(r => r.data),

  addAnswer: (id, data) => client.patch(/questions//answer, data).then(r => r.data),

  checkDuplicates: (text) =>
    client.post('/questions/check-duplicates', { text }).then(r => r.data),
}

// ─── Category Endpoints ────────────────────────────────────────
export const categoryApi = {
  getAll: () => client.get('/categories').then(r => r.data),

  getById: (id) => client.get(/categories/).then(r => r.data),
}

// ─── User Endpoints ──────────────────────────────────────────
export const userApi = {
  getProfile: () => client.get('/user/profile').then(r => r.data),

  getMyQuestions: () => client.get('/user/questions').then(r => r.data),
}

// ─── Notification Endpoints ────────────────────────────────────
export const notificationApi = {
  getAll: () => client.get('/notifications').then(r => r.data),

  markRead: (id) => client.patch(/notifications//read).then(r => r.data),
}