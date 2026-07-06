"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./ProfesorReservaPanel.module.css";
import {
  HorarioBloqueado,
  ReservaSala,
  asignaturaOptions,
  cursoNiveles,
  getDocentesFromFirestore,
  getNewReservaSala,
  letrasCurso,
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

const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getWeekDates = (baseDate: Date | string) => {
  const start = typeof baseDate === "string" ? parseLocalDate(baseDate) : new Date(baseDate);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);

  return weekDays.map((_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return formatLocalDate(date);
  });
};

const isDateTimePast = (date: string, time: string) => {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const slotDate = new Date(year, month - 1, day, hour, minute);
  return slotDate.getTime() < Date.now();
};

const getToday = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

interface ProfesorReservaPanelProps {
  userName: string;
  userEmail: string;
  profesorId: string;
  reservas: ReservaSala[];
  bloqueos: HorarioBloqueado[];
  onReservaCreada: (reserva: ReservaSala) => void;
}

export function ProfesorReservaPanel({
  userName,
  userEmail,
  profesorId,
  reservas,
  bloqueos,
  onReservaCreada,
}: ProfesorReservaPanelProps) {
  const [docentes, setDocentes] = useState<any[]>([]);
  const [weekStart, setWeekStart] = useState<string>(getToday());
  const [selectedSlot, setSelectedSlot] = useState<{ fecha: string; hora: string } | null>(null);
  const [curso, setCurso] = useState("");
  const [letraCurso, setLetraCurso] = useState("");
  const [asignatura, setAsignatura] = useState("");
  const [personas, setPersonas] = useState("");
  const [motivo, setMotivo] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const weekStartArreglado = new Date(weekStart)
  weekStartArreglado.setDate(weekStartArreglado.getDate() + 1);
  const weekDates = useMemo(() => getWeekDates(new Date(weekStartArreglado)), [weekStart]);
  useEffect(() => {
    (async () => {
      try {
        const docs = await getDocentesFromFirestore();
        setDocentes(docs);
      } catch (e) {
        console.error("Error cargando docentes desde Firestore:", e);
        setDocentes([]);
      }
    })();
  }, []);

  const docenteActual = docentes.find((docente) => docente.id === profesorId);
  const asignaturasDisponibles = docenteActual?.asignaturas?.length
    ? docenteActual.asignaturas
    : asignaturaOptions;

  const getReservasByDate = (date: string) =>
    reservas.filter((reserva) => reserva.fecha === date);

  const getBloqueosByDate = (date: string) =>
    bloqueos.filter((bloqueo) => bloqueo.fecha === date);

  const goToPreviousWeek = () => {
    const current = parseLocalDate(weekStart);
    current.setDate(current.getDate() - 7);
    setWeekStart(formatLocalDate(current));
  };

  const goToNextWeek = () => {
    const current = parseLocalDate(weekStart);
    current.setDate(current.getDate() + 7);
    setWeekStart(formatLocalDate(current));
  };

  const handleSlotClick = (fecha: string, hora: string) => {
    const dayReservas = getReservasByDate(fecha);
    const dayBloqueos = getBloqueosByDate(fecha);

    const isBlocked = dayBloqueos.some((bloqueo) => bloqueo.hora === hora);
    const isOccupied = dayReservas.some((reserva) => hora >= reserva.horaInicio && hora < reserva.horaFin);

    const isPastSlot = !isBlocked && !isOccupied && isDateTimePast(fecha, hora);

    if (isPastSlot) {
      return;
    }

    if (!isBlocked && !isOccupied) {
      setSelectedSlot({ fecha, hora });
      setCurso("");
      setLetraCurso("");
      setAsignatura("");
      setPersonas("");
      setMotivo("");
      setStatusMessage("");
    }
  };

  const handleCrearReserva = () => {
    if (!selectedSlot || !curso.trim() || !letraCurso.trim() || !asignatura.trim() || !personas.trim() || !motivo.trim()) {
      return;
    }

    if (!/^\d+$/.test(personas.trim())) {
      setStatusMessage("Ingrese una cantidad válida de personas.");
      return;
    }

    if (selectedSlot && isDateTimePast(selectedSlot.fecha, selectedSlot.hora)) {
      setStatusMessage("No se puede reservar un horario que ya pasó.");
      return;
    }

    const horaFin = String(parseInt(selectedSlot.hora) + 1).padStart(2, "0") + ":00";
    const cursoCompleto = `${curso.trim()} ${letraCurso.trim()}`;

    const nuevaReserva = getNewReservaSala({
      nombre: userName.split(" ")[0],
      apellido: userName.split(" ").slice(1).join(" ") || "",
      rut: "",
      correo: userEmail,
      fecha: selectedSlot.fecha,
      horaInicio: selectedSlot.hora,
      horaFin,
      curso: cursoCompleto,
      asignatura: asignatura.trim(),
      personas: personas.trim(),
      motivo: motivo.trim(),
      estado: "Pendiente",
    });

    onReservaCreada(nuevaReserva);
    setSelectedSlot(null);
    setCurso("");
    setLetraCurso("");
    setAsignatura("");
    setPersonas("");
    setMotivo("");
    setStatusMessage(
      "Solicitud guardada. Queda en estado Pendiente y el administrador podrá aprobar o rechazar la reserva."
    );
  };

  return (
    <section className={styles.panel}>
      <div className={styles.headerRow}>
        <div>
          <h3>Reserva de Sala de Computación</h3>
          <p>Selecciona un horario disponible haciendo clic en las celdas verdes.</p>
          {statusMessage && <p className={styles.statusMessage}>{statusMessage}</p>}
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

      <div className={styles.scheduleSection}>
        <div className={styles.scheduleHeader}>
          <h4>Vista semanal</h4>
          <span>{weekDates[0]} — {weekDates[weekDates.length - 1]}</span>
        </div>

        <div className={styles.legendRow}>
          <div className={styles.legendItem}>
            <span className={`${styles.legendBox} ${styles.available}`}></span>
            <span>Disponible</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendBox} ${styles.pending}`}></span>
            <span>Pendiente</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendBox} ${styles.blocked}`}></span>
            <span>Bloqueado</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendBox} ${styles.occupied}`}></span>
            <span>Aprobado</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendBox} ${styles.past}`}></span>
            <span>Pasado</span>
          </div>
        </div>

        <div className={styles.weekGrid}>
          <div className={styles.timeColumn}>
            <div className={styles.timeHeader}>Hora</div>
            {timeSlots.map((slot) => (
              <div key={slot} className={styles.timeCell}>
                {slot}
              </div>
            ))}
          </div>

          {weekDates.map((date) => {
            const dayName = new Date(date).toLocaleDateString("es-CL", { weekday: "long" });
            const dayLabel = weekDays[weekDates.indexOf(date)]?.label || "";
            const dayReservas = getReservasByDate(date);
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
                  const isOccupied = Boolean(reservaAprobada) || isPending;
                  const isPastSlot = !isBlocked && !isOccupied && isDateTimePast(date, slot);
                  const isSelected = selectedSlot?.fecha === date && selectedSlot?.hora === slot;
                  const slotClass = isBlocked
                    ? styles.slotBlocked
                    : isPending
                    ? styles.slotPending
                    : isOccupied
                    ? styles.slotOccupied
                    : isPastSlot
                    ? styles.slotPast
                    : styles.slotFree;

                  const slotLabel = isBlocked
                    ? "Bloqueado"
                    : isPending
                    ? "Pendiente"
                    : isOccupied
                    ? "Ocupado"
                    : isPastSlot
                    ? "Pasado"
                    : "Libre";

                  return (
                    <button
                      key={`${date}-${slot}`}
                      type="button"
                      className={`${styles.slotCard} ${slotClass} ${isSelected ? styles.slotSelected : ""}`}
                      onClick={() => handleSlotClick(date, slot)}
                      disabled={isBlocked || isOccupied || isPastSlot}
                    >
                      {slotLabel}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {selectedSlot && (
        <div className={styles.modalOverlay} onClick={() => setSelectedSlot(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h4>Detalles de la Reserva</h4>
            <p className={styles.selectedSlotInfo}>
              <strong>{selectedSlot.fecha}</strong> • <strong>{selectedSlot.hora}</strong>
            </p>

            {selectedSlot && isDateTimePast(selectedSlot.fecha, selectedSlot.hora) && (
              <p className={styles.error} style={{ marginBottom: "1rem" }}>Este horario ya ha pasado y no puede reservarse.</p>
            )}

            <div className={styles.formRow}>
              <select
                value={curso}
                onChange={(e) => setCurso(e.target.value)}
                className={styles.input}
              >
                <option value="">Selecciona un curso</option>
                {cursoNiveles.map((nivel) => (
                  <option key={nivel} value={nivel}>
                    {nivel}
                  </option>
                ))}
              </select>
              <select
                value={letraCurso}
                onChange={(e) => setLetraCurso(e.target.value)}
                className={styles.input}
              >
                <option value="">Selecciona una letra</option>
                {letrasCurso.map((letra) => (
                  <option key={letra} value={letra}>
                    {letra}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formRow}>
              <select
                value={asignatura}
                onChange={(e) => setAsignatura(e.target.value)}
                className={styles.input}
              >
                <option value="">Selecciona una asignatura</option>
                {asignaturasDisponibles.map((asignaturaDisponible) => (
                  <option key={asignaturaDisponible} value={asignaturaDisponible}>
                    {asignaturaDisponible}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formRow}>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Cantidad de personas"
                value={personas}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^\d*$/.test(v)) setPersonas(v);
                }}
                onPaste={(e) => {
                  const text = e.clipboardData.getData("text");
                  if (!/^\d+$/.test(text)) e.preventDefault();
                }}
                className={styles.input}
              />
            </div>

            <textarea
              placeholder="Motivo de la reserva"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className={styles.textareaField}
            />

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={handleCrearReserva}
                className={styles.confirmButton}
                  disabled={!curso.trim() || !letraCurso.trim() || !asignatura.trim() || !personas.trim() || !motivo.trim() || (selectedSlot && isDateTimePast(selectedSlot.fecha, selectedSlot.hora))}
              >
                Confirmar Reserva
              </button>
              <button
                type="button"
                onClick={() => setSelectedSlot(null)}
                className={styles.cancelButton}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
