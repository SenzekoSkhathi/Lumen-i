// api/auth.js

import apiClient from "./api.js"; // [FIX] Changed to import apiClient from api.js

export const signup = (data) => apiClient.post("/auth/signup", data);
export const login = (formData) =>
  apiClient.post("/auth/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
export const getMe = () => apiClient.get("/auth/me");
