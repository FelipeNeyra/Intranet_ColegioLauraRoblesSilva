"use client";

import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "../../context/AuthContext";

export default function AdminSectionPage() {
  const router = useRouter();
  const { user, isInitializing } = useContext(AuthContext);

  useEffect(() => {
    if (!isInitializing) {
      if (!user || user.rol !== "Administrador") {
        router.replace("/loading");
        return;
      }

      const encodedName = encodeURIComponent(user.nombre || "");
      router.replace(`/admin_section/${encodedName}`);
    }
  }, [isInitializing, router, user]);

  return (
    <main style={{ padding: 24 }}>
      <p>Redirigiendo al panel de administración...</p>
    </main>
  );
}
