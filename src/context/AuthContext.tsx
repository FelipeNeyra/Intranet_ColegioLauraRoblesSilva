"use client";

import { createContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAuth } from "../firebase/config";
import { getUserByEmailAsync, getUserByEmail, seedInitialUsers, type User } from "../lib/auth";
import { getDocentesFromFirestore, getDocentesFromStorage } from "../lib/adminData";

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
    seedInitialUsers();

    let unsub: (() => void) | null = null;
    (async () => {
      try {
        const auth = await getFirebaseAuth();
        console.info("[browser] AuthContext got Firebase Auth instance");
        unsub = onAuthStateChanged(auth, async () => {
          const currentUser = auth.currentUser;
          if (currentUser?.email) {
            const storedUser = await getUserByEmailAsync(currentUser.email);
            const localUser = getUserByEmail(currentUser.email);
            const profile = storedUser ?? localUser;

            let userId = profile?.id ?? currentUser.uid;
            let userName = profile?.nombre ?? currentUser.displayName ?? currentUser.email;
            let userRole = profile?.rol ?? "Profesor";

            if (!profile) {
              try {
                const docentesFromFirestore = await getDocentesFromFirestore();
                const docenteMatch = docentesFromFirestore.find((doc) => doc.correo === currentUser.email);
                if (docenteMatch) {
                  userId = docenteMatch.id;
                  userName = docenteMatch.nombre;
                  userRole = "Profesor";
                }
              } catch {
                const docentesFromStorage = getDocentesFromStorage();
                const docenteMatch = docentesFromStorage.find((doc) => doc.correo === currentUser.email);
                if (docenteMatch) {
                  userId = docenteMatch.id;
                  userName = docenteMatch.nombre;
                  userRole = "Profesor";
                }
              }
            }

            setUser({
              id: userId,
              nombre: userName,
              email: currentUser.email,
              password: "",
              rol: userRole,
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
    const auth = await getFirebaseAuth();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.info('[browser] Firebase signInWithEmailAndPassword succeeded for', email);
      return { success: true };
    } catch (e) {
      const err = e as any;
      const code = err?.code ?? err?.message ?? "auth/error";
      const message = err?.message ?? String(err);

      const shouldTryAutoProvision =
        code === "auth/user-not-found" ||
        code === "auth/invalid-credential" ||
        (typeof code === "string" && code.toUpperCase().includes("INVALID_LOGIN_CREDENTIALS"));

      if (shouldTryAutoProvision) {
        const localUser = getUserByEmail(email);
        let stored = localUser;

        try {
          const firestoreUser = await getUserByEmailAsync(email);
          if (firestoreUser) {
            stored = firestoreUser;
          }
        } catch (e3) {
          console.error("Error fetching user during auto-provision:", e3);
        }

        if (stored && stored.password === password) {
          try {
            await createUserWithEmailAndPassword(auth, email, stored.password);
            await signInWithEmailAndPassword(auth, email, stored.password);
            console.info("Auto-provisioning succeeded for", email);
            return { success: true };
          } catch (e2) {
            const err2 = e2 as any;
            const code2 = err2?.code ?? err2?.message ?? "";
            if (code2 === "auth/email-already-in-use") {
              try {
                await signInWithEmailAndPassword(auth, email, stored.password);
                console.info("Auto-provisioning fallback sign-in succeeded for", email);
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

      console.error("Firebase login error:", code, message);
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
