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
    localStorage.setItem("authUser", JSON.stringify({ email: data.email || data.username || "", name: data.name, role: data.role }));
    setUser({ email: data.email || data.username || "", name: data.name, role: data.role });
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
      const data = await userApi.me();
      if (data) {
        setUser(data);
        localStorage.setItem("authUser", JSON.stringify(data));
      }
    } catch (err) {
      console.error("Failed to load user:", err);
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
