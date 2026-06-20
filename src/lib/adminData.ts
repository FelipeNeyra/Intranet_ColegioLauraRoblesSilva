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
  grado: "Kinder" | "1°" | "2°" | "3°" | "4°" | "5°" | "6°" | "7°" | "8°" | "1° Medio" | "2° Medio" | "3° Medio" | "4° Medio";
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

//Eliminar esta interfaz
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

//Instancias de Arrays en localStorage
const CURSOS_STORAGE_KEY = "intranet_cursos";
const ESTUDIANTES_STORAGE_KEY = "intranet_estudiantes";
const DOCENTES_STORAGE_KEY = "intranet_docentes";
const RESERVAS_SALA_STORAGE_KEY = "intranet_reservas_sala";
const HORARIOS_BLOQUEADOS_STORAGE_KEY = "intranet_horarios_bloqueados";
const NOTAS_STORAGE_KEY = "intranet_notas";
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

export const getCalificacionesFromStorage = (): Calificacion[] =>
  getStorageValue<Calificacion[]>(CALIFICACIONES_STORAGE_KEY, []);

//Almacenar conjuntos de datos en localStorage
//Estas funciones se ejecutan directamente desde page.tsx
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

export const saveCalificacionesStorage = (calificaciones: Calificacion[]): void =>
  setStorageValue(CALIFICACIONES_STORAGE_KEY, calificaciones);

