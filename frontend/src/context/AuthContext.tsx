// src/context/AuthContext.tsx
"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthUser {
  userId: number;
  role: string;
  token: string;
  email?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (token: string, userId: number, role: string, email?: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("auth");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = (token: string, userId: number, role: string, email?: string) => {
    const u: AuthUser = { token, userId, role, email };
    setUser(u);
    localStorage.setItem("auth", JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
