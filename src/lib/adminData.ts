export interface Curso {
  id: string;
  nombre: string;
  nivel: "Básico" | "Medio" | "Alto";
  profesor: string;
}

export interface Estudiante {
  id: string;
  nombre: string;
  grado: "Kinder" | "1°" | "2°" | "3°" | "4°" | "5°" | "6°" | "7°" | "8°" | "1° Medio" | "2° Medio" | "3° Medio" | "4° Medio";
  rut: string;
  fechaNacimiento: string;
  correo: string;
}

export interface Docente {
  id: string;
  nombre: string;
  materia: string;
  rut: string;
  fechaNacimiento: string;
  correo: string;
}

export interface ReservaSala {
  id: string;
  nombre: string;
  apellido: string;
  rut: string;
  correo: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  curso: string;
  personas: string;
  motivo: string;
  estado: "Pendiente" | "Aprobada" | "Rechazada";
}

export interface Nota {
  id: string;
  estudianteId: string;
  profesorId: string;
  fecha: string;
  texto: string;
}

export interface Cita {
  id: string;
  estudianteId: string;
  profesorId: string;
  fecha: string; // ISO date
  hora: string; // e.g. "14:30"
  motivo: string;
  estado: "Agendada" | "Completada" | "Cancelada";
}

export interface HorarioBloqueado {
  id: string;
  fecha: string;
  hora: string;
  motivo: string;
}

const CURSOS_STORAGE_KEY = "intranet_cursos";
const ESTUDIANTES_STORAGE_KEY = "intranet_estudiantes";
const DOCENTES_STORAGE_KEY = "intranet_docentes";
const RESERVAS_SALA_STORAGE_KEY = "intranet_reservas_sala";
const HORARIOS_BLOQUEADOS_STORAGE_KEY = "intranet_horarios_bloqueados";
const NOTAS_STORAGE_KEY = "intranet_notas";
const CITAS_STORAGE_KEY = "intranet_citas";

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

export const getReservaSalaFromStorage = (): ReservaSala[] =>
  getStorageValue<ReservaSala[]>(RESERVAS_SALA_STORAGE_KEY, []);

export const getHorarioBloqueadoFromStorage = (): HorarioBloqueado[] =>
  getStorageValue<HorarioBloqueado[]>(HORARIOS_BLOQUEADOS_STORAGE_KEY, []);

export const getNotasFromStorage = (): Nota[] =>
  getStorageValue<Nota[]>(NOTAS_STORAGE_KEY, []);

export const getCitasFromStorage = (): Cita[] =>
  getStorageValue<Cita[]>(CITAS_STORAGE_KEY, []);

export const saveCursosToStorage = (cursos: Curso[]): void =>
  setStorageValue(CURSOS_STORAGE_KEY, cursos);

export const saveEstudiantesToStorage = (estudiantes: Estudiante[]): void =>
  setStorageValue(ESTUDIANTES_STORAGE_KEY, estudiantes);

export const saveDocentesToStorage = (docentes: Docente[]): void =>
  setStorageValue(DOCENTES_STORAGE_KEY, docentes);

export const saveReservaSalaToStorage = (reservas: ReservaSala[]): void =>
  setStorageValue(RESERVAS_SALA_STORAGE_KEY, reservas);

export const saveHorarioBloqueadoToStorage = (bloqueos: HorarioBloqueado[]): void =>
  setStorageValue(HORARIOS_BLOQUEADOS_STORAGE_KEY, bloqueos);

export const saveNotasToStorage = (notas: Nota[]): void =>
  setStorageValue(NOTAS_STORAGE_KEY, notas);

export const saveCitasToStorage = (citas: Cita[]): void =>
  setStorageValue(CITAS_STORAGE_KEY, citas);