//Función para registrar datos iniciales
//Estos datos (Cursos, Estudiantes y Docentes) se registran al momento de iniciar sesión por primera vez
export const seedInitialAdminData = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  //Obtener instancias de Arrays de localStorage
  const hasCursos = window.localStorage.getItem(CURSOS_STORAGE_KEY);
  const hasEstudiantes = window.localStorage.getItem(ESTUDIANTES_STORAGE_KEY);
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

  //Registro inicial de Estudiantes
  if (!hasEstudiantes) {
    saveEstudiantesToStorage([
      // Curso 1°A (7 estudiantes)
      { id: "est-1", nombre: "Ana María González", grado: "5°", rut: "12.345.678-9", fechaNacimiento: "2010-05-15", correo: "ana.gonzalez@laurarobles.cl", cursoId: "curso-1" },
      { id: "est-2", nombre: "Carlos Rodríguez", grado: "5°", rut: "13.456.789-0", fechaNacimiento: "2010-08-22", correo: "carlos.rodriguez@laurarobles.cl", cursoId: "curso-1" },
      { id: "est-3", nombre: "María López", grado: "5°", rut: "14.567.890-1", fechaNacimiento: "2010-11-10", correo: "maria.lopez@laurarobles.cl", cursoId: "curso-1" },
      { id: "est-4", nombre: "Diego Muñoz", grado: "5°", rut: "15.678.901-2", fechaNacimiento: "2010-03-20", correo: "diego.munoz@laurarobles.cl", cursoId: "curso-1" },
      { id: "est-13", nombre: "Valentina Soto", grado: "5°", rut: "24.567.890-1", fechaNacimiento: "2010-09-30", correo: "valentina.soto@laurarobles.cl", cursoId: "curso-1" },
      { id: "est-14", nombre: "Andrés Vega", grado: "5°", rut: "25.678.901-2", fechaNacimiento: "2010-12-12", correo: "andres.vega@laurarobles.cl", cursoId: "curso-1" },
      { id: "est-15", nombre: "Francisca Guzmán", grado: "5°", rut: "26.789.012-3", fechaNacimiento: "2010-04-18", correo: "francisca.guzman@laurarobles.cl", cursoId: "curso-1" },
      // Curso 2°B (7 estudiantes)
      { id: "est-5", nombre: "Sofía García", grado: "6°", rut: "16.789.012-3", fechaNacimiento: "2009-07-14", correo: "sofia.garcia@laurarobles.cl", cursoId: "curso-2" },
      { id: "est-6", nombre: "Pablo Soto", grado: "6°", rut: "17.890.123-4", fechaNacimiento: "2009-01-25", correo: "pablo.soto@laurarobles.cl", cursoId: "curso-2" },
      { id: "est-7", nombre: "Catalina Flores", grado: "6°", rut: "18.901.234-5", fechaNacimiento: "2009-09-08", correo: "catalina.flores@laurarobles.cl", cursoId: "curso-2" },
      { id: "est-8", nombre: "Javier Torres", grado: "6°", rut: "19.012.345-6", fechaNacimiento: "2009-12-16", correo: "javier.torres@laurarobles.cl", cursoId: "curso-2" },
      { id: "est-16", nombre: "Marcela Reyes", grado: "6°", rut: "27.890.123-4", fechaNacimiento: "2009-06-22", correo: "marcela.reyes@laurarobles.cl", cursoId: "curso-2" },
      { id: "est-17", nombre: "Ignacio Molina", grado: "6°", rut: "28.901.234-5", fechaNacimiento: "2009-11-05", correo: "ignacio.molina@laurarobles.cl", cursoId: "curso-2" },
      { id: "est-18", nombre: "Constanza Ríos", grado: "6°", rut: "29.012.345-6", fechaNacimiento: "2009-08-17", correo: "constanza.rios@laurarobles.cl", cursoId: "curso-2" },
      // Curso3°C (7 estudiantes)
      { id: "est-9", nombre: "Javiera Morales", grado: "7°", rut: "20.123.456-7", fechaNacimiento: "2008-04-11", correo: "javiera.morales@laurarobles.cl", cursoId: "curso-3" },
      { id: "est-10", nombre: "Roberto Díaz", grado: "7°", rut: "21.234.567-8", fechaNacimiento: "2008-06-28", correo: "roberto.diaz@laurarobles.cl", cursoId: "curso-3" },
      { id: "est-11", nombre: "Claudia Herrera", grado: "7°", rut: "22.345.678-9", fechaNacimiento: "2008-10-05", correo: "claudia.herrera@laurarobles.cl", cursoId: "curso-3" },
      { id: "est-12", nombre: "Felipe Ramírez", grado: "7°", rut: "23.456.789-0", fechaNacimiento: "2008-02-19", correo: "felipe.ramirez@laurarobles.cl", cursoId: "curso-3" },
      { id: "est-19", nombre: "Lorena Castillo", grado: "7°", rut: "30.123.456-7", fechaNacimiento: "2008-03-14", correo: "lorena.castillo@laurarobles.cl", cursoId: "curso-3" },
      { id: "est-20", nombre: "Rodrigo Fernández", grado: "7°", rut: "31.234.567-8", fechaNacimiento: "2008-07-26", correo: "rodrigo.fernandez@laurarobles.cl", cursoId: "curso-3" },
      { id: "est-21", nombre: "Viviana Ortega", grado: "7°", rut: "32.345.678-9", fechaNacimiento: "2008-09-09", correo: "viviana.ortega@laurarobles.cl", cursoId: "curso-3" },
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
  "Prekínder",
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
export const letrasCurso = ["A", "B", "C", "D"] as const;

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
export const getNewNota = (partial: Omit<Nota, "id">): Nota => ({ id: generateId(), ...partial });
export const getNewCita = (partial: Omit<Cita, "id">): Cita => ({ id: generateId(), ...partial });
export const getNewCalificacion = (partial: Omit<Calificacion, "id">): Calificacion => ({ id: generateId(), ...partial });

//Función para establecer automaticamente formato de RUT en formulario
export const formatRut = (value: string): string => {
  let rut = value.replace(/[^\d\-]/g, "");
  if (rut.length === 0) return "";

  if (rut.includes("-")) {
    const [rutPart, dv] = rut.split("-");
    rut = rutPart + dv;
  }

  if (rut.length <= 1) return rut;
  if (rut.length <= 4) return rut.slice(0, -1) + "." + rut.slice(-1);
  if (rut.length <= 7) return rut.slice(0, -4) + "." + rut.slice(-4, -1) + "." + rut.slice(-1);

  return rut.slice(0, -7) + "." + rut.slice(-7, -4) + "." + rut.slice(-4, -1) + "-" + rut.slice(-1);
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
//Añadir PreKinder y quitar cursos de media
export const gradoOptions = ["Kinder", "1°", "2°", "3°", "4°", "5°", "6°", "7°", "8°", "1° Medio", "2° Medio", "3° Medio", "4° Medio"] as const;
export const nivelOptions = ["Básico", "Medio", "Alto"] as const;
