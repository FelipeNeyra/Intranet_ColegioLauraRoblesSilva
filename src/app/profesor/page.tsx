"use client";

import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "../../context/AuthContext";

export default function ProfesorRootPage() {
  const router = useRouter();
  const { user, isInitializing } = useContext(AuthContext);

  useEffect(() => {
    if (!isInitializing) {
      if (!user || user.rol !== "Profesor") {
        router.replace("/loading");
        return;
      }

      const encodedName = encodeURIComponent(user.nombre || "");
      router.replace(`/profesor/${encodedName}`);
    }
  }, [isInitializing, router, user]);

  return (
    <main style={{ padding: 24 }}>
      <p>Redirigiendo al panel del profesor...</p>
    </main>
  );
}
