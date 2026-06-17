"use client";

import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "../../context/AuthContext";
import styles from "./page.module.css";

export default function AdminSectionPage() {
  const router = useRouter();
  const { user, logout, isInitializing } = useContext(AuthContext);

  useEffect(() => {
    if (!isInitializing && !user) {
      router.replace("/loading");
    }
  }, [isInitializing, router, user]);

  if (isInitializing) {
    return (
      <main className={styles.container}>
        <section className={styles.card}>
          <p>Cargando sesión...</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className={styles.container}>
      <section className={styles.card}>
        <h1>Panel de Administrador</h1>
        <p>Bienvenido, {user.nombre}.</p>
        <p>Rol: {user.rol}</p>
        <button className={styles.logoutButton} onClick={() => {
          logout();
          router.replace("/loading");
        }}>
          Cerrar sesión
        </button>
      </section>
    </main>
  );
}
