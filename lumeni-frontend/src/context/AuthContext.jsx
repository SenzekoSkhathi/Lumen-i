import { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../api/api.js";

export const AuthContext = createContext();

/**
 * AuthProvider
 * - Keeps track of the logged-in user
 * - Loads /auth/me on startup if a token exists
 * - Exposes: user, setUser, login(), logout(), loading
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---- LOGIN using the *current* FastAPI backend ----
  const login = async (email, password) => {
    // Backend expects OAuth2PasswordRequestForm: username + password
    const res = await apiClient.post(
      "/auth/login",
      new URLSearchParams({
        username: email,
        password: password,
      })
    );

    const accessToken = res.data?.access_token;
    if (!accessToken) {
      throw new Error("No access token returned from /auth/login");
    }

    // Store token so interceptors can attach it
    localStorage.setItem("token", accessToken);

    // Fetch current user
    const meRes = await apiClient.get("/auth/me");
    setUser(meRes.data);
    return meRes.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("lumeni_token");
    setUser(null);
  };

  // ---- Load user on initial app load if token exists ----
  useEffect(() => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("lumeni_token");

    if (!token) {
      setLoading(false);
      return;
    }

    apiClient
      .get("/auth/me")
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => {
        // invalid/expired token – clean it up
        localStorage.removeItem("token");
        localStorage.removeItem("lumeni_token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, setUser, login, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);