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

export const faqApi = {
  list: (params = {}) => safeRequest(client.get("/faqs", { params }).then((r) => r.data)),
  getById: (id) => safeRequest(client.get(`/faqs/${id}`).then((r) => r.data)),
  listCategories: () => safeRequest(client.get("/categories").then((r) => r.data)),
};

export const questionApi = {
  listOpen: () => safeRequest(client.get("/questions/open").then((r) => r.data)),
  getById: (id) => safeRequest(client.get(`/questions/${id}`).then((r) => r.data)),
  create: (data) => safeRequest(client.post("/questions", data).then((r) => r.data)),
  addAnswer: (id, data) => safeRequest(client.patch(`/questions/${id}/answer`, data).then((r) => r.data)),
  reopen: (id) => safeRequest(client.patch(`/questions/${id}/reopen`).then((r) => r.data)),
  vote: (questionId, answerId, direction) =>
    safeRequest(client.patch(`/questions/${questionId}/vote`, { answerId, direction }).then((r) => r.data)),
};

export const authApi = {
  sendOtp: (email) => safeRequest(client.post("/auth/send-otp", { email }).then((r) => r.data)),
  verifyOtp: (email, otp) => safeRequest(client.post("/auth/verify-otp", { email, otp }).then((r) => r.data)),
  signup: (data) => safeRequest(client.post("/auth/signup", data).then((r) => r.data)),
  login: (data) => safeRequest(client.post("/auth/login", data).then((r) => r.data)),
};