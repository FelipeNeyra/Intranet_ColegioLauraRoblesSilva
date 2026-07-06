"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./SalaComputacionPanel.module.css";
import {
  HorarioBloqueado,
  ReservaSala,
  getHorarioBloqueadoFromFirestore,
  getReservaSalaFromFirestore,
  getHorarioBloqueadoFromStorage,
  getReservaSalaFromStorage,
  addHorarioBloqueadoToFirestore,
  addReservaSalaToFirestore,
  updateReservaSalaInFirestore,
  deleteHorarioBloqueadoFromFirestore,
  deleteReservaSalaFromFirestore,
  getNewHorarioBloqueado,
  saveHorarioBloqueadoToStorage,
  saveReservaSalaToStorage,
} from "../../lib/adminData";

//Horas disponibles dentro del Calendario
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

//Días disponibles dentro del Calendario
const weekDays = [
  { key: "Lunes", label: "Lun" },
  { key: "Martes", label: "Mar" },
  { key: "Miércoles", label: "Mié" },
  { key: "Jueves", label: "Jue" },
  { key: "Viernes", label: "Vie" },
];

interface FormErrors {
  fecha?: string;
  hora?: string;
  motivo?: string;
}

const isDateTimePast = (date: string, time: string) => {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const slotDate = new Date(year, month - 1, day, hour, minute);
  return slotDate.getTime() < Date.now();
};

//Función para obtener los días de la semana presente
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

//Obtener el día actual en hora local
const getToday = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCurrentTime = (): string => {
  const now = new Date();
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
};

