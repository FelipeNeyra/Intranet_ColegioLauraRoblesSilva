"use client";

import { FormEvent, useState, useEffect } from "react";
import styles from "./CursosPanel.module.css";
import {
  Curso,
  Estudiante,
  Calificacion,
  getCursosFromStorage,
  getEstudiantesFromStorage,
  getCalificacionesFromStorage,
  saveCursosToStorage,
  saveEstudiantesToStorage,
  saveCalificacionesStorage,
  getNewEstudiante,
  getNewCalificacion,
  validateEmail,
  validateRut,
  formatRut,
  gradoOptions,
  seedInitialAdminData,
} from "../../lib/adminData";

interface FormErrors {
  nombre?: string;
  rut?: string;
  fechaNacimiento?: string;
  correo?: string;
  curso?: string;
}

interface CalificacionForm {
  asignatura: string;
  calificacion: number;
  descripcion: string;
}

interface CursosPanelProps {
  cursos?: Curso[];
  onCursosChange?: (cursos: Curso[]) => void;
}

export function CursosPanel({ cursos: cursosProp, onCursosChange }: CursosPanelProps) {
  const [internalCursos, setInternalCursos] = useState<Curso[]>([]);
  const cursos = cursosProp ?? internalCursos;
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Form states
  const [showAddEstudiante, setShowAddEstudiante] = useState(false);
  const [estudianteForm, setEstudianteForm] = useState({
    nombre: "",
    rut: "",
    fechaNacimiento: "",
    correo: "",
    cursoId: "curso-1",
    grado: "5°" as const,
  });
  const [estudianteErrors, setEstudianteErrors] = useState<FormErrors>({});

  const [expandedCursos, setExpandedCursos] = useState<Set<string>>(new Set());
  const [calificacionFormFor, setCalificacionFormFor] = useState<string | null>(null);
  const [calificacionForm, setCalificacionForm] = useState<CalificacionForm>({
    asignatura: "",
    calificacion: 6,
    descripcion: "",
  });

  const setCursos = (nextCursos: Curso[] | ((current: Curso[]) => Curso[])) => {
    if (typeof nextCursos === "function") {
      const updater = nextCursos as (current: Curso[]) => Curso[];
      const updatedCursos = updater(cursos);
      if (onCursosChange) {
        onCursosChange(updatedCursos);
      } else {
        setInternalCursos(updatedCursos);
      }
      return;
    }

    if (onCursosChange) {
      onCursosChange(nextCursos);
    } else {
      setInternalCursos(nextCursos);
    }
  };

  useEffect(() => {
    seedInitialAdminData();
    const cursosData = getCursosFromStorage();
    const estudiantesData = getEstudiantesFromStorage();
    const calificacionesData = getCalificacionesFromStorage();

    if (!cursosProp) {
      setInternalCursos(cursosData);
    }
    setEstudiantes(estudiantesData);
    setCalificaciones(calificacionesData);
    setIsLoaded(true);
  }, [cursosProp]);

  // Expandir todos los cursos cuando cambien
  useEffect(() => {
    if (cursos.length > 0) {
      // Comentado: ya no expandir automáticamente
      // const expandedSet = new Set(cursos.map((c) => c.id));
      // setExpandedCursos(expandedSet);
    }
  }, [cursos.length]);

  useEffect(() => {
    if (!isLoaded) return;
    saveCursosToStorage(cursos);
    saveEstudiantesToStorage(estudiantes);
    saveCalificacionesStorage(calificaciones);
  }, [cursos, estudiantes, calificaciones, isLoaded]);

  const validateEstudiante = (): boolean => {
    const errors: FormErrors = {};

    if (!estudianteForm.nombre.trim()) {
      errors.nombre = "El nombre del estudiante es requerido.";
    }

    if (!estudianteForm.rut.trim()) {
      errors.rut = "El RUT es requerido.";
    } else if (!validateRut(estudianteForm.rut)) {
      errors.rut = "El RUT debe cumplir el formato 12.345.678-9.";
    }

    if (!estudianteForm.fechaNacimiento) {
      errors.fechaNacimiento = "La fecha de nacimiento es requerida.";
    }

    if (!estudianteForm.correo.trim()) {
      errors.correo = "El correo es requerido.";
    } else if (!validateEmail(estudianteForm.correo)) {
      errors.correo = "El correo debe incluir el símbolo @.";
    }

    if (!estudianteForm.cursoId) {
      errors.curso = "El curso es requerido.";
    }

    setEstudianteErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddEstudiante = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateEstudiante()) return;

    const nuevoEstudiante = getNewEstudiante({
      nombre: estudianteForm.nombre,
      rut: estudianteForm.rut,
      fechaNacimiento: estudianteForm.fechaNacimiento,
      correo: estudianteForm.correo,
      grado: estudianteForm.grado,
      cursoId: estudianteForm.cursoId,
    });

    setEstudiantes([...estudiantes, nuevoEstudiante]);
    setShowAddEstudiante(false);
    setEstudianteForm({
      nombre: "",
      rut: "",
      fechaNacimiento: "",
      correo: "",
      cursoId: "curso-1",
      grado: "5°",
    });
  };

  const handleAddCalificacion = (e: FormEvent<HTMLFormElement>, estudianteId: string) => {
    e.preventDefault();

    if (!calificacionForm.asignatura.trim() || calificacionForm.calificacion < 1 || calificacionForm.calificacion > 7) {
      return;
    }

    const estudiante = estudiantes.find((e) => e.id === estudianteId);
    if (!estudiante) return;

    const nuevaCalificacion = getNewCalificacion({
      estudianteId,
      profesorId: "admin",
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

  const toggleCurso = (cursoId: string) => {
    const newSet = new Set(expandedCursos);
    if (newSet.has(cursoId)) {
      newSet.delete(cursoId);
    } else {
      newSet.add(cursoId);
    }
    setExpandedCursos(newSet);
  };

  const getEstudiantesByCurso = (cursoId: string) => estudiantes.filter((e) => e.cursoId === cursoId);

  const getCalificacionesByEstudiante = (estudianteId: string) =>
    calificaciones.filter((c) => c.estudianteId === estudianteId);

  const deleteEstudiante = (estudianteId: string) => {
    setEstudiantes((current) => current.filter((e) => e.id !== estudianteId));
    setCalificaciones((current) => current.filter((c) => c.estudianteId !== estudianteId));
  };

  return (
    <section className={styles.panel}>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>Gestión</p>
          <h2>Cursos y Alumnos</h2>
        </div>
      </div>

      <div className={styles.toolbar}>
        <button className={styles.primaryButton} onClick={() => setShowAddEstudiante(true)}>
          + Agregar Alumno
        </button>
      </div>

      {showAddEstudiante && (
        <div className={styles.formCard}>
          <h3>Nuevo Alumno</h3>
          <form onSubmit={handleAddEstudiante} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Nombre *</label>
              <input
                type="text"
                value={estudianteForm.nombre}
                onChange={(e) => {
                  if (/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]*$/.test(e.target.value) || e.target.value === "") {
                    setEstudianteForm({ ...estudianteForm, nombre: e.target.value });
                    setEstudianteErrors((current) => ({ ...current, nombre: "" }));
                  }
                }}
                className={styles.input}
                placeholder="Ej: Juan Pérez"
              />
              {estudianteErrors.nombre && <span className={styles.error}>{estudianteErrors.nombre}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>RUT * (Formato: 12.345.678-9)</label>
              <input
                type="text"
                placeholder="12.345.678-9"
                value={estudianteForm.rut}
                onChange={(e) => {
                  const rutFormateado = formatRut(e.target.value);
                  setEstudianteForm({ ...estudianteForm, rut: rutFormateado });
                  setEstudianteErrors((current) => ({ ...current, rut: "" }));
                }}
                className={styles.input}
                maxLength={12}
              />
              {estudianteErrors.rut && <span className={styles.error}>{estudianteErrors.rut}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Fecha de Nacimiento *</label>
              <input
                type="date"
                value={estudianteForm.fechaNacimiento}
                onChange={(e) => {
                  setEstudianteForm({ ...estudianteForm, fechaNacimiento: e.target.value });
                  setEstudianteErrors((current) => ({ ...current, fechaNacimiento: "" }));
                }}
                className={styles.input}
              />
              {estudianteErrors.fechaNacimiento && <span className={styles.error}>{estudianteErrors.fechaNacimiento}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Correo *</label>
              <input
                type="email"
                value={estudianteForm.correo}
                onChange={(e) => {
                  const correo = e.target.value;
                  if (/^[a-zA-Z0-9.@_-]*$/.test(correo) || correo === "") {
                    setEstudianteForm({ ...estudianteForm, correo: correo });
                    setEstudianteErrors((current) => ({ ...current, correo: "" }));
                  }
                }}
                className={styles.input}
                placeholder="Ej: juan.perez@laurarobles.cl"
              />
              {estudianteErrors.correo && <span className={styles.error}>{estudianteErrors.correo}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Grado *</label>
              <select
                value={estudianteForm.grado}
                onChange={(e) => setEstudianteForm({ ...estudianteForm, grado: e.target.value as any })}
                className={styles.select}
              >
                {gradoOptions.map((grado) => (
                  <option key={grado} value={grado}>
                    {grado}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Curso *</label>
              <select
                value={estudianteForm.cursoId}
                onChange={(e) => setEstudianteForm({ ...estudianteForm, cursoId: e.target.value })}
                className={styles.select}
              >
                {cursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.nombre}
                  </option>
                ))}
              </select>
              {estudianteErrors.curso && <span className={styles.error}>{estudianteErrors.curso}</span>}
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.primaryButton}>
                Guardar Alumno
              </button>
              <button type="button" onClick={() => setShowAddEstudiante(false)} className={styles.secondaryButton}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.cursosContainer}>
        {cursos.map((curso) => {
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

                        return (
                          <div key={estudiante.id} className={styles.estudianteCard}>
                            <div className={styles.estudianteInfo}>
                              <h4>{estudiante.nombre}</h4>
                              <p>RUT: {estudiante.rut}</p>
                              <p>Correo: {estudiante.correo}</p>
                              <p>Fecha Nacimiento: {estudiante.fechaNacimiento}</p>
                            </div>

                            <div className={styles.estudianteActions}>
                              <button
                                className={styles.actionButton}
                                onClick={() => setCalificacionFormFor(estudiante.id)}
                              >
                                Agregar Calificación
                              </button>
                              <button className={styles.actionButton}>Citar Apoderado</button>
                              <button
                                className={styles.dangerButton}
                                onClick={() => deleteEstudiante(estudiante.id)}
                              >
                                Eliminar
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
                                    onChange={(e) =>
                                      setCalificacionForm({ ...calificacionForm, asignatura: e.target.value })
                                    }
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
                                    Guardar Calificación
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

                            {calificacionesEst.length > 0 && (
                              <div className={styles.calificacionesList}>
                                <h5>Calificaciones</h5>
                                {calificacionesEst.map((cal) => (
                                  <div key={cal.id} className={styles.calificacionItem}>
                                    <p>
                                      <strong>{cal.asignatura}</strong>: {cal.calificacion} ({cal.fecha})
                                    </p>
                                    {cal.descripcion && <p>{cal.descripcion}</p>}
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
    </section>
  );
}
