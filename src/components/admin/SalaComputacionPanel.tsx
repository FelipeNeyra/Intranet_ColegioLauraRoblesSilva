"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./SalaComputacionPanel.module.css";
import {
  HorarioBloqueado,
  ReservaSala,
  getHorarioBloqueadoFromStorage,
  getReservaSalaFromStorage,
  getNewHorarioBloqueado,
  saveHorarioBloqueadoToStorage,
  saveReservaSalaToStorage,
} from "../../lib/adminData";

const timeSlots = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

const weekDays = [
  { key: "Lunes", label: "Lun" },
  { key: "Martes", label: "Mar" },
  { key: "Miércoles", label: "Mié" },
  { key: "Jueves", label: "Jue" },
  { key: "Viernes", label: "Vie" },
];

const getWeekDates = (baseDate: Date) => {
  const start = new Date(baseDate);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);

  return weekDays.map((_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
};

const getToday = (): string => new Date().toISOString().slice(0, 10);

export function SalaComputacionPanel() {
  const [reservas, setReservas] = useState<ReservaSala[]>([]);
  const [bloqueos, setBloqueos] = useState<HorarioBloqueado[]>([]);
  const [search, setSearch] = useState("");
  const [bloqueoForm, setBloqueoForm] = useState({ hora: timeSlots[0], motivo: "", fecha: getToday() });
  const [weekStart, setWeekStart] = useState<string>(getToday());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Carga inicial
    setReservas(getReservaSalaFromStorage());
    setBloqueos(getHorarioBloqueadoFromStorage());
    setIsLoaded(true);
  }, []);

  // Sincronización en tiempo real cada 2 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setReservas(getReservaSalaFromStorage());
      setBloqueos(getHorarioBloqueadoFromStorage());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    saveReservaSalaToStorage(reservas);
    saveHorarioBloqueadoToStorage(bloqueos);
  }, [reservas, bloqueos, isLoaded]);

  const weekDates = useMemo(() => getWeekDates(new Date(weekStart)), [weekStart]);

  const reservasPendientes = useMemo(
    () => reservas.filter((reserva) => reserva.estado === "Pendiente"),
    [reservas]
  );

  const reservasAprobadas = useMemo(
    () => reservas.filter((reserva) => reserva.estado === "Aprobada"),
    [reservas]
  );

  const reservasFiltradas = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? reservas.filter((reserva) =>
          [reserva.nombre, reserva.apellido, reserva.curso, reserva.correo, reserva.asignatura || ""].some((valor) =>
            valor.toLowerCase().includes(query)
          )
        )
      : reservas;
  }, [reservas, search]);

  const getReservasAprobadasByDate = (date: string) =>
    reservasAprobadas.filter((reserva) => reserva.fecha === date);

  const getBloqueosByDate = (date: string) =>
    bloqueos.filter((bloqueo) => bloqueo.fecha === date);

  const toggleBloqueo = (fecha: string, hora: string) => {
    const bloqueado = getBloqueosByDate(fecha).find((item) => item.hora === hora);

    if (bloqueado) {
      setBloqueos((current) => current.filter((item) => item.id !== bloqueado.id));
      return;
    }

    setBloqueos((current) => [
      ...current,
      getNewHorarioBloqueado({
        fecha,
        hora,
        motivo: "Bloqueado por administración",
      }),
    ]);
  };

  const eliminarBloqueo = (id: string) => {
    setBloqueos((current) => current.filter((item) => item.id !== id));
  };

  const updateReserva = (id: string, updates: Partial<ReservaSala>) => {
    setReservas((current) =>
      current.map((reserva) => (reserva.id === id ? { ...reserva, ...updates } : reserva))
    );
  };

  const eliminarReserva = (id: string) => {
    setReservas((current) => current.filter((reserva) => reserva.id !== id));
  };

  const agregarBloqueoManual = () => {
    if (!bloqueoForm.motivo.trim() || !bloqueoForm.fecha) {
      return;
    }

    setBloqueos((current) => [
      ...current,
      getNewHorarioBloqueado({
        fecha: bloqueoForm.fecha,
        hora: bloqueoForm.hora,
        motivo: bloqueoForm.motivo,
      }),
    ]);

    setBloqueoForm((current) => ({ ...current, motivo: "" }));
  };

  const goToPreviousWeek = () => {
    const current = new Date(weekStart);
    current.setDate(current.getDate() - 7);
    setWeekStart(current.toISOString().slice(0, 10));
  };

  const goToNextWeek = () => {
    const current = new Date(weekStart);
    current.setDate(current.getDate() + 7);
    setWeekStart(current.toISOString().slice(0, 10));
  };

  return (
    <section className={styles.panel}>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>Gestión</p>
          <h2>Sala de Computación</h2>
        </div>
        <div className={styles.weekControls}>
          <button type="button" className={styles.navButton} onClick={goToPreviousWeek}>
            ←
          </button>
          <button type="button" className={styles.navButton} onClick={goToNextWeek}>
            →
          </button>
        </div>
      </div>

      <div className={styles.toolbar}>
        <input
          type="search"
          placeholder="Buscar por docente, curso, asignatura o correo"
          className={styles.input}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <span className={styles.summaryBadge}>{reservasPendientes.length} pendientes</span>
      </div>

      <div className={styles.scheduleSection}>
        <div className={styles.scheduleHeader}>
          <h3>Vista semanal</h3>
          <span>{weekDates[0]} — {weekDates[weekDates.length - 1]}</span>
        </div>

        <div className={styles.blockFormCard}>
          <div className={styles.manualBlocker}>
            <label className={styles.blockField}>
              <span className={styles.blockLabel}>Fecha</span>
              <input
                type="date"
                value={bloqueoForm.fecha}
                onChange={(event) => setBloqueoForm((current) => ({ ...current, fecha: event.target.value }))}
                className={styles.input}
              />
            </label>
            <label className={styles.blockField}>
              <span className={styles.blockLabel}>Hora</span>
              <input
                type="time"
                value={bloqueoForm.hora}
                onChange={(event) => setBloqueoForm((current) => ({ ...current, hora: event.target.value }))}
                className={styles.input}
              />
            </label>
            <label className={styles.blockFieldWide}>
              <span className={styles.blockLabel}>Motivo</span>
              <input
                type="text"
                value={bloqueoForm.motivo}
                onChange={(event) => setBloqueoForm((current) => ({ ...current, motivo: event.target.value }))}
                placeholder="Ej. Mantenimiento, capacitación o revisión"
                className={styles.input}
              />
            </label>
            <button type="button" className={styles.approveButton} onClick={agregarBloqueoManual}>
              Agregar bloqueo
            </button>
          </div>
          <p className={styles.blockHint}>Selecciona el día, horario y escribe un motivo claro para que el bloqueo sea visible.</p>
        </div>

        <div className={styles.weekGrid}>
          <div className={styles.timeColumn}>
            <div className={styles.timeHeader}>Hora</div>
            {timeSlots.map((slot) => (
              <div key={slot} className={styles.timeCell}>{slot}</div>
            ))}
          </div>

          {weekDates.map((date) => {
            const dayLabel = weekDays[weekDates.indexOf(date)]?.label || "";
            const dayReservas = getReservasAprobadasByDate(date);
            const dayBloqueos = getBloqueosByDate(date);

            return (
              <div key={date} className={styles.dayColumn}>
                <div className={styles.dayHeader}>
                  <strong>{dayLabel}</strong>
                  <span>{date.slice(5)}</span>
                </div>
                {timeSlots.map((slot) => {
                  const reservaAprobada = dayReservas.find(
                    (item) => slot >= item.horaInicio && slot < item.horaFin && item.estado === "Aprobada"
                  );
                  const reservaPendiente = dayReservas.find(
                    (item) => slot >= item.horaInicio && slot < item.horaFin && item.estado === "Pendiente"
                  );
                  const bloqueo = dayBloqueos.find((item) => item.hora === slot);
                  const isBlocked = Boolean(bloqueo);
                  const isPending = Boolean(reservaPendiente);
                  const isOccupied = Boolean(reservaAprobada);

                  const slotClass = isBlocked
                    ? styles.slotBlocked
                    : isPending
                    ? styles.slotPending
                    : isOccupied
                    ? styles.slotOccupied
                    : styles.slotFree;

                  return (
                    <button
                      key={`${date}-${slot}`}
                      type="button"
                      className={`${styles.slotCard} ${slotClass}`}
                      onClick={() => toggleBloqueo(date, slot)}
                    >
                      {isBlocked ? (
                        <span>{bloqueo?.motivo}</span>
                      ) : isPending ? (
                        <span>{reservaPendiente?.curso || "Pendiente"}</span>
                      ) : isOccupied ? (
                        <span>{reservaAprobada?.curso}</span>
                      ) : (
                        <span>Disponible</span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.requestsSection}>
        <div className={styles.requestsHeader}>
          <h3>Bloqueos manuales</h3>
          <span>{bloqueos.length} registradas</span>
        </div>

        <div className={styles.blockList}>
          {bloqueos.map((bloqueo) => (
            <div key={bloqueo.id} className={styles.blockItem}>
              <div>
                <strong>{bloqueo.fecha} · {bloqueo.hora}</strong>
                <p>{bloqueo.motivo}</p>
              </div>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={() => eliminarBloqueo(bloqueo.id)}
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>

        <div className={styles.requestsHeader}>
          <h3>Solicitudes recibidas</h3>
          <span>{reservasFiltradas.length} registros</span>
        </div>

        <div className={styles.requestList}>
          {reservasFiltradas.map((reserva) => (
            <article key={reserva.id} className={styles.requestCard}>
              <div>
                <div className={styles.requestTop}>
                  <h4>
                    {reserva.nombre} {reserva.apellido}
                  </h4>
                  <span className={`${styles.statusBadge} ${styles[reserva.estado.toLowerCase()]}`}>
                    {reserva.estado}
                  </span>
                </div>
                <p>
                  <strong>Curso:</strong> {reserva.curso}
                </p>
                <p>
                  <strong>Asignatura:</strong> {reserva.asignatura || "Sin asignatura"}
                </p>
                <p>
                  <strong>Fecha:</strong> {reserva.fecha} · {reserva.horaInicio} a {reserva.horaFin}
                </p>
                <p>
                  <strong>Personas:</strong> {reserva.personas}
                </p>
                <p>
                  <strong>Correo:</strong> {reserva.correo}
                </p>
                <p>
                  <strong>Motivo:</strong> {reserva.motivo}
                </p>
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.approveButton}
                  onClick={() => updateReserva(reserva.id, { estado: "Aprobada" })}
                >
                  Aprobar
                </button>
                <button
                  type="button"
                  className={styles.rejectButton}
                  onClick={() => updateReserva(reserva.id, { estado: "Rechazada" })}
                >
                  Rechazar
                </button>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => eliminarReserva(reserva.id)}
                >
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
