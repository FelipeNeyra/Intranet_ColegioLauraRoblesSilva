"use client";

import { createContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, type User as FirebaseAuthUser } from "firebase/auth";
import { getFirebaseAuth } from "../firebase/config";
import { getUserByEmailAsync, isAuthStateSyncSuppressed, seedInitialUsers, type User } from "../lib/auth";
import { getDocentesFromFirestore } from "../lib/adminData";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseAuthUser | null;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  isInitializing: true,
  login: async () => ({ success: false, error: "Contexto de autenticación no disponible." }),
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    seedInitialUsers();

    let unsub: (() => void) | null = null;

    (async () => {
      try {
        const auth = await getFirebaseAuth();
        unsub = onAuthStateChanged(auth, async () => {
          if (isAuthStateSyncSuppressed()) {
            return;
          }

          const currentUser = auth.currentUser;
          setFirebaseUser(currentUser);

          if (currentUser?.email) {
            // Prefer Firestore user profile
            let profile = await getUserByEmailAsync(currentUser.email);

            // If no explicit usuario doc, try to match a docente by correo
            if (!profile) {
              try {
                const docentes = await getDocentesFromFirestore();
                const match = docentes.find((d) => d.correo === currentUser.email);
                if (match) {
                  profile = {
                    id: match.id,
                    nombre: match.nombre,
                    email: currentUser.email,
                    password: "",
                    rol: "Profesor",
                  } as User;
                }
              } catch (e) {
                console.error("Error fetching docentes for auth auto-provision:", e);
              }
            }

            const userId = profile?.id ?? currentUser.uid;
            const userName = profile?.nombre ?? currentUser.displayName ?? currentUser.email;
            const userRole = (profile?.rol as User["rol"]) ?? "Profesor";

            setUser({ id: userId, nombre: userName, email: currentUser.email, password: "", rol: userRole });
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
    const auth = await getFirebaseAuth();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (e) {
      const err = e as any;
      const code = err?.code ?? err?.message ?? "auth/error";

      const shouldTryAutoProvision =
        code === "auth/user-not-found" ||
        code === "auth/invalid-credential" ||
        (typeof code === "string" && code.toUpperCase().includes("INVALID_LOGIN_CREDENTIALS"));

      if (shouldTryAutoProvision) {
        let stored: User | undefined;
        try {
          stored = await getUserByEmailAsync(email);
        } catch (e3) {
          console.error("Error fetching user during auto-provision:", e3);
        }

        const expectedPassword = stored?.password || (stored?.rol === "Profesor" ? "profe123456" : undefined);
        if (stored && expectedPassword && password === expectedPassword) {
          try {
            await createUserWithEmailAndPassword(auth, email, expectedPassword);
            await signInWithEmailAndPassword(auth, email, expectedPassword);
            return { success: true };
          } catch (e2) {
            const err2 = e2 as any;
            const code2 = err2?.code ?? err2?.message ?? "";
            if (code2 === "auth/email-already-in-use") {
              try {
                await signInWithEmailAndPassword(auth, email, expectedPassword);
                return { success: true };
              } catch (e4) {
                console.error("Auto-provisioning sign in fallback failed:", e4);
              }
            } else {
              console.error("Auto-provisioning createUser error:", e2);
            }
          }
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
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, isInitializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