export const seedInitialAdminData = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  const hasCursos = window.localStorage.getItem(CURSOS_STORAGE_KEY);
  const hasEstudiantes = window.localStorage.getItem(ESTUDIANTES_STORAGE_KEY);
  const hasDocentes = window.localStorage.getItem(DOCENTES_STORAGE_KEY);
  const hasReservasSala = window.localStorage.getItem(RESERVAS_SALA_STORAGE_KEY);
  const hasHorariosBloqueados = window.localStorage.getItem(HORARIOS_BLOQUEADOS_STORAGE_KEY);

  if (!hasCursos) {
    saveCursosToStorage([
      { id: "curso-1", nombre: "Matemáticas 101", nivel: "Básico", profesor: "Carlos Ramírez" },
      { id: "curso-2", nombre: "Historia General", nivel: "Medio", profesor: "María Fuentes" },
      { id: "curso-3", nombre: "Programación Web", nivel: "Alto", profesor: "Diego Morales" },
    ]);
  }

  if (!hasEstudiantes) {
    saveEstudiantesToStorage([
      { id: "est-1", nombre: "Ana González", grado: "1° Medio", rut: "12.345.678-9", fechaNacimiento: "2008-05-15", correo: "ana.gonzalez@laurarobles.cl" },
      { id: "est-2", nombre: "Pedro Soto", grado: "2° Medio", rut: "13.456.789-0", fechaNacimiento: "2007-08-22", correo: "pedro.soto@laurarobles.cl" },
      { id: "est-3", nombre: "Julieta Morales", grado: "3° Medio", rut: "14.567.890-1", fechaNacimiento: "2006-11-10", correo: "julieta.morales@laurarobles.cl" },
    ]);
  }

  if (!hasDocentes) {
    saveDocentesToStorage([
      { id: "doc-1", nombre: "Carlos Ramírez", materia: "Matemáticas", rut: "15.678.901-2", fechaNacimiento: "1985-03-20", correo: "carlos.ramirez@laurarobles.cl" },
      { id: "doc-2", nombre: "María Fuentes", materia: "Historia", rut: "16.789.012-3", fechaNacimiento: "1988-07-14", correo: "maria.fuentes@laurarobles.cl" },
      { id: "doc-3", nombre: "Diego Morales", materia: "Programación", rut: "17.890.123-4", fechaNacimiento: "1990-01-25", correo: "diego.morales@laurarobles.cl" },
    ]);
  }

  if (!hasReservasSala) {
    saveReservaSalaToStorage([
      {
        id: "reserva-1",
        nombre: "Camila",
        apellido: "López",
        rut: "18.901.234-5",
        correo: "camila.lopez@laurarobles.cl",
        fecha: new Date().toISOString().slice(0, 10),
        horaInicio: "10:00",
        horaFin: "11:00",
        curso: "Programación",
        personas: "18",
        motivo: "Clase práctica de informática",
        estado: "Aprobada",
      },
      {
        id: "reserva-2",
        nombre: "Jorge",
        apellido: "Pérez",
        rut: "19.012.345-6",
        correo: "jorge.perez@laurarobles.cl",
        fecha: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        horaInicio: "14:00",
        horaFin: "15:00",
        curso: "Biología",
        personas: "25",
        motivo: "Uso de software educativo",
        estado: "Pendiente",
      },
    ]);
  }

  if (!hasHorariosBloqueados) {
    saveHorarioBloqueadoToStorage([
      {
        id: "bloqueo-1",
        fecha: new Date().toISOString().slice(0, 10),
        hora: "12:00",
        motivo: "Reunión administrativa",
      },
    ]);
  }
};

const generateId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const getNewCurso = (partial: Omit<Curso, "id">): Curso => ({ id: generateId(), ...partial });
export const getNewEstudiante = (partial: Omit<Estudiante, "id">): Estudiante => ({ id: generateId(), ...partial });
export const getNewDocente = (partial: Omit<Docente, "id">): Docente => ({ id: generateId(), ...partial });
export const getNewReservaSala = (partial: Omit<ReservaSala, "id">): ReservaSala => ({ id: generateId(), ...partial });
export const getNewHorarioBloqueado = (partial: Omit<HorarioBloqueado, "id">): HorarioBloqueado => ({ id: generateId(), ...partial });
export const getNewNota = (partial: Omit<Nota, "id">): Nota => ({ id: generateId(), ...partial });
export const getNewCita = (partial: Omit<Cita, "id">): Cita => ({ id: generateId(), ...partial });

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validateRut = (rut: string): boolean => {
  const rutRegex = /^\d{1,2}\.\d{3}\.\d{3}-[\dKk]$/;
  return rutRegex.test(rut);
};

export const gradoOptions = ["Kinder", "1°", "2°", "3°", "4°", "5°", "6°", "7°", "8°", "1° Medio", "2° Medio", "3° Medio", "4° Medio"] as const;
export const nivelOptions = ["Básico", "Medio", "Alto"] as const;
