"use client";

import { FormEvent, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "../../context/AuthContext";
import { SalaComputacionPanel } from "../../components/admin/SalaComputacionPanel";
import { CursosPanel } from "../../components/admin/CursosPanel";
import styles from "./page.module.css";
import {
  Curso,
  Docente,
  Estudiante,
  getCursosFromStorage,
  getDocentesFromStorage,
  getEstudiantesFromStorage,
  getNewDocente,
  getNewCurso,
  saveCursosToStorage,
  saveDocentesToStorage,
  seedInitialAdminData,
  validateEmail,
  validateRut,
} from "../../lib/adminData";
import { addUserAccount } from "../../lib/auth";

const sections = ["Cursos", "Docentes", "Sala de Computación"] as const;
type Section = (typeof sections)[number];

interface FormErrors {
  nombre?: string;
  rut?: string;
  fechaNacimiento?: string;
  correo?: string;
}

export default function AdminSectionPage() {
  const router = useRouter();
  const { user, logout, isInitializing } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState<Section>("Cursos");
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Form for creating new courses
  const [showAddCurso, setShowAddCurso] = useState(false);
  const [cursoForm, setCursoForm] = useState({
    nombre: "",
  });

  // Form for docentes
  const [docenteForm, setDocenteForm] = useState({
    nombre: "",
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
    setDocentes(getDocentesFromStorage());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    saveCursosToStorage(cursos);
  }, [cursos, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveDocentesToStorage(docentes);
  }, [docentes, isLoaded]);

  // Credenciales de profesor creado
  const [lastCreatedAccount, setLastCreatedAccount] = useState<{ email: string; password: string } | null>(null);

  const validateDocente = (): boolean => {
    const errors: FormErrors = {};

    if (!docenteForm.nombre.trim()) {
      errors.nombre = "El nombre del docente es requerido.";
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

  const handleDeleteDocente = (id: string) => {
    setDocentes((current) => current.filter((docente) => docente.id !== id));
  };

  const handleAssignCurso = (docenteId: string, cursoId: string) => {
    setDocentes((current) =>
      current.map((docente) =>
        docente.id === docenteId ? { ...docente, cursoId } : docente
      )
    );
  };

  const handleAddCurso = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!cursoForm.nombre.trim()) {
      return;
    }

    const newCurso = getNewCurso({
      nombre: cursoForm.nombre,
      profesorId: "",
    });

    setCursos((current) => [...current, newCurso]);
    setCursoForm({ nombre: "" });
    setShowAddCurso(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

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
          {activeSection === "Cursos" ? (
            <>
              <CursosPanel />
              
              <div style={{ maxWidth: "1100px", margin: "2rem auto 0" }}>
                <div style={{ padding: "2rem", background: "white", borderRadius: "24px", boxShadow: "0 24px 60px rgba(15, 23, 42, 0.08)" }}>
                  <h3 style={{ marginBottom: "1.5rem", color: "#db353d", fontFamily: "'League Spartan', sans-serif", fontSize: "1.5rem" }}>Crear Nuevo Curso</h3>
                  
                  {!showAddCurso ? (
                    <button
                      onClick={() => setShowAddCurso(true)}
                      className={styles.actionButton}
                    >
                      + Agregar Curso
                    </button>
                  ) : (
                    <form onSubmit={handleAddCurso} className={styles.addForm}>
                      <div className={styles.inputRow}>
                        <label htmlFor="cursoNombre">Nombre del Curso *</label>
                        <input
                          id="cursoNombre"
                          type="text"
                          value={cursoForm.nombre}
                          onChange={(e) => setCursoForm({ nombre: e.target.value })}
                          placeholder="Ej: 8°C"
                          className={styles.input}
                        />
                      </div>
                      <div style={{ display: "flex", gap: "0.75rem" }}>
                        <button
                          type="submit"
                          className={styles.actionButton}
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddCurso(false)}
                          className={styles.secondaryButton}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}

                  {cursos.length > 0 && (
                    <div style={{ marginTop: "1.5rem" }}>
                      <h4 style={{ marginBottom: "1rem", color: "#475569", fontSize: "1rem" }}>Cursos disponibles:</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                        {cursos.map((curso) => (
                          <div key={curso.id} style={{ padding: "1rem", background: "#f7f5f4", borderRadius: "8px", border: "1px solid #d4d4d4" }}>
                            <p style={{ fontWeight: "600", marginBottom: "0.5rem", color: "#1f2937" }}>{curso.nombre}</p>
                            <p style={{ fontSize: "0.85rem", color: "#666" }}>
                              Profesor: {docentes.find((d) => d.id === curso.profesorId)?.nombre || "No asignado"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : activeSection === "Sala de Computación" ? (
            <SalaComputacionPanel />
          ) : (
            <>
              <div className={styles.listHeader}>
                <h2>{activeSection}</h2>
                <p>Registros disponibles en el módulo seleccionado.</p>
              </div>

              <form className={styles.addForm} onSubmit={handleSubmit}>
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
                {activeSection === "Docentes" &&
                  docentes.map((docente) => (
                    <article key={docente.id} className={styles.listItem}>
                      <div>
                        <h3>{docente.nombre}</h3>
                        <p>RUT: {docente.rut}</p>
                        <p>Fecha de nacimiento: {new Date(docente.fechaNacimiento).toLocaleDateString("es-CL")}</p>
                        <p>Correo: {docente.correo}</p>
                        {docente.cursoId && (
                          <p style={{ fontWeight: "600", color: "#db353d" }}>
                            Curso: {cursos.find((c) => c.id === docente.cursoId)?.nombre || "No encontrado"}
                          </p>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "0.75rem", flexDirection: "column" }}>
                        <div>
                          <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "600", color: "#475569" }}>
                            Asignar Curso:
                          </label>
                          <select
                            value={docente.cursoId || ""}
                            onChange={(e) => handleAssignCurso(docente.id, e.target.value)}
                            className={styles.input}
                          >
                            <option value="">-- Seleccionar --</option>
                            {cursos.map((curso) => (
                              <option key={curso.id} value={curso.id}>
                                {curso.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button className={styles.deleteButton} onClick={() => handleDeleteDocente(docente.id)}>
                          Eliminar
                        </button>
                      </div>
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
