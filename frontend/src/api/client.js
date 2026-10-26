import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const client = axios.create({
  baseURL: BASE_URL,
});

// Attach whichever token exists (student/teacher — admin uses the same teacher token)
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("dfa_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept 401 Unauthorized responses to clear stale sessions and prevent blank dashboard states
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("dfa_token");
      localStorage.removeItem("dfa_role");
      localStorage.removeItem("dfa_is_admin");
      if (
        window.location.pathname.startsWith("/dashboard") ||
        window.location.pathname.startsWith("/admin")
      ) {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export function getWsUrl(path) {
  const httpUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const wsProtocol = httpUrl.startsWith("https") ? "wss:" : "ws:";
  const host = httpUrl.replace(/^https?:\/\//, "");
  return `${wsProtocol}//${host}${path}`;
}

export default client;
