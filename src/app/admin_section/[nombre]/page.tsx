"use client";

import { FormEvent, useContext, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthContext } from "../../../context/AuthContext";
import { SalaComputacionPanel } from "../../../components/admin/SalaComputacionPanel";
import { CursosPanel } from "../../../components/admin/CursosPanel";
import styles from "../page.module.css";
import {
  Curso,
  Docente,
  cursoNiveles,
  getCursosFromStorage,
  getDocentesFromStorage,
  getNewDocente,
  getNewCurso,
  saveCursosToStorage,
  saveDocentesToStorage,
  seedInitialAdminData,
  validateEmail,
  validateRut,
  formatRut,
} from "../../../lib/adminData";
import { addUserAccount, deleteUserByEmail, generateUserId } from "../../../lib/auth";

const sections = ["Cursos", "Docentes", "Sala de Computación"] as const;
type Section = (typeof sections)[number];

interface FormErrors {
  nombre?: string;
  rut?: string;
  fechaNacimiento?: string;
  correo?: string;
  asignaturas?: string;
}

export default function AdminSectionPage() {
  const router = useRouter();
  const params = useParams() as { nombre?: string | string[] };
  const rawNombre = Array.isArray(params.nombre) ? params.nombre.join(" ") : params.nombre;
  const routeNombre = rawNombre
    ? (() => {
        try {
          return decodeURIComponent(rawNombre);
        } catch {
          return String(rawNombre).replace(/%20/g, " ").replace(/\+/g, " ");
        }
      })()
    : rawNombre;
  const { user, logout, isInitializing } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState<Section>("Cursos");
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [showAddCurso, setShowAddCurso] = useState(false);
  const [cursoForm, setCursoForm] = useState({ nivel: "", letra: "" });
  const [docenteForm, setDocenteForm] = useState({
    nombre: "",
    rut: "",
    fechaNacimiento: "",
    correo: "",
    asignaturas: "",
  });
  const [docenteErrors, setDocenteErrors] = useState<FormErrors>({});
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDocenteId, setSelectedDocenteId] = useState<string>("");
  const [lastCreatedAccount, setLastCreatedAccount] = useState<{ email: string; password: string } | null>(null);

  useEffect(() => {
    if (!isInitializing) {
      if (!user) {
        router.replace("/loading");
        return;
      }
      if (user.rol !== "Administrador") {
        if (user.rol === "Profesor") {
          router.replace(`/profesor/${encodeURIComponent(user.nombre)}`);
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
    saveDocentesToStorage(docentes);
  }, [cursos, docentes, isLoaded]);

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

    if (!docenteForm.asignaturas.trim()) {
      errors.asignaturas = "Debe indicar al menos una asignatura.";
    }

    setDocenteErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDeleteDocente = (id: string) => {
    const docente = docentes.find((d) => d.id === id);
    if (docente) {
      deleteUserByEmail(docente.correo);
    }
    setDocentes((current) => current.filter((docente) => docente.id !== id));
  };

  const handleAssignCurso = (docenteId: string, cursoId: string) => {
    const docente = docentes.find((d) => d.id === docenteId);
    const oldCursoId = docente?.cursoId;

    setDocentes((current) =>
      current.map((doc) =>
        doc.id === docenteId ? { ...doc, cursoId } : doc
      )
    );

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

    if (!cursoForm.nivel || !cursoForm.letra) {
      return;
    }

    const nombreCurso = `${cursoForm.nivel} ${cursoForm.letra}`;
    const newCurso = getNewCurso({
      nombre: nombreCurso,
      profesorId: "",
    });

    setCursos((current) => [...current, newCurso]);
    setCursoForm({ nivel: "", letra: "" });
  };

  const handleDeleteCurso = (id: string) => {
    setCursos((current) => current.filter((curso) => curso.id !== id));
    setDocentes((current) =>
      current.map((docente) =>
        docente.cursoId === id ? { ...docente, cursoId: undefined } : docente
      )
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (activeSection === "Docentes") {
      if (!validateDocente()) {
        return;
      }

      const userId = generateUserId();
      const asignaturas = docenteForm.asignaturas
        .split(",")
        .map((asignatura) => asignatura.trim())
        .filter(Boolean);

      const newDocente = getNewDocente(
        {
          ...docenteForm,
          asignaturas,
        },
        userId
      );
      setDocentes((current) => [...current, newDocente]);

      try {
        const result = addUserAccount({ nombre: newDocente.nombre, email: newDocente.correo, rol: "Profesor" }, userId);
        if ("error" in result) {
          // eslint-disable-next-line no-console
          console.warn("No se creó cuenta de usuario:", result.error);
        } else {
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
        asignaturas: "",
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

  const displayedName = routeNombre || user.nombre;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}>LR</span>
          <div>
            <h1>Panel de Administración</h1>
            <p>Bienvenido, {displayedName}</p>
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
              <CursosPanel cursos={cursos} onCursosChange={setCursos} />
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
                        <label htmlFor="cursoNivel">Nivel *</label>
                        <select
                          id="cursoNivel"
                          value={cursoForm.nivel}
                          onChange={(e) => setCursoForm({ ...cursoForm, nivel: e.target.value })}
                          className={styles.input}
                        >
                          <option value="">Selecciona un nivel</option>
                          {cursoNiveles.map((nivel) => (
                            <option key={nivel} value={nivel}>
                              {nivel}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.inputRow}>
                        <label htmlFor="cursoLetra">Letra *</label>
                        <select
                          id="cursoLetra"
                          value={cursoForm.letra}
                          onChange={(e) => setCursoForm({ ...cursoForm, letra: e.target.value })}
                          className={styles.input}
                        >
                          <option value="">Selecciona una letra</option>
                          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letra) => (
                            <option key={letra} value={letra}>
                              {letra}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.actionsRow}>
                        <button type="submit" className={styles.actionButton}>
                          Guardar curso
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
                </div>
              </div>
            </>
          ) : activeSection === "Docentes" ? (
            <>
              <div className={styles.listHeader}>
                <h2>Gestión de Docentes</h2>
                <p>Registra nuevos docentes, asigna cursos y administra la información del personal.</p>
              </div>
              <form className={styles.addForm} onSubmit={handleSubmit}>
                <div className={styles.inputRow}>
                  <label htmlFor="docNombre">Nombre del docente *</label>
                  <input
                    id="docNombre"
                    value={docenteForm.nombre}
                    onChange={(event) => {
                      const nombre = event.target.value;
                      if (/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]*$/.test(nombre) || nombre === "") {
                        const correoAutomatico = generateEmail(nombre);
                        setDocenteForm((current) => ({
                          ...current,
                          nombre,
                          correo: correoAutomatico,
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
                  />
                  {docenteErrors.rut ? <span className={styles.error}>{docenteErrors.rut}</span> : null}
                </div>

                <div className={styles.inputRow}>
                  <label htmlFor="docFecha">Fecha de nacimiento *</label>
                  <input
                    id="docFecha"
                    type="date"
                    value={docenteForm.fechaNacimiento}
                    onChange={(event) => setDocenteForm((current) => ({ ...current, fechaNacimiento: event.target.value }))}
                    className={styles.input}
                  />
                  {docenteErrors.fechaNacimiento ? <span className={styles.error}>{docenteErrors.fechaNacimiento}</span> : null}
                </div>

                <div className={styles.inputRow}>
                  <label htmlFor="docCorreo">Correo (Generado automáticamente) *</label>
                  <input
                    id="docCorreo"
                    value={docenteForm.correo}
                    readOnly
                    className={styles.input}
                    placeholder="correo@laurarobles.cl"
                  />
                  {docenteErrors.correo ? <span className={styles.error}>{docenteErrors.correo}</span> : null}
                </div>

                <div className={styles.inputRow}>
                  <label htmlFor="docAsignaturas">Asignaturas del docente *</label>
                  <input
                    id="docAsignaturas"
                    value={docenteForm.asignaturas}
                    onChange={(event) => setDocenteForm((current) => ({ ...current, asignaturas: event.target.value }))}
                    className={styles.input}
                    placeholder="Matemáticas, Inglés"
                  />
                  {docenteErrors.asignaturas ? <span className={styles.error}>{docenteErrors.asignaturas}</span> : null}
                </div>

                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <button type="submit" className={styles.actionButton}>Registrar docente</button>
                  <button type="button" className={styles.secondaryButton} onClick={() => setDocenteForm({ nombre: "", rut: "", fechaNacimiento: "", correo: "", asignaturas: "" })}>Limpiar</button>
                </div>
              </form>

              <div className={styles.listContainer}>
                {docentes.length === 0 ? (
                  <p>No hay docentes registrados aún.</p>
                ) : (
                  docentes.map((docente) => (
                    <div key={docente.id} className={styles.listItem}>
                      <div>
                        <h3>{docente.nombre}</h3>
                        <p>RUT: {docente.rut}</p>
                        <p>Correo: {docente.correo}</p>
                        <p>Asignaturas: {docente.asignaturas?.join(", ") || "Sin asignaturas"}</p>
                        <p>Curso: {cursos.find((curso) => curso.id === docente.cursoId)?.nombre || "Sin curso asignado"}</p>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <button
                          type="button"
                          className={styles.actionButton}
                          onClick={() => {
                            setSelectedDocenteId(docente.id);
                            setShowAssignModal(true);
                          }}
                        >
                          Asignar curso
                        </button>
                        <button
                          type="button"
                          className={styles.deleteButton}
                          onClick={() => handleDeleteDocente(docente.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {showAssignModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
                  <div style={{ width: "100%", maxWidth: "520px", background: "white", borderRadius: "20px", padding: "1.5rem", boxShadow: "0 30px 80px rgba(15, 23, 42, 0.18)" }}>
                    <h3 style={{ marginBottom: "1rem", color: "#db353d" }}>Asignar Curso</h3>
                    <p style={{ marginBottom: "1rem", color: "#475569" }}>Selecciona el curso que se asignará al docente.</p>
                    <select
                      value={selectedDocenteId ? docentes.find((doc) => doc.id === selectedDocenteId)?.cursoId || "" : ""}
                      onChange={(event) => {
                        const cursoId = event.target.value;
                        if (selectedDocenteId && cursoId) {
                          handleAssignCurso(selectedDocenteId, cursoId);
                        }
                      }}
                      className={styles.input}
                    >
                      <option value="">Selecciona un curso</option>
                      {cursos.map((curso) => (
                        <option key={curso.id} value={curso.id}>{curso.nombre}</option>
                      ))}
                    </select>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                      <button type="button" className={styles.secondaryButton} onClick={() => setShowAssignModal(false)}>Cerrar</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <SalaComputacionPanel />
          )}
        </div>
      </main>

      <footer className={styles.footer}>
        <p>Intranet - Colegio Laura Robles Silva - Sección Administrador</p>
      </footer>
    </div>
  );
}
