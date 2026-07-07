"use client";

import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "../../context/AuthContext";

export default function AdminSectionPage() {
  const router = useRouter();
  const { user, firebaseUser, isInitializing } = useContext(AuthContext);

  useEffect(() => {
    if (!isInitializing) {
      if (!firebaseUser) {
        router.replace("/loading");
        return;
      }

      if (!user || user.rol !== "Administrador") {
        if (user?.rol === "Profesor") {
          router.replace(`/profesor/${encodeURIComponent(user.nombre || "")}`);
        } else {
          router.replace("/loading");
        }
        return;
      }

      const encodedName = encodeURIComponent(user.nombre || "");
      router.replace(`/admin_section/${encodedName}`);
    }
  }, [isInitializing, router, user, firebaseUser]);

  return (
    <main style={{ padding: 24 }}>
      <p>Redirigiendo al panel de administración...</p>
    </main>
  );
}
