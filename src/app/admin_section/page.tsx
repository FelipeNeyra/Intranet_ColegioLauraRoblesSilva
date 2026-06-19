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
import { addUserAccount, deleteUserByEmail, generateUserId } from "../../lib/auth";

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

  // Modal para asignar curso a docente
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDocenteId, setSelectedDocenteId] = useState<string>("");

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

  // Función para formatear RUT automáticamente
  const formatRut = (value: string): string => {
    // Remover caracteres no numéricos excepto guion
    let rut = value.replace(/[^\d\-]/g, "");
    
    if (rut.length === 0) return "";
    
    // Si tiene guion, separar RUT del dígito verificador
    if (rut.includes("-")) {
      const [rutPart, dv] = rut.split("-");
      rut = rutPart + dv;
    }
    
    // Aplicar formato XX.XXX.XXX-X
    if (rut.length <= 1) return rut;
    if (rut.length <= 4) return rut.slice(0, -1) + "." + rut.slice(-1);
    if (rut.length <= 7) return rut.slice(0, -4) + "." + rut.slice(-4, -1) + "." + rut.slice(-1);
    
    return rut.slice(0, -7) + "." + rut.slice(-7, -4) + "." + rut.slice(-4, -1) + "-" + rut.slice(-1);
  };

  // Función para generar correo automáticamente desde el nombre
  const generateEmail = (nombre: string): string => {
    if (!nombre.trim()) return "";
    
    // Separar nombre y apellido (primeras dos palabras)
    const partes = nombre.trim().toLowerCase().split(/\s+/);
    if (partes.length === 0) return "";
    
    const primerNombre = partes[0];
    const apellido = partes.length > 1 ? partes[1] : "";
    
    // Remover caracteres especiales y acentos
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
    const docente = docentes.find((d) => d.id === id);
    if (docente) {
      // Eliminar cuenta de usuario
      deleteUserByEmail(docente.correo);
    }
    setDocentes((current) => current.filter((docente) => docente.id !== id));
  };

  const handleAssignCurso = (docenteId: string, cursoId: string) => {
    const docente = docentes.find((d) => d.id === docenteId);
    const oldCursoId = docente?.cursoId;

    // Actualizar docente con nuevo curso
    setDocentes((current) =>
      current.map((doc) =>
        doc.id === docenteId ? { ...doc, cursoId } : doc
      )
    );

    // Actualizar cursos: quitar profesor del curso anterior, asignar al nuevo
    setCursos((current) =>
      current.map((curso) => {
        if (curso.id === cursoId) {
          return { ...curso, profesorId: docenteId };
        } else if (curso.id === oldCursoId) {
          return { ...curso, profesorId: "" };
        }
        return curso;
      })
    );

    setShowAssignModal(false);
    setSelectedDocenteId("");
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

      // Generar un ID único que será usado tanto para el docente como para el usuario
      const userId = generateUserId();
      
      const newDocente = getNewDocente({ ...docenteForm }, userId);
      setDocentes((current) => [...current, newDocente]);

      // Crear cuenta de usuario para el docente con el mismo ID
      try {
        const result = addUserAccount({ nombre: newDocente.nombre, email: newDocente.correo, rol: "Profesor" }, userId);
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
                      <h4 style={{ marginBottom: "1rem", color: "var(--texto-secundario)", fontSize: "1rem" }}>Cursos disponibles:</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                        {cursos.map((curso) => (
                          <div key={curso.id} style={{ padding: "1rem", background: "var(--fondo-claro)", borderRadius: "8px", border: "1px solid var(--borde-claro)" }}>
                            <p style={{ fontWeight: "600", marginBottom: "0.5rem", color: "var(--texto-principal)" }}>{curso.nombre}</p>
                            <p style={{ fontSize: "0.85rem", color: "var(--texto-secundario)" }}>
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
                          const nombre = event.target.value;
                          // Solo permitir letras, números y espacios
                          if (/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]*$/.test(nombre) || nombre === "") {
                            const correoAutomatico = generateEmail(nombre);
                            setDocenteForm((current) => ({ 
                              ...current, 
                              nombre: nombre,
                              correo: correoAutomatico
                            }));
                            setDocenteErrors((current) => ({ ...current, nombre: "", correo: "" }));
                          }
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
                          const rutFormateado = formatRut(event.target.value);
                          setDocenteForm((current) => ({ ...current, rut: rutFormateado }));
                          setDocenteErrors((current) => ({ ...current, rut: "" }));
                        }}
                        className={styles.input}
                        placeholder="12.345.678-9"
                        maxLength={12}
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
                      <label htmlFor="docCorreo">Correo (Generado automáticamente) *</label>
                      <input
                        id="docCorreo"
                        value={docenteForm.correo}
                        onChange={(event) => {
                          setDocenteForm((current) => ({ ...current, correo: event.target.value }));
                          setDocenteErrors((current) => ({ ...current, correo: "" }));
                        }}
                        className={styles.input}
                        placeholder="carlos.ramirez@laurarobles.cl"
                        readOnly
                        style={{ backgroundColor: "var(--fondo-claro)", cursor: "not-allowed" }}
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
                          <p style={{ fontWeight: "600", color: "var(--color-rojo)" }}>
                            Curso: {cursos.find((c) => c.id === docente.cursoId)?.nombre || "No encontrado"}
                          </p>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "0.75rem", flexDirection: "column" }}>
                        <button
                          onClick={() => {
                            setSelectedDocenteId(docente.id);
                            setShowAssignModal(true);
                          }}
                          className={styles.actionButton}
                        >
                          Asignar Curso
                        </button>
                        <button className={styles.deleteButton} onClick={() => handleDeleteDocente(docente.id)}>
                          Eliminar
                        </button>
                      </div>
                    </article>
                  ))}
              </div>

              {showAssignModal && selectedDocenteId && (
                <div style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(0, 0, 0, 0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1000,
                }}>
                  <div style={{
                    background: "white",
                    borderRadius: "24px",
                    padding: "2rem",
                    maxWidth: "400px",
                    width: "90%",
                    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.15)",
                  }}>
                    <h3 style={{ marginBottom: "1rem", color: "var(--color-rojo)", fontFamily: "'League Spartan', sans-serif" }}>
                      Asignar Curso
                    </h3>
                    <p style={{ marginBottom: "1.5rem", color: "var(--texto-secundario)", fontSize: "0.95rem" }}>
                      Selecciona el curso para {docentes.find((d) => d.id === selectedDocenteId)?.nombre}:
                    </p>
                    <div style={{ display: "grid", gap: "0.75rem" }}>
                      {cursos.map((curso) => (
                        <button
                          key={curso.id}
                          onClick={() => handleAssignCurso(selectedDocenteId, curso.id)}
                          style={{
                            padding: "0.75rem 1rem",
                            background: "var(--fondo-claro)",
                            border: "2px solid var(--borde-claro)",
                            borderRadius: "12px",
                            cursor: "pointer",
                            fontWeight: "600",
                            color: "var(--texto-principal)",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--color-rojo)";
                            e.currentTarget.style.color = "white";
                            e.currentTarget.style.borderColor = "var(--color-rojo)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "var(--fondo-claro)";
                            e.currentTarget.style.color = "var(--texto-principal)";
                            e.currentTarget.style.borderColor = "var(--borde-claro)";
                          }}
                        >
                          {curso.nombre}
                        </button>
                      ))}
                      <button
                        onClick={() => setShowAssignModal(false)}
                        className={styles.secondaryButton}
                        style={{ marginTop: "0.75rem" }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
