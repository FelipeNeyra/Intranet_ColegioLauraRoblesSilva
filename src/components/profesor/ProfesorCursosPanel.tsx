"use client";

import { FormEvent, useState, useEffect } from "react";
import styles from "./ProfesorCursosPanel.module.css";
import {
  Curso,
  Estudiante,
  Calificacion,
  Cita,
  getCursosFromStorage,
  getEstudiantesFromStorage,
  getCalificacionesFromStorage,
  getCitasFromStorage,
  saveCalificacionesStorage,
  saveCitasToStorage,
  getNewCalificacion,
  getNewCita,
} from "../../lib/adminData";

interface CalificacionForm {
  asignatura: string;
  calificacion: number;
  descripcion: string;
}

interface CitaForm {
  fecha: string;
  hora: string;
  motivo: string;
}

export function ProfesorCursosPanel({ profesorId }: { profesorId: string }) {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [expandedCursos, setExpandedCursos] = useState<Set<string>>(new Set());
  const [calificacionFormFor, setCalificacionFormFor] = useState<string | null>(null);
  const [citaFormFor, setCitaFormFor] = useState<string | null>(null);

  const [calificacionForm, setCalificacionForm] = useState<CalificacionForm>({
    asignatura: "",
    calificacion: 6,
    descripcion: "",
  });

  const [citaForm, setCitaForm] = useState<CitaForm>({
    fecha: "",
    hora: "",
    motivo: "",
  });

  useEffect(() => {
    setCursos(getCursosFromStorage());
    setEstudiantes(getEstudiantesFromStorage());
    setCalificaciones(getCalificacionesFromStorage());
    setCitas(getCitasFromStorage());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    saveCalificacionesStorage(calificaciones);
  }, [calificaciones, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveCitasToStorage(citas);
  }, [citas, isLoaded]);

  const handleAddCalificacion = (e: FormEvent<HTMLFormElement>, estudianteId: string) => {
    e.preventDefault();

    if (!calificacionForm.asignatura.trim() || calificacionForm.calificacion < 1 || calificacionForm.calificacion > 7) {
      return;
    }

    const estudiante = estudiantes.find((e) => e.id === estudianteId);
    if (!estudiante) return;

    const nuevaCalificacion = getNewCalificacion({
      estudianteId,
      profesorId,
      cursoId: estudiante.cursoId,
      asignatura: calificacionForm.asignatura,
      calificacion: calificacionForm.calificacion,
      fecha: new Date().toISOString().slice(0, 10),
      descripcion: calificacionForm.descripcion,
    });

    setCalificaciones([...calificaciones, nuevaCalificacion]);
    setCalificacionFormFor(null);
    setCalificacionForm({
      asignatura: "",
      calificacion: 6,
      descripcion: "",
    });
  };

  const handleAddCita = (e: FormEvent<HTMLFormElement>, estudianteId: string) => {
    e.preventDefault();

    if (!citaForm.fecha || !citaForm.hora || !citaForm.motivo.trim()) {
      return;
    }

    const estudiante = estudiantes.find((e) => e.id === estudianteId);
    if (!estudiante) return;

    const nuevaCita = getNewCita({
      estudianteId,
      profesorId,
      fecha: citaForm.fecha,
      hora: citaForm.hora,
      motivo: citaForm.motivo,
      estado: "Agendada",
    });

    setCitas([...citas, nuevaCita]);
    setCitaFormFor(null);
    setCitaForm({
      fecha: "",
      hora: "",
      motivo: "",
    });
  };

  const toggleCurso = (cursoId: string) => {
    const newSet = new Set(expandedCursos);
    if (newSet.has(cursoId)) {
      newSet.delete(cursoId);
    } else {
      newSet.add(cursoId);
    }
    setExpandedCursos(newSet);
  };

  // Obtener los cursos del profesor
  const cursosDelProfesor = cursos.filter((c) => c.profesorId === profesorId);

  const getEstudiantesByCurso = (cursoId: string) => estudiantes.filter((e) => e.cursoId === cursoId);

  const getCalificacionesByEstudiante = (estudianteId: string) =>
    calificaciones.filter((c) => c.estudianteId === estudianteId);

  const getCitasByEstudiante = (estudianteId: string) => citas.filter((c) => c.estudianteId === estudianteId);

  return (
    <section className={styles.panel}>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>Gestión</p>
          <h2>Mis Cursos y Alumnos</h2>
        </div>
      </div>

      {cursosDelProfesor.length === 0 ? (
        <p className={styles.empty}>No tienes cursos asignados.</p>
      ) : (
        <div className={styles.cursosContainer}>
          {cursosDelProfesor.map((curso) => {
            const estudiantosCurso = getEstudiantesByCurso(curso.id);
            const isExpanded = expandedCursos.has(curso.id);

            return (
              <div key={curso.id} className={styles.cursoCard}>
                <button className={styles.cursoHeader} onClick={() => toggleCurso(curso.id)}>
                  <h3>{curso.nombre}</h3>
                  <span className={styles.badge}>{estudiantosCurso.length} alumnos</span>
                  <span className={styles.toggle}>{isExpanded ? "▼" : "▶"}</span>
                </button>

                {isExpanded && (
                  <div className={styles.cursoContent}>
                    {estudiantosCurso.length === 0 ? (
                      <p className={styles.empty}>No hay alumnos en este curso.</p>
                    ) : (
                      <div className={styles.estudiantes}>
                        {estudiantosCurso.map((estudiante) => {
                          const calificacionesEst = getCalificacionesByEstudiante(estudiante.id);
                          const citasEst = getCitasByEstudiante(estudiante.id);

                          return (
                            <div key={estudiante.id} className={styles.estudianteCard}>
                              <div className={styles.estudianteInfo}>
                                <h4>{estudiante.nombre}</h4>
                                <p>RUT: {estudiante.rut}</p>
                                <p>Correo: {estudiante.correo}</p>
                              </div>

                              <div className={styles.estudianteActions}>
                                <button
                                  className={styles.actionButton}
                                  onClick={() => setCalificacionFormFor(estudiante.id)}
                                >
                                  + Calificación
                                </button>
                                <button
                                  className={styles.actionButton}
                                  onClick={() => setCitaFormFor(estudiante.id)}
                                >
                                  + Citar Apoderado
                                </button>
                              </div>

                              {calificacionFormFor === estudiante.id && (
                                <form
                                  onSubmit={(e) => handleAddCalificacion(e, estudiante.id)}
                                  className={styles.calificacionForm}
                                >
                                  <div className={styles.formGroup}>
                                    <label>Asignatura *</label>
                                    <input
                                      type="text"
                                      value={calificacionForm.asignatura}
                                      onChange={(e) => {
                                        if (/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]*$/.test(e.target.value) || e.target.value === "") {
                                          setCalificacionForm({ ...calificacionForm, asignatura: e.target.value });
                                        }
                                      }}
                                      placeholder="Ej: Matemática"
                                      className={styles.input}
                                    />
                                  </div>

                                  <div className={styles.formGroup}>
                                    <label>Calificación (1-7) *</label>
                                    <input
                                      type="number"
                                      min="1"
                                      max="7"
                                      step="0.1"
                                      value={calificacionForm.calificacion}
                                      onChange={(e) =>
                                        setCalificacionForm({
                                          ...calificacionForm,
                                          calificacion: parseFloat(e.target.value),
                                        })
                                      }
                                      className={styles.input}
                                    />
                                  </div>

                                  <div className={styles.formGroup}>
                                    <label>Descripción</label>
                                    <textarea
                                      value={calificacionForm.descripcion}
                                      onChange={(e) =>
                                        setCalificacionForm({ ...calificacionForm, descripcion: e.target.value })
                                      }
                                      placeholder="Comentarios (opcional)"
                                      className={styles.textarea}
                                    />
                                  </div>

                                  <div className={styles.formActions}>
                                    <button type="submit" className={styles.primaryButton}>
                                      Guardar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setCalificacionFormFor(null)}
                                      className={styles.secondaryButton}
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </form>
                              )}

                              {citaFormFor === estudiante.id && (
                                <form
                                  onSubmit={(e) => handleAddCita(e, estudiante.id)}
                                  className={styles.citaForm}
                                >
                                  <div className={styles.formGroup}>
                                    <label>Fecha *</label>
                                    <input
                                      type="date"
                                      value={citaForm.fecha}
                                      onChange={(e) => setCitaForm({ ...citaForm, fecha: e.target.value })}
                                      className={styles.input}
                                    />
                                  </div>

                                  <div className={styles.formGroup}>
                                    <label>Hora *</label>
                                    <input
                                      type="time"
                                      value={citaForm.hora}
                                      onChange={(e) => setCitaForm({ ...citaForm, hora: e.target.value })}
                                      className={styles.input}
                                    />
                                  </div>

                                  <div className={styles.formGroup}>
                                    <label>Motivo *</label>
                                    <textarea
                                      value={citaForm.motivo}
                                      onChange={(e) => setCitaForm({ ...citaForm, motivo: e.target.value })}
                                      placeholder="Motivo de la cita"
                                      className={styles.textarea}
                                    />
                                  </div>

                                  <div className={styles.formActions}>
                                    <button type="submit" className={styles.primaryButton}>
                                      Agendar Cita
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setCitaFormFor(null)}
                                      className={styles.secondaryButton}
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </form>
                              )}

                              {calificacionesEst.length > 0 && (
                                <div className={styles.calificacionesList}>
                                  <h5>Calificaciones ({calificacionesEst.length})</h5>
                                  {calificacionesEst.map((cal) => (
                                    <div key={cal.id} className={styles.calificacionItem}>
                                      <p>
                                        <strong>{cal.asignatura}</strong>: {cal.calificacion} ({cal.fecha})
                                      </p>
                                      {cal.descripcion && <p className={styles.description}>{cal.descripcion}</p>}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {citasEst.length > 0 && (
                                <div className={styles.citasList}>
                                  <h5>Citas Agendadas ({citasEst.length})</h5>
                                  {citasEst.map((cita) => (
                                    <div key={cita.id} className={styles.citaItem}>
                                      <p>
                                        <strong>{cita.fecha} a las {cita.hora}</strong> - {cita.estado}
                                      </p>
                                      <p className={styles.description}>{cita.motivo}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
