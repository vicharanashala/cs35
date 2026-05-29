import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const savedUser = localStorage.getItem("authUser");
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (_) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((data) => {
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("authUser", JSON.stringify({ email: data.email || data.username || "", name: data.name, role: data.role }));
    setUser({ email: data.email || data.username || "", name: data.name, role: data.role });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
