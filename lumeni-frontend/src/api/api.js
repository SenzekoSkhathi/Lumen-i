import axios from "axios";

// [FIX] Strictly use the environment variable from your .env file
// This ensures it connects to Render (live) instead of your laptop.
const RAW_BASE = import.meta.env.VITE_API_URL;

// Ensure we don't end up with double slashes if the env var has a trailing slash
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
