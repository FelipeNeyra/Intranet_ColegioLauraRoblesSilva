//Definición de interfaces (Estructuras de código que definen parametros y funciones de objetos)
export interface Curso {
  id: string;
  nombre: string;
  profesorId: string;
}

//Añadir PreKinder y eliminar cursos de Media
export interface Estudiante {
  id: string;
  nombre: string;
  grado: "PreKinder" | "Kinder" | "1°" | "2°" | "3°" | "4°" | "5°" | "6°" | "7°" | "8°";
  rut: string;
  fechaNacimiento: string;
  correo: string;
  cursoId: string;
}

export interface Calificacion {
  id: string;
  estudianteId: string;
  profesorId: string;
  cursoId: string;
  asignatura: string;
  calificacion: number; // 1-7
  fecha: string;
  descripcion?: string;
}

export interface Docente {
  id: string;
  nombre: string;
  rut: string;
  fechaNacimiento: string;
  correo: string;
  cursoId?: string;
  asignaturas?: string[];
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
  asignatura?: string;
  personas: string;
  motivo: string;
  estado: "Pendiente" | "Aprobada" | "Rechazada";
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

import { collection, doc, query, getDocs, onSnapshot, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { getFirebaseFirestore } from "../firebase/config";

const ESTUDIANTES_COLLECTION = "estudiantes";

async function getFirestoreInstance() {
  return getFirebaseFirestore();
}

export async function getEstudiantesFromFirestore(): Promise<Estudiante[]> {
  const db = await getFirestoreInstance();
  const q = query(collection(db, ESTUDIANTES_COLLECTION));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Estudiante, "id">) }));
}

export async function listenToEstudiantes(callback: (estudiantes: Estudiante[]) => void): Promise<() => void> {
  const db = await getFirestoreInstance();
  const q = query(collection(db, ESTUDIANTES_COLLECTION));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const estudiantes = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Estudiante, "id">) }));
    callback(estudiantes);
  });
  return unsubscribe;
}

export async function addEstudianteToFirestore(estudiante: Omit<Estudiante, "id">): Promise<Estudiante> {
  const db = await getFirestoreInstance();
  const docRef = doc(collection(db, ESTUDIANTES_COLLECTION));
  await setDoc(docRef, estudiante);
  return { id: docRef.id, ...estudiante };
}

export async function updateEstudianteInFirestore(id: string, updates: Partial<Omit<Estudiante, "id">>): Promise<void> {
  const db = await getFirestoreInstance();
  await updateDoc(doc(db, ESTUDIANTES_COLLECTION, id), updates);
}

export async function deleteEstudianteFromFirestore(id: string): Promise<void> {
  const db = await getFirestoreInstance();
  await deleteDoc(doc(db, ESTUDIANTES_COLLECTION, id));
}

//Instancias de Arrays en localStorage
const CURSOS_STORAGE_KEY = "intranet_cursos";
const DOCENTES_STORAGE_KEY = "intranet_docentes";
const RESERVAS_SALA_STORAGE_KEY = "intranet_reservas_sala";
const HORARIOS_BLOQUEADOS_STORAGE_KEY = "intranet_horarios_bloqueados";
const CITAS_STORAGE_KEY = "intranet_citas";
const CALIFICACIONES_STORAGE_KEY = "intranet_calificaciones";

//Función que obtiene y parsea datos de localStorage
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

//Función que lleva a cabo el registro de datos en localStorage
const setStorageValue = <T>(key: string, value: T): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

//Obtener conjuntos de datos almacenados en localStorage
export const getCursosFromStorage = (): Curso[] =>
  getStorageValue<Curso[]>(CURSOS_STORAGE_KEY, []);

export const getDocentesFromStorage = (): Docente[] =>
  getStorageValue<Docente[]>(DOCENTES_STORAGE_KEY, []);

export const getReservaSalaFromStorage = (): ReservaSala[] =>
  getStorageValue<ReservaSala[]>(RESERVAS_SALA_STORAGE_KEY, []);

export const getHorarioBloqueadoFromStorage = (): HorarioBloqueado[] =>
  getStorageValue<HorarioBloqueado[]>(HORARIOS_BLOQUEADOS_STORAGE_KEY, []);

export const getCitasFromStorage = (): Cita[] =>
  getStorageValue<Cita[]>(CITAS_STORAGE_KEY, []);

export const getCalificacionesFromStorage = (): Calificacion[] =>
  getStorageValue<Calificacion[]>(CALIFICACIONES_STORAGE_KEY, []);

//Almacenar conjuntos de datos en localStorage
//Estas funciones se ejecutan directamente desde page.tsx
export const saveCursosToStorage = (cursos: Curso[]): void =>
  setStorageValue(CURSOS_STORAGE_KEY, cursos);

export const saveDocentesToStorage = (docentes: Docente[]): void =>
  setStorageValue(DOCENTES_STORAGE_KEY, docentes);

export const saveReservaSalaToStorage = (reservas: ReservaSala[]): void =>
  setStorageValue(RESERVAS_SALA_STORAGE_KEY, reservas);

export const saveHorarioBloqueadoToStorage = (bloqueos: HorarioBloqueado[]): void =>
  setStorageValue(HORARIOS_BLOQUEADOS_STORAGE_KEY, bloqueos);

export const saveCitasToStorage = (citas: Cita[]): void =>
  setStorageValue(CITAS_STORAGE_KEY, citas);

export const saveCalificacionesStorage = (calificaciones: Calificacion[]): void =>
  setStorageValue(CALIFICACIONES_STORAGE_KEY, calificaciones);

