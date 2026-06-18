"use client";

import { FormEvent, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "../../context/AuthContext";
import { SalaComputacionPanel } from "../../components/admin/SalaComputacionPanel";
import styles from "./page.module.css";
import {
  Curso,
  Docente,
  Estudiante,
  getCursosFromStorage,
  getDocentesFromStorage,
  getEstudiantesFromStorage,
  getNewCurso,
  getNewDocente,
  getNewEstudiante,
  saveCursosToStorage,
  saveDocentesToStorage,
  saveEstudiantesToStorage,
  seedInitialAdminData,
  validateEmail,
  validateRut,
  gradoOptions,
  nivelOptions,
} from "../../lib/adminData";
import { addUserAccount } from "../../lib/auth";

const sections = ["Cursos", "Estudiantes", "Docentes", "Sala de Computación"] as const;
type Section = (typeof sections)[number];

interface FormErrors {
  nombre?: string;
  nivel?: string;
  profesor?: string;
  grado?: string;
  rut?: string;
  fechaNacimiento?: string;
  correo?: string;
  materia?: string;
}

export default function AdminSectionPage() {
  const router = useRouter();
  const { user, logout, isInitializing } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState<Section>("Cursos");
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [cursoForm, setCursoForm] = useState({ nombre: "", nivel: "Básico" as const, profesor: "" });
  const [cursoErrors, setCursoErrors] = useState<FormErrors>({});

  const [estudianteForm, setEstudianteForm] = useState({
    nombre: "",
    grado: "Kinder" as const,
    rut: "",
    fechaNacimiento: "",
    correo: "",
  });
  const [estudianteErrors, setEstudianteErrors] = useState<FormErrors>({});

  const [docenteForm, setDocenteForm] = useState({
    nombre: "",
    materia: "",
    rut: "",
    fechaNacimiento: "",
    correo: "",
  });
  const [docenteErrors, setDocenteErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!isInitializing) {
      if (!user) {
        router.replace("/loading");
        return;
      }
      if (user.rol !== "Administrador") {
        if (user.rol === "Profesor") {
          router.replace("/profesor");
        } else {
          router.replace("/loading");
        }
      }
    }
  }, [isInitializing, router, user]);

  useEffect(() => {
    seedInitialAdminData();
    setCursos(getCursosFromStorage());
    setEstudiantes(getEstudiantesFromStorage());
    setDocentes(getDocentesFromStorage());
    setIsLoaded(true);
  }, []);

  // Notas y citas (admin view)
  const [notas, setNotas] = useState<any[]>([]);
  const [citas, setCitas] = useState<any[]>([]);
  const [visibleNotasFor, setVisibleNotasFor] = useState<string | null>(null);

  // Credenciales de profesor creado
  const [lastCreatedAccount, setLastCreatedAccount] = useState<{ email: string; password: string } | null>(null);

  useEffect(() => {
    // Lazy-load notas/citas if available
    try {
      // dynamic imports from adminData helpers
      const { getNotasFromStorage, getCitasFromStorage } = require("../../lib/adminData");
      setNotas(getNotasFromStorage());
      setCitas(getCitasFromStorage());
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("No hay notas o citas cargadas aún.", e);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    saveCursosToStorage(cursos);
  }, [cursos, isLoaded]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    saveEstudiantesToStorage(estudiantes);
  }, [estudiantes, isLoaded]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    saveDocentesToStorage(docentes);
  }, [docentes, isLoaded]);

  // persist notas and citas when they change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const { saveNotasToStorage, saveCitasToStorage } = require("../../lib/adminData");
      saveNotasToStorage(notas);
      saveCitasToStorage(citas);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("No se pudo guardar notas/citas.", e);
    }
  }, [notas, citas, isLoaded]);

  const validateCurso = (): boolean => {
    const errors: FormErrors = {};

    if (!cursoForm.nombre.trim()) {
      errors.nombre = "El nombre del curso es requerido.";
    }

    if (!cursoForm.nivel.trim()) {
      errors.nivel = "El nivel es requerido.";
    }

    if (!cursoForm.profesor.trim()) {
      errors.profesor = "El nombre del profesor es requerido.";
    }

    setCursoErrors(errors);
    return Object.keys(errors).length === 0;
  };

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

    if (!estudianteForm.fechaNacimiento.trim()) {
      errors.fechaNacimiento = "La fecha de nacimiento es requerida.";
    }

    if (!estudianteForm.correo.trim()) {
      errors.correo = "El correo es requerido.";
    } else if (!validateEmail(estudianteForm.correo)) {
      errors.correo = "El correo debe incluir el símbolo @.";
    }

    setEstudianteErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateDocente = (): boolean => {
    const errors: FormErrors = {};

    if (!docenteForm.nombre.trim()) {
      errors.nombre = "El nombre del docente es requerido.";
    }

    if (!docenteForm.materia.trim()) {
      errors.materia = "La materia es requerida.";
    }

    if (!docenteForm.rut.trim()) {
      errors.rut = "El RUT es requerido.";
    } else if (!validateRut(docenteForm.rut)) {
      errors.rut = "El RUT debe cumplir el formato 12.345.678-9.";
    }

    if (!docenteForm.fechaNacimiento.trim()) {
      errors.fechaNacimiento = "La fecha de nacimiento es requerida.";
    }

    if (!docenteForm.correo.trim()) {
      errors.correo = "El correo es requerido.";
    } else if (!validateEmail(docenteForm.correo)) {
      errors.correo = "El correo debe incluir el símbolo @.";
    }

    setDocenteErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDeleteCurso = (id: string) => {
    setCursos((current) => current.filter((curso) => curso.id !== id));
  };

  const handleDeleteEstudiante = (id: string) => {
    setEstudiantes((current) => current.filter((estudiante) => estudiante.id !== id));
  };

  const handleDeleteDocente = (id: string) => {
    setDocentes((current) => current.filter((docente) => docente.id !== id));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (activeSection === "Cursos") {
      if (!validateCurso()) {
        return;
      }
      setCursos((current) => [...current, getNewCurso({ ...cursoForm })]);
      setCursoForm({ nombre: "", nivel: "Básico" as const, profesor: "" });
      setCursoErrors({});
    }

    if (activeSection === "Estudiantes") {
      if (!validateEstudiante()) {
        return;
      }
      setEstudiantes((current) => [...current, getNewEstudiante({ ...estudianteForm })]);
      setEstudianteForm({
        nombre: "",
        grado: "Kinder" as const,
        rut: "",
        fechaNacimiento: "",
        correo: "",
      });
      setEstudianteErrors({});
    }

    if (activeSection === "Docentes") {
      if (!validateDocente()) {
        return;
      }

      const newDocente = getNewDocente({ ...docenteForm });
      setDocentes((current) => [...current, newDocente]);

      // Crear cuenta de usuario para el docente con contraseña genérica
      try {
        const result = addUserAccount({ nombre: newDocente.nombre, email: newDocente.correo, rol: "Profesor" });
        if ("error" in result) {
          // No interrumpimos la creación del docente en la lista, solo informamos
          // eslint-disable-next-line no-console
          console.warn("No se creó cuenta de usuario:", result.error);
        } else {
          // Mostrar la contraseña generada al administrador en un panel
          setLastCreatedAccount({ email: result.user.email, password: result.password });
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }

      setDocenteForm({
        nombre: "",
        materia: "",
        rut: "",
        fechaNacimiento: "",
        correo: "",
      });
      setDocenteErrors({});
    }
  };

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
        {lastCreatedAccount && (
          <div style={{ maxWidth: "1100px", margin: "0 auto 2rem", padding: "1.5rem", background: "#ecfdf5", border: "2px solid #10b981", borderRadius: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "1rem" }}>
              <div>
                <h3 style={{ margin: "0 0 0.5rem 0", color: "#059669" }}>✓ Profesor creado exitosamente</h3>
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong>Correo institucional:</strong> <code style={{ background: "white", padding: "0.25rem 0.5rem", borderRadius: "4px", fontFamily: "monospace" }}>{lastCreatedAccount.email}</code>
                </div>
                <div>
                  <strong>Contraseña temporal:</strong> <code style={{ background: "white", padding: "0.25rem 0.5rem", borderRadius: "4px", fontFamily: "monospace" }}>{lastCreatedAccount.password}</code>
                </div>
                <p style={{ margin: "0.75rem 0 0 0", fontSize: "0.85rem", color: "#047857" }}>Comparte estas credenciales con el profesor para que pueda acceder a la intranet.</p>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${lastCreatedAccount.email}\n${lastCreatedAccount.password}`);
                    // eslint-disable-next-line no-alert
                    alert("Credenciales copiadas al portapapeles");
                  }}
                  style={{ padding: "0.75rem 1rem", background: "#10b981", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
                >
                  Copiar
                </button>
                <button
                  onClick={() => setLastCreatedAccount(null)}
                  style={{ padding: "0.75rem 1rem", background: "transparent", color: "#059669", border: "1px solid #10b981", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
        <div className={styles.listCard}>
          {activeSection === "Sala de Computación" ? (
            <SalaComputacionPanel />
          ) : (
            <>
              <div className={styles.listHeader}>
                <h2>{activeSection}</h2>
                <p>Registros disponibles en el módulo seleccionado.</p>
              </div>

              <form className={styles.addForm} onSubmit={handleSubmit}>
                {activeSection === "Cursos" && (
                  <>
                    <div className={styles.inputRow}>
                      <label htmlFor="cursoNombre">Nombre de curso *</label>
                      <input
                        id="cursoNombre"
                        value={cursoForm.nombre}
                        onChange={(event) => {
                          setCursoForm((current) => ({ ...current, nombre: event.target.value }));
                          setCursoErrors((current) => ({ ...current, nombre: "" }));
                        }}
                        className={styles.input}
                        placeholder="Matemáticas 101"
                      />
                      {cursoErrors.nombre ? <span className={styles.error}>{cursoErrors.nombre}</span> : null}
                    </div>

                    <div className={styles.inputRow}>
                      <label htmlFor="cursoNivel">Nivel *</label>
                      <select
                        id="cursoNivel"
                        value={cursoForm.nivel}
                        onChange={(event) => {
                          setCursoForm((current) => ({ ...current, nivel: event.target.value as typeof cursoForm.nivel }));
                          setCursoErrors((current) => ({ ...current, nivel: "" }));
                        }}
                        className={styles.input}
                      >
                        {nivelOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {cursoErrors.nivel ? <span className={styles.error}>{cursoErrors.nivel}</span> : null}
                    </div>

                    <div className={styles.inputRow}>
                      <label htmlFor="cursoProfesor">Profesor *</label>
                      <input
                        id="cursoProfesor"
                        value={cursoForm.profesor}
                        onChange={(event) => {
                          setCursoForm((current) => ({ ...current, profesor: event.target.value }));
                          setCursoErrors((current) => ({ ...current, profesor: "" }));
                        }}
                        className={styles.input}
                        placeholder="Carlos Ramírez"
                      />
                      {cursoErrors.profesor ? <span className={styles.error}>{cursoErrors.profesor}</span> : null}
                    </div>
                  </>
                )}

                {activeSection === "Estudiantes" && (
                  <>
                    <div className={styles.inputRow}>
                      <label htmlFor="estNombre">Nombre del estudiante *</label>
                      <input
                        id="estNombre"
                        value={estudianteForm.nombre}
                        onChange={(event) => {
                          setEstudianteForm((current) => ({ ...current, nombre: event.target.value }));
                          setEstudianteErrors((current) => ({ ...current, nombre: "" }));
                        }}
                        className={styles.input}
                        placeholder="Ana González"
                      />
                      {estudianteErrors.nombre ? <span className={styles.error}>{estudianteErrors.nombre}</span> : null}
                    </div>

                    <div className={styles.inputRow}>
                      <label htmlFor="estGrado">Grado *</label>
                      <select
                        id="estGrado"
                        value={estudianteForm.grado}
                        onChange={(event) => {
                          setEstudianteForm((current) => ({ ...current, grado: event.target.value as typeof estudianteForm.grado }));
                          setEstudianteErrors((current) => ({ ...current, grado: "" }));
                        }}
                        className={styles.input}
                      >
                        {gradoOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {estudianteErrors.grado ? <span className={styles.error}>{estudianteErrors.grado}</span> : null}
                    </div>

                    <div className={styles.inputRow}>
                      <label htmlFor="estRut">RUT * (Formato: 12.345.678-9)</label>
                      <input
                        id="estRut"
                        value={estudianteForm.rut}
                        onChange={(event) => {
                          setEstudianteForm((current) => ({ ...current, rut: event.target.value }));
                          setEstudianteErrors((current) => ({ ...current, rut: "" }));
                        }}
                        className={styles.input}
                        placeholder="12.345.678-9"
                      />
                      {estudianteErrors.rut ? <span className={styles.error}>{estudianteErrors.rut}</span> : null}
                    </div>

                    <div className={styles.inputRow}>
                      <label htmlFor="estFecha">Fecha de nacimiento *</label>
                      <input
                        id="estFecha"
                        type="date"
                        value={estudianteForm.fechaNacimiento}
                        onChange={(event) => {
                          setEstudianteForm((current) => ({ ...current, fechaNacimiento: event.target.value }));
                          setEstudianteErrors((current) => ({ ...current, fechaNacimiento: "" }));
                        }}
                        className={styles.input}
                      />
                      {estudianteErrors.fechaNacimiento ? <span className={styles.error}>{estudianteErrors.fechaNacimiento}</span> : null}
                    </div>

                    <div className={styles.inputRow}>
                      <label htmlFor="estCorreo">Correo *</label>
                      <input
                        id="estCorreo"
                        value={estudianteForm.correo}
                        onChange={(event) => {
                          setEstudianteForm((current) => ({ ...current, correo: event.target.value }));
                          setEstudianteErrors((current) => ({ ...current, correo: "" }));
                        }}
                        className={styles.input}
                        placeholder="ana.gonzalez@laurarobles.cl"
                      />
                      {estudianteErrors.correo ? <span className={styles.error}>{estudianteErrors.correo}</span> : null}
                    </div>
                  </>
                )}

                {activeSection === "Docentes" && (
                  <>
                    <div className={styles.inputRow}>
                      <label htmlFor="docNombre">Nombre del docente *</label>
                      <input
                        id="docNombre"
                        value={docenteForm.nombre}
                        onChange={(event) => {
                          setDocenteForm((current) => ({ ...current, nombre: event.target.value }));
                          setDocenteErrors((current) => ({ ...current, nombre: "" }));
                        }}
                        className={styles.input}
                        placeholder="Carlos Ramírez"
                      />
                      {docenteErrors.nombre ? <span className={styles.error}>{docenteErrors.nombre}</span> : null}
                    </div>

                    <div className={styles.inputRow}>
                      <label htmlFor="docMateria">Materia *</label>
                      <input
                        id="docMateria"
                        value={docenteForm.materia}
                        onChange={(event) => {
                          setDocenteForm((current) => ({ ...current, materia: event.target.value }));
                          setDocenteErrors((current) => ({ ...current, materia: "" }));
                        }}
                        className={styles.input}
                        placeholder="Matemáticas"
                      />
                      {docenteErrors.materia ? <span className={styles.error}>{docenteErrors.materia}</span> : null}
                    </div>

                    <div className={styles.inputRow}>
                      <label htmlFor="docRut">RUT * (Formato: 12.345.678-9)</label>
                      <input
                        id="docRut"
                        value={docenteForm.rut}
                        onChange={(event) => {
                          setDocenteForm((current) => ({ ...current, rut: event.target.value }));
                          setDocenteErrors((current) => ({ ...current, rut: "" }));
                        }}
                        className={styles.input}
                        placeholder="12.345.678-9"
                      />
                      {docenteErrors.rut ? <span className={styles.error}>{docenteErrors.rut}</span> : null}
                    </div>

                    <div className={styles.inputRow}>
                      <label htmlFor="docFecha">Fecha de nacimiento *</label>
                      <input
                        id="docFecha"
                        type="date"
                        value={docenteForm.fechaNacimiento}
                        onChange={(event) => {
                          setDocenteForm((current) => ({ ...current, fechaNacimiento: event.target.value }));
                          setDocenteErrors((current) => ({ ...current, fechaNacimiento: "" }));
                        }}
                        className={styles.input}
                      />
                      {docenteErrors.fechaNacimiento ? <span className={styles.error}>{docenteErrors.fechaNacimiento}</span> : null}
                    </div>

                    <div className={styles.inputRow}>
                      <label htmlFor="docCorreo">Correo *</label>
                      <input
                        id="docCorreo"
                        value={docenteForm.correo}
                        onChange={(event) => {
                          setDocenteForm((current) => ({ ...current, correo: event.target.value }));
                          setDocenteErrors((current) => ({ ...current, correo: "" }));
                        }}
                        className={styles.input}
                        placeholder="carlos.ramirez@laurarobles.cl"
                      />
                      {docenteErrors.correo ? <span className={styles.error}>{docenteErrors.correo}</span> : null}
                    </div>
                  </>
                )}

                <button type="submit" className={styles.actionButton}>
                  Agregar {activeSection.slice(0, -1)}
                </button>
              </form>

              <div className={styles.listContainer}>
                {activeSection === "Cursos" &&
                  cursos.map((curso) => (
                    <article key={curso.id} className={styles.listItem}>
                      <div>
                        <h3>{curso.nombre}</h3>
                        <p>Nivel: {curso.nivel}</p>
                        <p>Profesor: {curso.profesor}</p>
                      </div>
                      <button className={styles.deleteButton} onClick={() => handleDeleteCurso(curso.id)}>
                        Eliminar
                      </button>
                    </article>
                  ))}

                {activeSection === "Estudiantes" &&
                  estudiantes.map((estudiante) => (
                    <article key={estudiante.id} className={styles.listItem}>
                      <div>
                        <h3>{estudiante.nombre}</h3>
                        <p>Grado: {estudiante.grado}</p>
                        <p>RUT: {estudiante.rut}</p>
                        <p>Fecha de nacimiento: {new Date(estudiante.fechaNacimiento).toLocaleDateString("es-CL")}</p>
                        <p>Correo: {estudiante.correo}</p>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className={styles.deleteButton} onClick={() => handleDeleteEstudiante(estudiante.id)}>
                          Eliminar
                        </button>
                        <button className={styles.actionButton} onClick={() => setVisibleNotasFor(visibleNotasFor === estudiante.id ? null : estudiante.id)}>
                          Ver Notas
                        </button>
                      </div>

                      {visibleNotasFor === estudiante.id && (
                        <div style={{ marginTop: 8 }}>
                          <h4>Notas</h4>
                          {notas.filter((n) => n.estudianteId === estudiante.id).length === 0 ? (
                            <p>No hay notas para este alumno.</p>
                          ) : (
                            notas
                              .filter((n) => n.estudianteId === estudiante.id)
                              .map((n) => (
                                <article key={n.id} style={{ borderTop: "1px solid #eee", paddingTop: 8, marginTop: 8 }}>
                                  <div style={{ fontSize: 12, color: "#666" }}>{new Date(n.fecha).toLocaleString()}</div>
                                  <div>{n.texto}</div>
                                </article>
                              ))
                          )}
                        </div>
                      )}
                    </article>
                  ))}

                {/* Admin: listado de citas recibidas */}
                {activeSection === "Estudiantes" && (
                  <section style={{ marginTop: 16 }}>
                    <div className={styles.listHeader}>
                      <h2>Citas recibidas</h2>
                      <p>Solicitudes de citación agendadas por profesores.</p>
                    </div>
                    <div>
                      {citas.length === 0 ? (
                        <p>No hay citas registradas.</p>
                      ) : (
                        citas.map((c) => {
                          const estudiante = estudiantes.find((s) => s.id === c.estudianteId);
                          const docente = docentes.find((d) => d.id === c.profesorId);
                          return (
                            <article key={c.id} className={styles.listItem} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <div><strong>Alumno:</strong> {estudiante ? estudiante.nombre : c.estudianteId}</div>
                                <div><strong>Profesor:</strong> {docente ? docente.nombre : c.profesorId}</div>
                                <div><strong>Fecha:</strong> {c.fecha} {c.hora}</div>
                                <div><strong>Motivo:</strong> {c.motivo}</div>
                                <div><strong>Estado:</strong> {c.estado}</div>
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={() => {
                                  setCitas((cur) => cur.map((item) => item.id === c.id ? { ...item, estado: "Agendada" } : item));
                                }}>Aprobar</button>
                                <button onClick={() => {
                                  setCitas((cur) => cur.map((item) => item.id === c.id ? { ...item, estado: "Cancelada" } : item));
                                }}>Rechazar</button>
                                <button onClick={() => {
                                  setCitas((cur) => cur.map((item) => item.id === c.id ? { ...item, estado: "Completada" } : item));
                                }}>Marcar Completada</button>
                              </div>
                            </article>
                          );
                        })
                      )}
                    </div>
                  </section>
                )}

                {activeSection === "Docentes" &&
                  docentes.map((docente) => (
                    <article key={docente.id} className={styles.listItem}>
                      <div>
                        <h3>{docente.nombre}</h3>
                        <p>Materia: {docente.materia}</p>
                        <p>RUT: {docente.rut}</p>
                        <p>Fecha de nacimiento: {new Date(docente.fechaNacimiento).toLocaleDateString("es-CL")}</p>
                        <p>Correo: {docente.correo}</p>
                      </div>
                      <button className={styles.deleteButton} onClick={() => handleDeleteDocente(docente.id)}>
                        Eliminar
                      </button>
                    </article>
                  ))}
              </div>
            </>
          )}
        </div>
      </main>

      <footer className={styles.footer}>
        <p>Intranet - Colegio Laura Robles Silva - Sección de Administradores</p>
      </footer>
    </div>
  );
}
