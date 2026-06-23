"use client";

import { FormEvent, useState, useEffect } from "react";
import styles from "./CursosPanel.module.css";
import {
  Curso,
  Estudiante,
  getCursosFromStorage,
  getEstudiantesFromStorage,
  saveCursosToStorage,
  saveEstudiantesToStorage,
  getNewEstudiante,

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



interface CursosPanelProps {
  cursos?: Curso[];
  onCursosChange?: (cursos: Curso[]) => void;
}

export function CursosPanel({ cursos: cursosProp, onCursosChange }: CursosPanelProps) {
  const [internalCursos, setInternalCursos] = useState<Curso[]>([]);
  const cursos = cursosProp ?? internalCursos;
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  
  const [isLoaded, setIsLoaded] = useState(false);

  // Form states
  const [showAddEstudiante, setShowAddEstudiante] = useState(false);
  const initialEstudianteForm: Omit<Estudiante, "id"> = {
    nombre: "",
    rut: "",
    fechaNacimiento: "",
    correo: "",
    cursoId: cursos[0]?.id ?? "curso-1",
    grado: gradoOptions[0] ?? "5°",
  };

  const [estudianteForm, setEstudianteForm] = useState<Omit<Estudiante, "id">>(initialEstudianteForm);
  const [estudianteErrors, setEstudianteErrors] = useState<FormErrors>({});
  const [showEditEstudiante, setShowEditEstudiante] = useState(false);
  const [editEstudianteId, setEditEstudianteId] = useState<string | null>(null);
  const [editEstudianteForm, setEditEstudianteForm] = useState<Omit<Estudiante, "id">>(initialEstudianteForm);
  const [editEstudianteErrors, setEditEstudianteErrors] = useState<FormErrors>({});

  const [expandedCursos, setExpandedCursos] = useState<Set<string>>(new Set());
  

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
    

    if (!cursosProp) {
      setInternalCursos(cursosData);
    }
    setEstudiantes(estudiantesData);
    
    setIsLoaded(true);
  }, [cursosProp]);

  // Expandir todos los cursos cuando cambien
  useEffect(() => {
    if (cursos.length > 0) {
    }
  }, [cursos.length]);

  useEffect(() => {
    if (!isLoaded) return;
    saveCursosToStorage(cursos);
    saveEstudiantesToStorage(estudiantes);
  }, [cursos, estudiantes, isLoaded]);

  const generateEmail = (nombre: string): string => {
    if (!nombre.trim()) return "";

    const partes = nombre.trim().toLowerCase().split(/\s+/);
    if (partes.length === 0) return "";

    const primerNombre = partes[0];
    const apellido = partes.length > 1 ? partes[1] : "";

    const normalizarTexto = (texto: string) => {
      return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
    };

    const nombreNormalizado = normalizarTexto(primerNombre);
    const apellidoNormalizado = normalizarTexto(apellido);

    if (apellidoNormalizado) {
      return `${nombreNormalizado}.${apellidoNormalizado}@laurarobles.cl`;
    }
    return `${nombreNormalizado}@laurarobles.cl`;
  };

  const validateEstudianteForm = (form: typeof estudianteForm): FormErrors => {
    const errors: FormErrors = {};

    if (!form.nombre.trim()) {
      errors.nombre = "El nombre del estudiante es requerido.";
    }

    if (!form.rut.trim()) {
      errors.rut = "El RUT es requerido.";
    } else if (!validateRut(form.rut)) {
      errors.rut = "El RUT debe cumplir el formato 12.345.678-9.";
    }

    if (!form.fechaNacimiento) {
      errors.fechaNacimiento = "La fecha de nacimiento es requerida.";
    }

    if (!form.correo.trim()) {
      errors.correo = "El correo es requerido.";
    } else if (!validateEmail(form.correo)) {
      errors.correo = "El correo debe incluir el símbolo @.";
    }

    if (!form.cursoId) {
      errors.curso = "El curso es requerido.";
    }

    return errors;
  };

  const handleAddEstudiante = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validateEstudianteForm(estudianteForm);
    setEstudianteErrors(errors);
    if (Object.keys(errors).length === 0) {
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
      setEstudianteForm(initialEstudianteForm);
    }
  };

  const openEditEstudiante = (estudiante: Estudiante) => {
    setEditEstudianteId(estudiante.id);
    setEditEstudianteForm({
      nombre: estudiante.nombre,
      rut: estudiante.rut,
      fechaNacimiento: estudiante.fechaNacimiento,
      correo: estudiante.correo,
      cursoId: estudiante.cursoId,
      grado: estudiante.grado,
    });
    setEditEstudianteErrors({});
    setShowEditEstudiante(true);
  };

  const closeEditEstudiante = () => {
    setShowEditEstudiante(false);
    setEditEstudianteId(null);
    setEditEstudianteErrors({});
  };

  const handleUpdateEstudiante = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const errors = validateEstudianteForm(editEstudianteForm);
    setEditEstudianteErrors(errors);
    if (Object.keys(errors).length === 0 && editEstudianteId) {
      setEstudiantes((current) =>
        current.map((estudiante) =>
          estudiante.id === editEstudianteId
            ? {
                ...estudiante,
                nombre: editEstudianteForm.nombre,
                rut: editEstudianteForm.rut,
                fechaNacimiento: editEstudianteForm.fechaNacimiento,
                correo: editEstudianteForm.correo,
                cursoId: editEstudianteForm.cursoId,
                grado: editEstudianteForm.grado,
              }
            : estudiante
        )
      );
      closeEditEstudiante();
    }
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

  

  const deleteEstudiante = (estudianteId: string) => {
    setEstudiantes((current) => current.filter((e) => e.id !== estudianteId));
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
                  const nuevo = e.target.value;
                  if (/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]*$/.test(nuevo) || nuevo === "") {
                    const correoAutomatico = generateEmail(nuevo);
                    setEstudianteForm({ ...estudianteForm, nombre: nuevo, correo: correoAutomatico });
                    setEstudianteErrors((current) => ({ ...current, nombre: "", correo: "" }));
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
                readOnly
                className={styles.input}
                placeholder="correo@laurarobles.cl"
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
                                onClick={() => openEditEstudiante(estudiante)}
                              >
                                Editar
                              </button>
                              <button
                                className={styles.dangerButton}
                                onClick={() => deleteEstudiante(estudiante.id)}
                              >
                                Eliminar
                              </button>
                            </div>
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

      {showEditEstudiante && (
        <div className={styles.modalOverlay} onClick={closeEditEstudiante}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Editar Alumno</h3>
            <form onSubmit={handleUpdateEstudiante} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Nombre *</label>
                <input
                  type="text"
                  value={editEstudianteForm.nombre}
                  onChange={(e) => {
                    const nuevo = e.target.value;
                    if (/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]*$/.test(nuevo) || nuevo === "") {
                      setEditEstudianteForm((current) => ({ ...current, nombre: nuevo }));
                      setEditEstudianteErrors((current) => ({ ...current, nombre: "" }));
                    }
                  }}
                  className={styles.input}
                  placeholder="Ej: Juan Pérez"
                />
                {editEstudianteErrors.nombre && <span className={styles.error}>{editEstudianteErrors.nombre}</span>}
              </div>

              <div className={styles.formGroup}>
                <label>RUT * (Formato: 12.345.678-9)</label>
                <input
                  type="text"
                  placeholder="12.345.678-9"
                  value={editEstudianteForm.rut}
                  onChange={(e) => {
                    const rutFormateado = formatRut(e.target.value);
                    setEditEstudianteForm((current) => ({ ...current, rut: rutFormateado }));
                    setEditEstudianteErrors((current) => ({ ...current, rut: "" }));
                  }}
                  className={styles.input}
                  maxLength={12}
                />
                {editEstudianteErrors.rut && <span className={styles.error}>{editEstudianteErrors.rut}</span>}
              </div>

              <div className={styles.formGroup}>
                <label>Fecha de Nacimiento *</label>
                <input
                  type="date"
                  value={editEstudianteForm.fechaNacimiento}
                  onChange={(e) => {
                    setEditEstudianteForm((current) => ({ ...current, fechaNacimiento: e.target.value }));
                    setEditEstudianteErrors((current) => ({ ...current, fechaNacimiento: "" }));
                  }}
                  className={styles.input}
                />
                {editEstudianteErrors.fechaNacimiento && <span className={styles.error}>{editEstudianteErrors.fechaNacimiento}</span>}
              </div>

              <div className={styles.formGroup}>
                <label>Correo *</label>
                <input
                  type="email"
                  value={editEstudianteForm.correo}
                  readOnly
                  className={styles.input}
                  placeholder="correo@laurarobles.cl"
                />
                {editEstudianteErrors.correo && <span className={styles.error}>{editEstudianteErrors.correo}</span>}
              </div>

              <div className={styles.formGroup}>
                <label>Grado *</label>
                <select
                  value={editEstudianteForm.grado}
                  onChange={(e) => setEditEstudianteForm((current) => ({ ...current, grado: e.target.value as any }))}
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
                  value={editEstudianteForm.cursoId}
                  onChange={(e) => setEditEstudianteForm((current) => ({ ...current, cursoId: e.target.value }))}
                  className={styles.select}
                >
                  {cursos.map((curso) => (
                    <option key={curso.id} value={curso.id}>
                      {curso.nombre}
                    </option>
                  ))}
                </select>
                {editEstudianteErrors.curso && <span className={styles.error}>{editEstudianteErrors.curso}</span>}
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={styles.primaryButton}>
                  Guardar cambios
                </button>
                <button type="button" onClick={closeEditEstudiante} className={styles.secondaryButton}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
