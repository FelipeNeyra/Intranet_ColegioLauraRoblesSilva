"use client";

import { useContext, useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { AuthContext } from "../../context/AuthContext";
import { ProfesorReservaPanel } from "../../components/profesor/ProfesorReservaPanel";
import {
  Estudiante,
  ReservaSala,
  HorarioBloqueado,
  getEstudiantesFromStorage,
  Nota,
  Cita,
  getNotasFromStorage,
  saveNotasToStorage,
  getNewNota,
  getCitasFromStorage,
  saveCitasToStorage,
  getNewCita,
  getReservaSalaFromStorage,
  saveReservaSalaToStorage,
  getHorarioBloqueadoFromStorage,
} from "../../lib/adminData";

export default function ProfesorPage() {
  const router = useRouter();
  const { user, isInitializing, logout } = useContext(AuthContext);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [openNoteFor, setOpenNoteFor] = useState<string | null>(null);
  const [openCitaFor, setOpenCitaFor] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [citaFecha, setCitaFecha] = useState("");
  const [citaHora, setCitaHora] = useState("");
  const [citaMotivo, setCitaMotivo] = useState("");
  const [reservas, setReservas] = useState<ReservaSala[]>([]);
  const [bloqueos, setBloqueos] = useState<HorarioBloqueado[]>([]);

  useEffect(() => {
    if (!isInitializing) {
      if (!user || user.rol !== "Profesor") {
        router.replace("/loading");
      }
    }
  }, [isInitializing, user, router]);

  useEffect(() => {
    setEstudiantes(getEstudiantesFromStorage());
    setNotas(getNotasFromStorage());
    setCitas(getCitasFromStorage());
    setReservas(getReservaSalaFromStorage());
    setBloqueos(getHorarioBloqueadoFromStorage());
  }, []);

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
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.sectionHeader}>
            <h2>Alumnos, Notas y Citas</h2>
            <p>Gestiona notas de alumnos y cita apoderados.</p>
          </div>

          {estudiantes.length === 0 ? (
            <p>No hay alumnos registrados.</p>
          ) : (
            <div className={styles.listContainer}>
              {estudiantes.map((est) => (
                <article key={est.id} className={styles.listItem}>
                  <div className={styles.listItemHeader}>
                    <div className={styles.listItemInfo}>
                      <h3>{est.nombre}</h3>
                      <p>Grado: {est.grado}</p>
                      <p>Correo: {est.correo}</p>
                    </div>
                    <div className={styles.buttonGroup}>
                      <button
                        className={styles.actionButton}
                        onClick={() => {
                          setOpenNoteFor(est.id);
                          setNoteText("");
                        }}
                      >
                        Agregar Nota
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => {
                          setOpenCitaFor(est.id);
                          setCitaFecha("");
                          setCitaHora("");
                          setCitaMotivo("");
                        }}
                      >
                        Citar Apoderado
                      </button>
                    </div>
                  </div>

                  {openNoteFor === est.id && (
                    <form
                      onSubmit={(e: FormEvent<HTMLFormElement>) => {
                        e.preventDefault();
                        if (!noteText.trim()) return;
                        const nueva = getNewNota({
                          estudianteId: est.id,
                          profesorId: user.id,
                          fecha: new Date().toISOString(),
                          texto: noteText.trim(),
                        });
                        const updated = [...notas, nueva];
                        setNotas(updated);
                        saveNotasToStorage(updated);
                        setOpenNoteFor(null);
                      }}
                      className={styles.formContainer}
                    >
                      <textarea
                        className={styles.textareaField}
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Escribe la nota aquí"
                      />
                      <div className={styles.formActions}>
                        <button type="submit" className={styles.actionButton}>
                          Guardar Nota
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenNoteFor(null)}
                          className={styles.secondaryButton}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}

                  {openCitaFor === est.id && (
                    <form
                      onSubmit={(e: FormEvent<HTMLFormElement>) => {
                        e.preventDefault();
                        if (!citaFecha || !citaHora || !citaMotivo.trim()) return;
                        const nuevaCita = getNewCita({
                          estudianteId: est.id,
                          profesorId: user.id,
                          fecha: citaFecha,
                          hora: citaHora,
                          motivo: citaMotivo.trim(),
                          estado: "Agendada",
                        });
                        const updated = [...citas, nuevaCita];
                        setCitas(updated);
                        saveCitasToStorage(updated);
                        setOpenCitaFor(null);
                      }}
                      className={styles.formContainer}
                    >
                      <div className={styles.formRow}>
                        <input
                          type="date"
                          value={citaFecha}
                          onChange={(e) => setCitaFecha(e.target.value)}
                          className={styles.input}
                        />
                        <input
                          type="time"
                          value={citaHora}
                          onChange={(e) => setCitaHora(e.target.value)}
                          className={styles.input}
                        />
                      </div>
                      <textarea
                        className={styles.textareaField}
                        value={citaMotivo}
                        onChange={(e) => setCitaMotivo(e.target.value)}
                        placeholder="Motivo de la cita"
                      />
                      <div className={styles.formActions}>
                        <button type="submit" className={styles.actionButton}>
                          Agendar Cita
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenCitaFor(null)}
                          className={styles.secondaryButton}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}

                  {notas.filter((n) => n.estudianteId === est.id).length > 0 && (
                    <div className={styles.notasContainer}>
                      <h4>Notas registradas</h4>
                      {notas
                        .filter((n) => n.estudianteId === est.id)
                        .map((n) => (
                          <div key={n.id} className={styles.notaItem}>
                            <div>{new Date(n.fecha).toLocaleString("es-CL")}</div>
                            <div>{n.texto}</div>
                          </div>
                        ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>

        <div className={styles.card} style={{ marginTop: "2rem" }}>
          <ProfesorReservaPanel
            userName={user?.nombre || "Profesor"}
            userEmail={user?.email || ""}
            reservas={reservas}
            bloqueos={bloqueos}
            onReservaCreada={(reserva) => {
              const updated = [...reservas, reserva];
              setReservas(updated);
              saveReservaSalaToStorage(updated);
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
      </main>

      <footer className={styles.footer}>
        <p>Intranet - Colegio Laura Robles Silva - Sección Profesores</p>
      </footer>
    </div>
  );
}