//Función principal
export function SalaComputacionPanel() {
  const [reservas, setReservas] = useState<ReservaSala[]>([]);
  const [bloqueos, setBloqueos] = useState<HorarioBloqueado[]>([]);
  const [search, setSearch] = useState("");
  const [bloqueoForm, setBloqueoForm] = useState({ hora: "", motivo: "", fecha: "" });
  const [bloqueoErrors, setBloqueoErrors] = useState<FormErrors>({});
  const [weekStart, setWeekStart] = useState<string>(getToday());
  const today = getToday();
  const currentTime = getCurrentTime();
  const [isLoaded, setIsLoaded] = useState(false);

  //Carga inicial de datos desde Firestore y fallback a localStorage
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
        console.error("Error cargando reservas y bloqueos desde Firestore:", error);
        setReservas(getReservaSalaFromStorage());
        setBloqueos(getHorarioBloqueadoFromStorage());
      } finally {
        setIsLoaded(true);
      }
    };

    void loadData();
  }, []);

  // Sincronización en tiempo real local para no perder cambios
  useEffect(() => {
    const interval = setInterval(() => {
      setReservas(getReservaSalaFromStorage());
      setBloqueos(getHorarioBloqueadoFromStorage());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  //Función para almacenar reservas al cambiar de sección o agregar una nueva reserva
  useEffect(() => {
    if (!isLoaded) return;
    saveReservaSalaToStorage(reservas);
    saveHorarioBloqueadoToStorage(bloqueos);
  }, [reservas, bloqueos, isLoaded]);


  //Constante para obtener los días de la semana presente
  const weekStartArreglado = new Date(weekStart)
  weekStartArreglado.setDate(weekStartArreglado.getDate() + 1);
  const weekDates = useMemo(() => getWeekDates(new Date(weekStartArreglado)), [weekStart]);

  //Verificación de estado de reservas registradas
  const reservasPendientes = useMemo(
    () => reservas.filter((reserva) => reserva.estado === "Pendiente"),
    [reservas]
  );

  //Constante para buscar reservas
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

  //Buscar y obtener reservas aprobadas
  const getReservasByDate = (date: string) =>
    reservas.filter((reserva) => reserva.fecha === date);

  //Buscar y obtener bloqueos
  const getBloqueosByDate = (date: string) =>
    bloqueos.filter((bloqueo) => bloqueo.fecha === date);

  //Función para registrar un bloqueo por administración
  const toggleBloqueo = (fecha: string, hora: string) => {
    if (isDateTimePast(fecha, hora)) {
      return;
    }

    const bloqueado = getBloqueosByDate(fecha).find((item) => item.hora === hora);

    //Verificar que el bloqueo no este registrado
    if (bloqueado) {
      setBloqueos((current) => current.filter((item) => item.id !== bloqueado.id));
      void deleteHorarioBloqueadoFromFirestore(bloqueado.id).catch((error) => {
        console.error("Error eliminando bloqueo de Firestore:", error);
      });
      return;
    }

    const nuevoBloqueo = getNewHorarioBloqueado({
      fecha,
      hora,
      motivo: "Bloqueado por administración",
    });

    setBloqueos((current) => [...current, nuevoBloqueo]);
    void addHorarioBloqueadoToFirestore(nuevoBloqueo).catch((error) => {
      console.error("Error guardando bloqueo en Firestore:", error);
    });
  };

  //Función para eliminar un bloqueo
  const eliminarBloqueo = (id: string) => {
    setBloqueos((current) => current.filter((item) => item.id !== id));
    void deleteHorarioBloqueadoFromFirestore(id).catch((error) => {
      console.error("Error eliminando bloqueo de Firestore:", error);
    });
  };

  //Función para actualizar una reserva
  const updateReserva = (id: string, updates: Partial<ReservaSala>) => {
    setReservas((current) =>
      current.map((reserva) => (reserva.id === id ? { ...reserva, ...updates } : reserva))
    );
    void updateReservaSalaInFirestore(id, updates).catch((error) => {
      console.error("Error actualizando reserva en Firestore:", error);
    });
  };

  //Función para eliminar una reserva
  const eliminarReserva = (id: string) => {
    setReservas((current) => current.filter((reserva) => reserva.id !== id));
    void deleteReservaSalaFromFirestore(id).catch((error) => {
      console.error("Error eliminando reserva de Firestore:", error);
    });
  };

  //Función para registrar un bloqueo de forma manual
  const agregarBloqueoManual = () => {
    const errors: FormErrors = {};

    if (!bloqueoForm.fecha) {
      errors.fecha = "La fecha es requerida.";
    }

    if (!bloqueoForm.hora) {
      errors.hora = "La hora es requerida.";
    }

    if (!bloqueoForm.motivo.trim()) {
      errors.motivo = "El motivo es requerido.";
    }

    if (Object.keys(errors).length > 0) {
      setBloqueoErrors(errors);
      return;
    }

    setBloqueoErrors({});
    setBloqueos((current) => [
      ...current,
      getNewHorarioBloqueado({
        fecha: bloqueoForm.fecha,
        hora: bloqueoForm.hora,
        motivo: bloqueoForm.motivo,
      }),
    ]);

    setBloqueoForm((current) => ({ ...current, fecha: "", hora: "", motivo: "" }));
  };

  //Función para avanzar a la siguiente semana
  const goToPreviousWeek = () => {
    const current = parseLocalDate(weekStart);
    current.setDate(current.getDate() - 7);
    setWeekStart(formatLocalDate(current));
  };

  //Función para avanzar a la semana anterior
  const goToNextWeek = () => {
    const current = parseLocalDate(weekStart);
    current.setDate(current.getDate() + 7);
    setWeekStart(formatLocalDate(current));
  };

  //Sección HTML
  return (
    <section className={styles.panel}>
      {/*Título y botones para cambiar entre semanas */}
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

      {/*Barra de búsqueda para solicitudes*/}
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

      {/*Subtitulo de panel y rango de fechas*/}
      <div className={styles.scheduleSection}>
        <div className={styles.scheduleHeader}>
          <h3>Vista semanal</h3>
          <span>{weekDates[0]} — {weekDates[weekDates.length - 1]}</span>
        </div>

        {/*Panel para agregar un bloqueo de forma manual*/}
        <div className={styles.blockFormCard}>
          <div className={styles.manualBlocker}>
            <label className={styles.blockField}>
              <span className={styles.blockLabel}>Fecha</span>
              <input
                type="date"
                min={today}
                value={bloqueoForm.fecha}
                onChange={(event) => setBloqueoForm((current) => ({ ...current, fecha: event.target.value }))}
                className={styles.input}
              />
              {bloqueoErrors.fecha ? <span className={styles.fieldError}>{bloqueoErrors.fecha}</span> : null}
            </label>

            <label className={styles.blockField}>
              <span className={styles.blockLabel}>Hora</span>
              <input
                type="time"
                min={bloqueoForm.fecha === today ? currentTime : "00:00"}
                value={bloqueoForm.hora}
                onChange={(event) => setBloqueoForm((current) => ({ ...current, hora: event.target.value }))}
                className={styles.input}
              />
              {bloqueoErrors.hora ? <span className={styles.fieldError}>{bloqueoErrors.hora}</span> : null}
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
              {bloqueoErrors.motivo ? <span className={styles.fieldError}>{bloqueoErrors.motivo}</span> : null}
            </label>
            <button type="button" className={styles.approveButton} onClick={agregarBloqueoManual}>
              Agregar bloqueo
            </button>
          </div>
          <p className={styles.blockHint}>Selecciona el día, horario y escribe un motivo claro para que el bloqueo sea visible.</p>
        </div>

        {/*Panel para agregar un bloqueo de forma manual*/}
        <div className={styles.weekGrid}>
          <div className={styles.timeColumn}>
            <div className={styles.timeHeader}>Hora</div>
            {timeSlots.map((slot) => (
              <div key={slot} className={styles.timeCell}>{slot}</div>
            ))}
          </div>

          {weekDates.map((date) => {
            const dayLabel = weekDays[weekDates.indexOf(date)]?.label || "";
            const dayReservas = getReservasByDate(date);
            const dayBloqueos = getBloqueosByDate(date);

            return (
              //Gráficar fila de días
              <div key={date} className={styles.dayColumn}>
                <div className={styles.dayHeader}>
                  <strong>{dayLabel}</strong>
                  <span>{date.slice(5)}</span>
                </div>
                {/*Gráficar columna de horas disponibles*/}
                {timeSlots.map((slot) => {
                  //Verificar si hay reservas aprobadas y bloqueos
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
                  const isPastSlot = !isBlocked && !isPending && !isOccupied && isDateTimePast(date, slot);

                  //Estilo gráfico de los cuadros de horario 
                  const slotClass = isBlocked
                    ? styles.slotBlocked
                    : isPending
                    ? styles.slotPending
                    : isOccupied
                    ? styles.slotOccupied
                    : isPastSlot
                    ? styles.slotPast
                    : styles.slotFree;

                  //Función para reservar un horario al hacer click en el
                  return (
                    <button
                      key={`${date}-${slot}`}
                      type="button"
                      disabled={isPastSlot}
                      className={`${styles.slotCard} ${slotClass}`}
                      onClick={() => toggleBloqueo(date, slot)}
                    >
                      {isBlocked ? (
                        <span>{bloqueo?.motivo}</span>
                      ) : isPending ? (
                        <span>{reservaPendiente?.curso || "Pendiente"}</span>
                      ) : isOccupied ? (
                        <span>{reservaAprobada?.curso}</span>
                      ) : isPastSlot ? (
                        <span>Pasado</span>
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

      {/*Apartado para mostrar la lista de bloqueos y reservas solicitadas*/}
      <div className={styles.requestsSection}>
        <div className={styles.requestsHeader}>
          <h3>Bloqueos manuales</h3>
          <span>{bloqueos.length} registradas</span>
        </div>

        {/*Lista de Bloqueos*/}
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

        {/*Lista de Solicitudes*/}
        <div className={styles.requestsHeader}>
          <h3>Solicitudes recibidas</h3>
          <span>{reservasFiltradas.length} registros</span>
        </div>

        <div className={styles.requestList}>
          {reservasFiltradas.map((reserva) => (
            <article key={reserva.id} className={styles.requestCard}>
              {/*Lista de Datos de Reserva*/}
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

              {/*Lista de Botones de Acción*/}
              <div className={styles.actions}>
                {reserva.estado === "Pendiente" && (
                  <>
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
                  </>
                )}
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
