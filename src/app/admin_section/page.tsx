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
} from "../../lib/adminData";

const sections = ["Cursos", "Estudiantes", "Docentes"] as const;
type Section = (typeof sections)[number];

export default function AdminSectionPage() {
  const router = useRouter();
  const { user, logout, isInitializing } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState<Section>("Cursos");
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [cursoForm, setCursoForm] = useState({ nombre: "", nivel: "", profesor: "" });
  const [estudianteForm, setEstudianteForm] = useState({ nombre: "", grado: "", correo: "" });
  const [docenteForm, setDocenteForm] = useState({ nombre: "", materia: "", correo: "" });

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
      if (!cursoForm.nombre.trim() || !cursoForm.nivel.trim() || !cursoForm.profesor.trim()) {
        return;
      }
      setCursos((current) => [...current, getNewCurso({ ...cursoForm })]);
      setCursoForm({ nombre: "", nivel: "", profesor: "" });
    }

    if (activeSection === "Estudiantes") {
      if (!estudianteForm.nombre.trim() || !estudianteForm.grado.trim() || !estudianteForm.correo.trim()) {
        return;
      }
      setEstudiantes((current) => [...current, getNewEstudiante({ ...estudianteForm })]);
      setEstudianteForm({ nombre: "", grado: "", correo: "" });
    }

    if (activeSection === "Docentes") {
      if (!docenteForm.nombre.trim() || !docenteForm.materia.trim() || !docenteForm.correo.trim()) {
        return;
      }
      setDocentes((current) => [...current, getNewDocente({ ...docenteForm })]);
      setDocenteForm({ nombre: "", materia: "", correo: "" });
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
                  <label htmlFor="cursoNombre">Nombre de curso</label>
                  <input
                    id="cursoNombre"
                    value={cursoForm.nombre}
                    onChange={(event) => setCursoForm((current) => ({ ...current, nombre: event.target.value }))}
                    className={styles.input}
                    placeholder="Matemáticas 101"
                  />
                </div>
                <div className={styles.inputRow}>
                  <label htmlFor="cursoNivel">Nivel</label>
                  <input
                    id="cursoNivel"
                    value={cursoForm.nivel}
                    onChange={(event) => setCursoForm((current) => ({ ...current, nivel: event.target.value }))}
                    className={styles.input}
                    placeholder="Básico"
                  />
                </div>
                <div className={styles.inputRow}>
                  <label htmlFor="cursoProfesor">Profesor</label>
                  <input
                    id="cursoProfesor"
                    value={cursoForm.profesor}
                    onChange={(event) => setCursoForm((current) => ({ ...current, profesor: event.target.value }))}
                    className={styles.input}
                    placeholder="Carlos Ramírez"
                  />
                </div>
              </>
            )}

            {activeSection === "Estudiantes" && (
              <>
                <div className={styles.inputRow}>
                  <label htmlFor="estNombre">Nombre del estudiante</label>
                  <input
                    id="estNombre"
                    value={estudianteForm.nombre}
                    onChange={(event) => setEstudianteForm((current) => ({ ...current, nombre: event.target.value }))}
                    className={styles.input}
                    placeholder="Ana González"
                  />
                </div>
                <div className={styles.inputRow}>
                  <label htmlFor="estGrado">Grado</label>
                  <input
                    id="estGrado"
                    value={estudianteForm.grado}
                    onChange={(event) => setEstudianteForm((current) => ({ ...current, grado: event.target.value }))}
                    className={styles.input}
                    placeholder="1° Medio"
                  />
                </div>
                <div className={styles.inputRow}>
                  <label htmlFor="estCorreo">Correo</label>
                  <input
                    id="estCorreo"
                    value={estudianteForm.correo}
                    onChange={(event) => setEstudianteForm((current) => ({ ...current, correo: event.target.value }))}
                    className={styles.input}
                    placeholder="ana.gonzalez@laurarobles.cl"
                  />
                </div>
              </>
            )}

            {activeSection === "Docentes" && (
              <>
                <div className={styles.inputRow}>
                  <label htmlFor="docNombre">Nombre del docente</label>
                  <input
                    id="docNombre"
                    value={docenteForm.nombre}
                    onChange={(event) => setDocenteForm((current) => ({ ...current, nombre: event.target.value }))}
                    className={styles.input}
                    placeholder="Carlos Ramírez"
                  />
                </div>
                <div className={styles.inputRow}>
                  <label htmlFor="docMateria">Materia</label>
                  <input
                    id="docMateria"
                    value={docenteForm.materia}
                    onChange={(event) => setDocenteForm((current) => ({ ...current, materia: event.target.value }))}
                    className={styles.input}
                    placeholder="Matemáticas"
                  />
                </div>
                <div className={styles.inputRow}>
                  <label htmlFor="docCorreo">Correo</label>
                  <input
                    id="docCorreo"
                    value={docenteForm.correo}
                    onChange={(event) => setDocenteForm((current) => ({ ...current, correo: event.target.value }))}
                    className={styles.input}
                    placeholder="carlos.ramirez@laurarobles.cl"
                  />
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
