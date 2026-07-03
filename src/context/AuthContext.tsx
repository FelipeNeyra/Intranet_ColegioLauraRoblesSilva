"use client";

import { createContext, useEffect, useState, type ReactNode } from "react";
import firebase_app from "../firebase/config";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getUserByEmail, type User } from "../lib/auth";

const auth = getAuth(firebase_app);

interface AuthContextType {
  user: User | null;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isInitializing: true,
  login: async () => ({ success: false, error: "Contexto de autenticación no disponible." }),
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser?.email) {
        const storedUser = getUserByEmail(firebaseUser.email);

        setUser({
          id: firebaseUser.uid,
          nombre: storedUser?.nombre ?? firebaseUser.displayName ?? firebaseUser.email,
          email: firebaseUser.email,
          password: "",
          rol: storedUser?.rol ?? "Profesor",
        });
      } else {
        setUser(null);
      }

      setIsInitializing(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as { code?: string }).code ?? "auth/error" };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore logout errors
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isInitializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
