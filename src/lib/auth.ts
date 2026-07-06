//Interfaz de Usuarios que podran iniciar Sesión
export type UserRole = "Administrador" | "Profesor" | "Estudiante";

export interface User {
  id: string;
  nombre: string;
  email: string;
  password: string;
  rol: UserRole;
}

//Instancia de localStorage en donde se guardaran los usuarios
export const USERS_STORAGE_KEY = "intranet_usuarios";

// Firestore integration (async helpers)
import { getFirebaseFirestore } from "../firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";

async function getFirestoreInstance() {
  return getFirebaseFirestore();
}

//Usuarios que se registran al primer momento de abrir la página
export const initialAdminUsers: User[] = [
  {
    id: "admin-1",
    nombre: "Administrador Uno",
    email: "admin1@laurarobles.cl",
    password: "Admin1234",
    rol: "Administrador",
  },
  {
    id: "admin-2",
    nombre: "Administrador Dos",
    email: "admin2@laurarobles.cl",
    password: "Admin5678",
    rol: "Administrador",
  },
  {
    id: "doc-1",
    nombre: "Carlos Ramírez",
    email: "carlos.ramirez@laurarobles.cl",
    password: "profe123456",
    rol: "Profesor",
  },
  {
    id: "doc-2",
    nombre: "María Fuentes",
    email: "maria.fuentes@laurarobles.cl",
    password: "profe123456",
    rol: "Profesor",
  },
  {
    id: "doc-3",
    nombre: "Diego Morales",
    email: "diego.morales@laurarobles.cl",
    password: "profe123456",
    rol: "Profesor",
  },
];

//Función para obtener los usuarios registrados que pueden iniciar sesión
export const getUsersFromStorage = (): User[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored) as User[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

//Función para registrar los usuarios iniciales en localStorage
//Esta función se llama desde AuthContext.tsx
export const seedInitialUsers = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  if (window.location.hostname !== "localhost") {
    return;
  }

  const existing = localStorage.getItem(USERS_STORAGE_KEY);
  if (existing) {
    return;
  }

  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialAdminUsers));
};

//Función para registrar posteriores usuarios que podran iniciar sesión
const setUsersToStorage = (users: User[]): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

//Funciones para generar un ID y una contraseña para los profesores
export const generateUserId = (): string => `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const generateGenericProfessorPassword = (): string => "profe123456";

//Obtener usuario en base a su Email
export const getUserByEmail = (email: string): User | undefined => {
  const users = getUsersFromStorage();
  return users.find((u) => u.email === email);
};

// Async version that queries Firestore `usuarios` collection
export const getUserByEmailAsync = async (email: string): Promise<User | undefined> => {
  if (typeof window === "undefined") return undefined;

  try {
    const db = await getFirestoreInstance();
    const q = query(collection(db, "usuarios"), where("email", "==", email));
    const snap = await getDocs(q);
    if (snap.empty) return undefined;

    const doc = snap.docs[0];
    const data = doc.data() as any;

    const user: User = {
      id: doc.id,
      nombre: data.nombre ?? data.displayName ?? data.email,
      email: data.email,
      password: (data.password as string) ?? "",
      rol: (data.rol as User["rol"]) ?? "Profesor",
    };

    return user;
  } catch (e) {
    console.error("[lib/auth] getUserByEmailAsync error", e);
    return undefined;
  }
};

//Función para registrar un nuevo usuario
export const addUserAccount = (partial: Omit<User, "id" | "password">, customId?: string): { user: User; password: string } | { error: string } => {
  if (typeof window === "undefined") {
    return { error: "No disponible en servidor." };
  }

  const existing = getUserByEmail(partial.email);
  if (existing) {
    return { error: "Ya existe un usuario con ese correo." };
  }

  const password = generateGenericProfessorPassword();
  const newUser: User = { id: customId || generateUserId(), ...partial, password };

  const users = getUsersFromStorage();
  users.push(newUser);
  setUsersToStorage(users);

  return { user: newUser, password };
};

//Actualizar un usuario existente por correo antiguo
export const updateUserByEmail = (oldEmail: string, updates: Partial<Omit<User, "password" | "id">>): boolean => {
  if (typeof window === "undefined") return false;

  const users = getUsersFromStorage();
  const index = users.findIndex((user) => user.email === oldEmail);
  if (index === -1) return false;

  if (updates.email && updates.email !== oldEmail) {
    const collision = users.some((user) => user.email === updates.email);
    if (collision) return false;
  }

  users[index] = { ...users[index], ...updates };
  setUsersToStorage(users);
  return true;
};

//Eliminar un usuario en base a su Email
export const deleteUserByEmail = (email: string): boolean => {
  if (typeof window === "undefined") return false;

  //Almancenar a todos los usuarios excepto a aquel con el Email
  const users = getUsersFromStorage();
  const filtered = users.filter((u) => u.email !== email);

  if (filtered.length === users.length) {
    return false; // No encontrado
  }

  setUsersToStorage(filtered);
  return true;
};
