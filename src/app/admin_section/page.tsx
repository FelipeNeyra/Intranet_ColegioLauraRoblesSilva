"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "../../context/AuthContext";
import styles from "./page.module.css";

const sections = ["Cursos", "Estudiantes", "Docentes"] as const;
type Section = (typeof sections)[number];

const sectionItems: Record<Section, string[]> = {
  Cursos: ["Matemáticas 101", "Historia General", "Programación Web"],
  Estudiantes: ["Ana González", "Pedro Soto", "Julieta Morales"],
  Docentes: ["Carlos Ramírez", "María Fuentes", "Diego Morales"],
};

export default function AdminSectionPage() {
  const router = useRouter();
  const { user, logout, isInitializing } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState<Section>("Cursos");

  useEffect(() => {
    if (!isInitializing && !user) {
      router.replace("/loading");
    }
  }, [isInitializing, router, user]);

  if (isInitializing) {
    return (
      <main className={styles.page}>
        <section className={styles.loadingCard}>
          <p>Cargando sesión...</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}>LR</span>
          <div>
            <h1>Panel de Administración</h1>
            <p>Bienvenido, {user.nombre}</p>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Navegación de administrador">
          {sections.map((section) => (
            <button
              key={section}
              type="button"
              className={`${styles.navLink} ${activeSection === section ? styles.activeLink : ""}`}
              onClick={() => setActiveSection(section)}
            >
              {section}
            </button>
          ))}
          <button
            type="button"
            className={`${styles.navLink} ${styles.logoutLink}`}
            onClick={() => {
              logout();
              router.replace("/loading");
            }}
          >
            Cerrar Sesión
          </button>
        </nav>
      </header>

      <main className={styles.main}>
        <div className={styles.listCard}>
          <div className={styles.listHeader}>
            <h2>{activeSection}</h2>
            <p>Registros disponibles en el módulo seleccionado.</p>
          </div>
          <div className={styles.listContainer}>
            {sectionItems[activeSection].map((item) => (
              <article key={item} className={styles.listItem}>
                {item}
              </article>
            ))}
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>Intranet - Colegio Laura Robles Silva - Sección de Administradores</p>
      </footer>
    </div>
  );
}
