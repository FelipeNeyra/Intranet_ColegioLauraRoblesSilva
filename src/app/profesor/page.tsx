"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { AuthContext } from "../../context/AuthContext";
import { ProfesorReservaPanel } from "../../components/profesor/ProfesorReservaPanel";
import { ProfesorCursosPanel } from "../../components/profesor/ProfesorCursosPanel";
import {
  ReservaSala,
  HorarioBloqueado,
  getReservaSalaFromStorage,
  saveReservaSalaToStorage,
  getHorarioBloqueadoFromStorage,
} from "../../lib/adminData";

const sections = ["Mis Cursos", "Reserva de Salas"] as const;
type Section = (typeof sections)[number];

export default function ProfesorPage() {
  const router = useRouter();
  const { user, isInitializing, logout } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState<Section>("Mis Cursos");
  const [reservas, setReservas] = useState<ReservaSala[]>([]);
  const [bloqueos, setBloqueos] = useState<HorarioBloqueado[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isInitializing) {
      if (!user || user.rol !== "Profesor") {
        router.replace("/loading");
      }
    }
  }, [isInitializing, user, router]);

  useEffect(() => {
    setReservas(getReservaSalaFromStorage());
    setBloqueos(getHorarioBloqueadoFromStorage());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    saveReservaSalaToStorage(reservas);
  }, [reservas, isLoaded]);

  // Sincronización en tiempo real para ver cambios del admin
  useEffect(() => {
    const interval = setInterval(() => {
      setReservas(getReservaSalaFromStorage());
      setBloqueos(getHorarioBloqueadoFromStorage());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (isInitializing) {
    return (
      <main style={{ padding: 24 }}>
        <p>Cargando sesión...</p>
      </main>
    );
  }

  if (!user || user.rol !== "Profesor") {
    return null;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}>P</span>
          <div>
            <h1>Intranet Profesor</h1>
            <p>Bienvenido, {user.nombre}</p>
          </div>
        </div>
        
        <nav className={styles.nav}>
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
        {activeSection === "Mis Cursos" ? (
          <ProfesorCursosPanel profesorId={user?.id || ""} />
        ) : (
          <div className={styles.card}>
            <ProfesorReservaPanel
              userName={user?.nombre || "Profesor"}
              userEmail={user?.email || ""}
              reservas={reservas}
              bloqueos={bloqueos}
              onReservaCreada={(reserva) => {
                const updated = [...reservas, reserva];
                setReservas(updated);
              }}
            />

            <div style={{ marginTop: "2rem" }}>
              <h3 style={{ color: "var(--color-rojo)", marginBottom: "1rem" }}>Mis solicitudes</h3>
              {reservas.filter((r) => r.correo === user?.email && r.estado !== "Rechazada").length === 0 ? (
                <p style={{ color: "var(--texto-secundario)" }}>No hay reservas solicitadas.</p>
              ) : (
                <div className={styles.listContainer}>
                  {reservas
                    .filter((r) => r.correo === user?.email && r.estado !== "Rechazada")
                    .map((r) => (
                      <div key={r.id} className={styles.reservaItem}>
                        <div>
                          <strong>Fecha y horario:</strong> {r.fecha} • {r.horaInicio} a {r.horaFin}
                        </div>
                        <div>
                          <strong>Curso:</strong> {r.curso} | <strong>Personas:</strong> {r.personas}
                        </div>
                        <div>
                          <strong>Estado:</strong>{" "}
                          <span
                            style={{
                              fontWeight: "700",
                              color:
                                r.estado === "Pendiente"
                                  ? "#f59e0b"
                                  : r.estado === "Aprobada"
                                    ? "#10b981"
                                    : "#ef4444",
                            }}
                          >
                            {r.estado}
                          </span>
                        </div>
                        <div>
                          <strong>Motivo:</strong> {r.motivo}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>Intranet - Colegio Laura Robles Silva - Sección Profesores</p>
      </footer>
    </div>
  );
}