//Función para registrar datos iniciales
//Estos datos (Cursos y Docentes) se registran al momento de iniciar sesión por primera vez
export const seedInitialAdminData = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  //Obtener instancias de Arrays de localStorage
  const hasCursos = window.localStorage.getItem(CURSOS_STORAGE_KEY);
  const hasDocentes = window.localStorage.getItem(DOCENTES_STORAGE_KEY);
  const hasReservasSala = window.localStorage.getItem(RESERVAS_SALA_STORAGE_KEY);
  const hasHorariosBloqueados = window.localStorage.getItem(HORARIOS_BLOQUEADOS_STORAGE_KEY);

  //Registro inicial de Cursos
  if (!hasCursos) {
    saveCursosToStorage([
      { id: "curso-1", nombre: "1° Básico A", profesorId: "doc-1" },
      { id: "curso-2", nombre: "2° Básico B", profesorId: "doc-2" },
      { id: "curso-3", nombre: "3° Básico C", profesorId: "doc-3" },
    ]);
  }

  //Registro inicial de Docentes
  if (!hasDocentes) {
    saveDocentesToStorage([
      {
        id: "doc-1",
        nombre: "Carlos Ramírez",
        rut: "15.678.901-2",
        fechaNacimiento: "1985-03-20",
        correo: "carlos.ramirez@laurarobles.cl",
        cursoId: "curso-1",
        asignaturas: ["Matemáticas", "Ciencias Naturales"],
      },
      {
        id: "doc-2",
        nombre: "María Fuentes",
        rut: "16.789.012-3",
        fechaNacimiento: "1988-07-14",
        correo: "maria.fuentes@laurarobles.cl",
        cursoId: "curso-2",
        asignaturas: ["Lenguaje y Comunicación", "Historia, Geografía y Ciencias Sociales"],
      },
      {
        id: "doc-3",
        nombre: "Diego Morales",
        rut: "17.890.123-4",
        fechaNacimiento: "1990-01-25",
        correo: "diego.morales@laurarobles.cl",
        cursoId: "curso-3",
        asignaturas: ["Inglés", "Educación Física"],
      },
    ]);
  }

  //Registro inicial de Reservas para Sala de Computación
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
        curso: "5°A",
        asignatura: "Informática",
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
        curso: "6°B",
        asignatura: "Biología",
        personas: "25",
        motivo: "Uso de software educativo",
        estado: "Pendiente",
      },
    ]);
  }

  //Registro inicial de Horarios Bloqueados dentro de las Reservas
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

//Constante que define los niveles (o grados) ácademicos que puede tener un curso
export const cursoNiveles = [
  "PreKínder",
  "Kinder",
  "1° Básico",
  "2° Básico",
  "3° Básico",
  "4° Básico",
  "5° Básico",
  "6° Básico",
  "7° Básico",
  "8° Básico",
] as const;

//Constante que define la cantidad de niveles que puede tener un curso
export const letrasCurso = ["A", "B", "C"] as const;

//Constante que define las asignaturas que puede tener un profesor
export const asignaturaOptions = [
  "Matemáticas",
  "Lenguaje y Comunicación",
  "Ciencias Naturales",
  "Historia, Geografía y Ciencias Sociales",
  "Inglés",
  "Educación Física",
  "Artes",
  "Tecnología",
] as const;

//Función para generar un ID
const generateId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

//Funciones exportadas que funcionan para crear nuevos objetos en base a sus interfaces y IDs generadas
export const getNewCurso = (partial: Omit<Curso, "id">): Curso => ({ id: generateId(), ...partial });
export const getNewEstudiante = (partial: Omit<Estudiante, "id">): Estudiante => ({ id: generateId(), ...partial });
export const getNewDocente = (partial: Omit<Docente, "id">, customId?: string): Docente => ({ id: customId || generateId(), ...partial });
export const getNewReservaSala = (partial: Omit<ReservaSala, "id">): ReservaSala => ({ id: generateId(), ...partial });
export const getNewHorarioBloqueado = (partial: Omit<HorarioBloqueado, "id">): HorarioBloqueado => ({ id: generateId(), ...partial });
export const getNewCita = (partial: Omit<Cita, "id">): Cita => ({ id: generateId(), ...partial });
export const getNewCalificacion = (partial: Omit<Calificacion, "id">): Calificacion => ({ id: generateId(), ...partial });

//Función para establecer automaticamente formato de RUT en formulario
export const formatRut = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 9);
  if (!digits) return "";

  const body = digits.slice(0, 8);
  const dv = digits.slice(8, 9);

  let formatted = body;

  if (body.length > 6) {
    formatted = `${body.slice(0, body.length - 6)}.${body.slice(body.length - 6, body.length - 3)}.${body.slice(body.length - 3)}`;
  } else if (body.length > 3) {
    formatted = `${body.slice(0, body.length - 3)}.${body.slice(body.length - 3)}`;
  }

  return dv ? `${formatted}-${dv}` : formatted;
};

//Función para validar el formato de Email
export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

//Función para validar formato de RUT
export const validateRut = (rut: string): boolean => {
  const rutRegex = /^\d{1,2}\.\d{3}\.\d{3}-[\dKk]$/;
  return rutRegex.test(rut);
};

//Grado de Edudación disponible para los Alumnos
export const gradoOptions = ["PreKinder", "Kinder", "1°", "2°", "3°", "4°", "5°", "6°", "7°", "8°"] as const;
//export const nivelOptions = ["Básico", "Medio", "Alto"] as const;
