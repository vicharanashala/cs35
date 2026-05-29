import axios from "axios";

const client = axios.create({
  baseURL: "http://localhost:3000/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED" || !error.response) {
      return Promise.reject(new Error("Network error — backend unavailable"));
    }
    return Promise.reject(error);
  }
);

function safeRequest(promise) {
  return promise.catch((err) => {
    console.error("API Error:", err.message);
    return Promise.reject(err);
  });
}

// ── Public FAQ API ────────────────────────────────────────────

export const faqApi = {
  list: (params = {}) => safeRequest(client.get("/faqs", { params }).then((r) => r.data)),
  getById: (id) => safeRequest(client.get(`/faqs/${id}`).then((r) => r.data)),
  listCategories: () => safeRequest(client.get("/categories").then((r) => r.data)),
};

// ── Question API ─────────────────────────────────────────────

export const questionApi = {
  listOpen: () => safeRequest(client.get("/questions/open").then((r) => r.data)),
  list: (params = {}) => safeRequest(client.get("/questions", { params }).then((r) => r.data)),
  getById: (id) => safeRequest(client.get(`/questions/${id}`).then((r) => r.data)),
  create: (data) => safeRequest(client.post("/questions", data).then((r) => r.data)),
  update: (id, data) => safeRequest(client.patch(`/questions/${id}`, data).then((r) => r.data)),
  delete: (id) => safeRequest(client.delete(`/questions/${id}`).then((r) => r.data)),
  close: (id) => safeRequest(client.patch(`/questions/${id}/close`).then((r) => r.data)),
  reopen: (id) => safeRequest(client.patch(`/questions/${id}/reopen`).then((r) => r.data)),
  addAnswer: (id, data) => safeRequest(client.patch(`/questions/${id}/answer`, data).then((r) => r.data)),
  convertToFaq: (id, answerId) => safeRequest(client.patch(`/questions/${id}/convert-to-faq`, { answerId }).then((r) => r.data)),
  vote: (questionId, answerId, direction) =>
    safeRequest(client.patch(`/questions/${questionId}/vote`, { answerId, direction }).then((r) => r.data)),
};

// ── Answer API ────────────────────────────────────────────────

export const answerApi = {
  update: (id, data) => safeRequest(client.patch(`/answers/${id}`, data).then((r) => r.data)),
  delete: (id) => safeRequest(client.delete(`/answers/${id}`).then((r) => r.data)),
  verify: (id, verified) => safeRequest(client.patch(`/answers/${id}/verify`, { verified }).then((r) => r.data)),
};

// ── FAQ Management API ────────────────────────────────────────

export const faqAdminApi = {
  create: (data) => safeRequest(client.post("/faqs", data).then((r) => r.data)),
  update: (id, data) => safeRequest(client.patch(`/faqs/${id}`, data).then((r) => r.data)),
  delete: (id) => safeRequest(client.delete(`/faqs/${id}`).then((r) => r.data)),
  pin: (id, pinned) => safeRequest(client.patch(`/faqs/${id}/pin`, { pinned }).then((r) => r.data)),
};

// ── Category API ─────────────────────────────────────────────

export const categoryApi = {
  getStats: () => safeRequest(client.get("/categories/stats").then((r) => r.data)),
  create: (name) => safeRequest(client.post("/categories", { name }).then((r) => r.data)),
};

// ── User API ──────────────────────────────────────────────────

export const userApi = {
  me: () => {
    const token = localStorage.getItem('authToken') || '';
    return safeRequest(
      client.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.data)
    );
  },
  list: () => safeRequest(client.get("/users").then((r) => r.data)),
  update: (id, data) => safeRequest(client.patch(`/users/${id}`, data).then((r) => r.data)),
  delete: (id) => safeRequest(client.delete(`/users/${id}`).then((r) => r.data)),
};

// ── Admin Stats API ───────────────────────────────────────────

export const adminApi = {
  getStats: () => safeRequest(client.get("/admin/stats").then((r) => r.data)),
};

// ── Auth API ─────────────────────────────────────────────────

export const authApi = {
  signup: (data) => safeRequest(client.post("/auth/signup", data).then((r) => r.data)),
  login: (data) => safeRequest(client.post("/auth/login", data).then((r) => r.data)),
  forgotPassword: (data) => safeRequest(client.post("/auth/forgot-password", data).then((r) => r.data)),
};
