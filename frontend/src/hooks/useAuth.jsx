/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { userApi } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();

  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("authToken");
    const savedUser = localStorage.getItem("authUser");
    if (token && savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
      }
    }
    return null;
  });

  const login = useCallback((data) => {
    localStorage.setItem("authToken", data.token);
    
    // Decode user Mongoose ID from JWT token
    let userId = "";
    try {
      const base64Url = data.token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      userId = payload.id || "";
    } catch (e) {
      console.error("Failed to decode token:", e);
    }

    const userData = {
      _id: userId,
      username: data.username || "",
      email: data.email || "",
      name: data.name,
      role: data.role
    };

    localStorage.setItem("authUser", JSON.stringify(userData));
    setUser(userData);
    queryClient.clear();
  }, [queryClient]);

  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    queryClient.clear();
    setUser(null);
    window.location.replace("/login");
  }, [queryClient]);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    try {
      const res = await userApi.me();
      if (res && res.success && res.user) {
        setUser(res.user);
        localStorage.setItem("authUser", JSON.stringify(res.user));
      }
    } catch (err) {
      console.error("Failed to load user:", err);
      // If token is expired/invalid (401), clear auth state so user gets redirected to login
      if (err?.response?.status === 401) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        setUser(null);
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loadUser, loading: false, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
