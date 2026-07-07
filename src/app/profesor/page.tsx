"use client";

import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "../../context/AuthContext";

export default function ProfesorRootPage() {
  const router = useRouter();
  const { user, firebaseUser, isInitializing } = useContext(AuthContext);

  useEffect(() => {
    if (!isInitializing) {
      if (!firebaseUser) {
        router.replace("/loading");
        return;
      }

      if (!user || user.rol !== "Profesor") {
        router.replace("/loading");
        return;
      }

      const encodedName = encodeURIComponent(user.nombre || "");
      router.replace(`/profesor/${encodedName}`);
    }
  }, [isInitializing, router, user, firebaseUser]);

  return (
    <main style={{ padding: 24 }}>
      <p>Redirigiendo al panel del profesor...</p>
    </main>
  );
}
