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

export function getWsUrl(path) {
  const httpUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const wsProtocol = httpUrl.startsWith("https") ? "wss:" : "ws:";
  const host = httpUrl.replace(/^https?:\/\//, "");
  return `${wsProtocol}//${host}${path}`;
}

export default client;
