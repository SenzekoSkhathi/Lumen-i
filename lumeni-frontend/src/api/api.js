import axios from "axios";

// [FIX] Simplified logic: Default to localhost:8000 if no env var is set.
// We removed 'window.location.origin' to prevent it from hitting port 5173.
const RAW_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const API_BASE_URL = `${RAW_BASE.replace(/\/$/, "")}/api`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request interceptor to attach the Bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export const searchVideos = async (query) => {
  const response = await apiClient.get(`/search/videos`, {
    params: { q: query },
  });
  return response.data;
};

export const suggestQueries = async (query) => {
  const response = await apiClient.get(`/search/suggest`, {
    params: { q: query },
  });
  return response.data;
};

export default apiClient;
