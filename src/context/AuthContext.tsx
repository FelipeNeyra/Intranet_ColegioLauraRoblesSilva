"use client";

import { createContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAuth } from "../firebase/config";
import { getUserByEmailAsync, type User } from "../lib/auth";

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
    let unsub: (() => void) | null = null;
    (async () => {
      try {
        const auth = await getFirebaseAuth();
        console.info("[browser] AuthContext got Firebase Auth instance");
        unsub = onAuthStateChanged(auth, async () => {
          const currentUser = auth.currentUser;
          if (currentUser?.email) {
            const storedUser = await getUserByEmailAsync(currentUser.email);

            setUser({
              id: currentUser.uid,
              nombre: storedUser?.nombre ?? currentUser.displayName ?? currentUser.email,
              email: currentUser.email,
              password: "",
              rol: storedUser?.rol ?? "Profesor",
            });
          } else {
            setUser(null);
          }

          setIsInitializing(false);
        });
      } catch (e) {
        console.error("[browser] AuthContext initialization failed", e);
        setIsInitializing(false);
      }
    })();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const auth = await getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
      console.info('[browser] Firebase signInWithEmailAndPassword succeeded for', email);
      return { success: true };
    } catch (e) {
      const err = e as any;
      const code = err?.code ?? err?.message ?? "auth/error";
      console.error("Firebase login error:", code, err?.message ?? err);

      const shouldTryAutoProvision =
        code === "auth/user-not-found" ||
        code === "auth/invalid-credential" ||
        (typeof code === "string" && code.toUpperCase().includes("INVALID_LOGIN_CREDENTIALS"));

      if (shouldTryAutoProvision) {
        try {
          const stored = await getUserByEmailAsync(email);
          if (stored && stored.password === password) {
            try {
              const auth = await getFirebaseAuth();
              await createUserWithEmailAndPassword(auth, email, stored.password);
              await signInWithEmailAndPassword(auth, email, stored.password);
              return { success: true };
            } catch (e2) {
              console.error("Auto-provisioning createUser error:", e2);
            }
          }
        } catch (e3) {
          console.error("Error fetching user from Firestore during auto-provision:", e3);
        }
      }

      return { success: false, error: code };
    }
  };

  const logout = async () => {
    try {
      const auth = await getFirebaseAuth();
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
