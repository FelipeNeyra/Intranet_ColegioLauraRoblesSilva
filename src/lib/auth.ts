export type UserRole = "Administrador" | "Profesor" | "Estudiante";

export interface User {
  id: string;
  nombre: string;
  email: string;
  password: string;
  rol: UserRole;
}

export const USERS_STORAGE_KEY = "intranet_usuarios";

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
];

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
