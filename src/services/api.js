
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 600000 // Increased timeout to 10 minutes (10 * 60 * 1000 ms)
});

export const API = {
  search: (q, page, page_size) => api.get("/search", { params: { q, page, page_size } }),
  years: () => api.get("/years"),
  colleges: year => api.get("/colleges", { params: { year } }),
  courses: (year, college) => api.get("/courses", { params: { year, college } }),
  students: params => api.get("/students", { params }),
  student: roll => api.get(`/student/${roll}`),
  report: roll => api.get(`/report/${roll}`, { responseType: "blob" })
};
