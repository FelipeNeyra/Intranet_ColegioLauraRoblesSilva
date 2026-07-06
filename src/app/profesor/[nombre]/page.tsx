"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "../page.module.css";
import { AuthContext } from "../../../context/AuthContext";
import { ProfesorReservaPanel } from "../../../components/profesor/ProfesorReservaPanel";
import { ProfesorCursosPanel } from "../../../components/profesor/ProfesorCursosPanel";
import {
  ReservaSala,
  HorarioBloqueado,
  getReservaSalaFromFirestore,
  addReservaSalaToFirestore,
  getHorarioBloqueadoFromFirestore,
} from "../../../lib/adminData";

const sections = ["Mis Cursos", "Reserva de Salas"] as const;
type Section = (typeof sections)[number];

export default function ProfesorPage() {
  const router = useRouter();
  const params = useParams() as { nombre?: string | string[] };
  const rawNombre = Array.isArray(params.nombre) ? params.nombre.join(" ") : params.nombre;
  const routeNombre = rawNombre
    ? (() => {
        try {
          return decodeURIComponent(rawNombre);
        } catch {
          return String(rawNombre).replace(/%20/g, " ").replace(/\+/g, " ");
        }
      })()
    : rawNombre;
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
    if (!isInitializing && user) {
      if (routeNombre && routeNombre !== user.nombre) {
        router.replace(`/profesor/${encodeURIComponent(user.nombre)}`);
      }
    }
  }, [isInitializing, user, routeNombre, router]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [reservasFromFirestore, bloqueosFromFirestore] = await Promise.all([
          getReservaSalaFromFirestore(),
          getHorarioBloqueadoFromFirestore(),
        ]);
        setReservas(reservasFromFirestore);
        setBloqueos(bloqueosFromFirestore);
      } catch (error) {
        console.error("Error cargando reservas/bloqueos desde Firestore:", error);
        setReservas([]);
        setBloqueos([]);
      } finally {
        setIsLoaded(true);
      }
    };

    void loadData();
  }, []);

  // No localStorage persistence — rely on Firestore

  const reservasUsuario = useMemo(
    () => (user ? reservas.filter((r) => r.correo === user.email) : []),
    [reservas, user?.email]
  );
  const aprobadas = reservasUsuario.filter((r) => r.estado === "Aprobada").length;
  const rechazadas = reservasUsuario.filter((r) => r.estado === "Rechazada").length;
  const solicitudesConRespuesta = aprobadas + rechazadas;

  if (isInitializing) {
    return (
      <main style={{ padding: 24 }}>
        <p>Cargando sesión...</p>
      </main>
    );
  }

  if (!user || user.rol !== "Profesor") {
    return (
      <main style={{ padding: 24 }}>
        <p>Accediendo al panel del docente...</p>
      </main>
    );
  }

  // Evitar renderizado si el parámetro de ruta no coincide con el usuario autenticado
  if (routeNombre && user && routeNombre !== user.nombre) {
    return null;
  }

  const displayName = user.nombre;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}>P</span>
          <div>
            <h1>Intranet Profesor</h1>
            <p>Bienvenido, {displayName}</p>
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
            onClick={async () => {
              await logout();
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
              profesorId={user?.id || ""}
              reservas={reservas}
              bloqueos={bloqueos}
              onReservaCreada={async (reserva) => {
                const updated = [...reservas, reserva];
                setReservas(updated);
                try {
                  await addReservaSalaToFirestore(reserva);
                } catch (error) {
                  console.error("Error guardando reserva en Firestore:", error);
                }
              }}
            />
            <div className={styles.reservationSummary}>
              {reservasUsuario.length === 0 ? (
                <p style={{ color: "var(--texto-secundario)" }}>No hay reservas solicitadas.</p>
              ) : (
                <div className={styles.listContainer}>
                  {reservasUsuario.map((r) => (
                    <div key={r.id} className={styles.reservaItem}>
                      <div>
                        <strong>Fecha y horario:</strong> {r.fecha} • {r.horaInicio} a {r.horaFin}
                      </div>
                      <div>
                        <strong>Curso:</strong> {r.curso} | <strong>Asignatura:</strong> {r.asignatura || "Sin asignatura"}
                      </div>
                      <div>
                        <strong>Personas:</strong> {r.personas}
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
