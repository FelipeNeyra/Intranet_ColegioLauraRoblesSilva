"use client";

import { createContext, useEffect, useState, type ReactNode } from "react";
import { getUsersFromStorage, seedInitialUsers, type User } from "../lib/auth";

interface AuthContextType {
  user: User | null;
  isInitializing: boolean;
  login: (email: string, password: string) => {
    success: boolean;
    error?: string;
  };
  logout: () => void;
}

const sessionStorageKey = "intranet_sesion";

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isInitializing: true,
  login: () => ({ success: false, error: "Contexto de autenticación no disponible." }),
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    seedInitialUsers();

    if (typeof window === "undefined") {
      setIsInitializing(false);
      return;
    }

    const storedSession = localStorage.getItem(sessionStorageKey);
    if (!storedSession) {
      setIsInitializing(false);
      return;
    }

    try {
      const parsedUser = JSON.parse(storedSession) as User;
      setUser(parsedUser);
    } catch {
      localStorage.removeItem(sessionStorageKey);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const login = (email: string, password: string) => {
    const users = getUsersFromStorage();
    const foundUser = users.find(
      (candidate) => candidate.email === email && candidate.password === password,
    );

    if (!foundUser) {
      return {
        success: false,
        error: "Usuario o contraseña incorrectos.",
      };
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(sessionStorageKey, JSON.stringify(foundUser));
    }

    setUser(foundUser);

    return {
      success: true,
    };
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(sessionStorageKey);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isInitializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
