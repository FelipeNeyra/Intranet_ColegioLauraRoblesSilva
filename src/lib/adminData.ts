export interface Curso {
  id: string;
  nombre: string;
  nivel: string;
  profesor: string;
}

export interface Estudiante {
  id: string;
  nombre: string;
  grado: string;
  correo: string;
}

export interface Docente {
  id: string;
  nombre: string;
  materia: string;
  correo: string;
}

const CURSOS_STORAGE_KEY = "intranet_cursos";
const ESTUDIANTES_STORAGE_KEY = "intranet_estudiantes";
const DOCENTES_STORAGE_KEY = "intranet_docentes";

const getStorageValue = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as T;
    return parsed;
  } catch {
    return fallback;
  }
};

const setStorageValue = <T>(key: string, value: T): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

export const getCursosFromStorage = (): Curso[] =>
  getStorageValue<Curso[]>(CURSOS_STORAGE_KEY, []);

export const getEstudiantesFromStorage = (): Estudiante[] =>
  getStorageValue<Estudiante[]>(ESTUDIANTES_STORAGE_KEY, []);

export const getDocentesFromStorage = (): Docente[] =>
  getStorageValue<Docente[]>(DOCENTES_STORAGE_KEY, []);

export const saveCursosToStorage = (cursos: Curso[]): void =>
  setStorageValue(CURSOS_STORAGE_KEY, cursos);

export const saveEstudiantesToStorage = (estudiantes: Estudiante[]): void =>
  setStorageValue(ESTUDIANTES_STORAGE_KEY, estudiantes);

export const saveDocentesToStorage = (docentes: Docente[]): void =>
  setStorageValue(DOCENTES_STORAGE_KEY, docentes);

export const seedInitialAdminData = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  const hasCursos = window.localStorage.getItem(CURSOS_STORAGE_KEY);
  const hasEstudiantes = window.localStorage.getItem(ESTUDIANTES_STORAGE_KEY);
  const hasDocentes = window.localStorage.getItem(DOCENTES_STORAGE_KEY);

  if (!hasCursos) {
    saveCursosToStorage([
      { id: "curso-1", nombre: "Matemáticas 101", nivel: "Básico", profesor: "Carlos Ramírez" },
      { id: "curso-2", nombre: "Historia General", nivel: "Medio", profesor: "María Fuentes" },
      { id: "curso-3", nombre: "Programación Web", nivel: "Avanzado", profesor: "Diego Morales" },
    ]);
  }

  if (!hasEstudiantes) {
    saveEstudiantesToStorage([
      { id: "est-1", nombre: "Ana González", grado: "1° Medio", correo: "ana.gonzalez@laurarobles.cl" },
      { id: "est-2", nombre: "Pedro Soto", grado: "2° Medio", correo: "pedro.soto@laurarobles.cl" },
      { id: "est-3", nombre: "Julieta Morales", grado: "3° Medio", correo: "julieta.morales@laurarobles.cl" },
    ]);
  }

  if (!hasDocentes) {
    saveDocentesToStorage([
      { id: "doc-1", nombre: "Carlos Ramírez", materia: "Matemáticas", correo: "carlos.ramirez@laurarobles.cl" },
      { id: "doc-2", nombre: "María Fuentes", materia: "Historia", correo: "maria.fuentes@laurarobles.cl" },
      { id: "doc-3", nombre: "Diego Morales", materia: "Programación", correo: "diego.morales@laurarobles.cl" },
    ]);
  }
};

const generateId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const getNewCurso = (partial: Omit<Curso, "id">): Curso => ({ id: generateId(), ...partial });
export const getNewEstudiante = (partial: Omit<Estudiante, "id">): Estudiante => ({ id: generateId(), ...partial });
export const getNewDocente = (partial: Omit<Docente, "id">): Docente => ({ id: generateId(), ...partial });
