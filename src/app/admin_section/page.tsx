"use client";

import { FormEvent, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "../../context/AuthContext";
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

const sections = ["Cursos", "Estudiantes", "Docentes"] as const;
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
    if (!isInitializing && !user) {
      router.replace("/loading");
    }
  }, [isInitializing, router, user]);

  useEffect(() => {
    seedInitialAdminData();
    setCursos(getCursosFromStorage());
    setEstudiantes(getEstudiantesFromStorage());
    setDocentes(getDocentesFromStorage());
    setIsLoaded(true);
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
      setDocentes((current) => [...current, getNewDocente({ ...docenteForm })]);
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
        <div className={styles.listCard}>
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
                  <button className={styles.deleteButton} onClick={() => handleDeleteEstudiante(estudiante.id)}>
                    Eliminar
                  </button>
                </article>
              ))}

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
        </div>
      </main>

      <footer className={styles.footer}>
        <p>Intranet - Colegio Laura Robles Silva - Sección de Administradores</p>
      </footer>
    </div>
  );
}
