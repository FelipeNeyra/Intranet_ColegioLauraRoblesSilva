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
import { collection, query, where, getDocs, setDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";

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
  // localStorage removed; return empty sync list. Use async Firestore helpers instead.
  return [];
};

//Función para registrar los usuarios iniciales en localStorage
//Esta función se llama desde AuthContext.tsx
export const seedInitialUsers = (): void => {
  // Seed initial users into Firestore in background when running locally.
  if (typeof window === "undefined") return;
  if (window.location.hostname !== "localhost") return;

  void (async () => {
    try {
      const db = await getFirestoreInstance();
      const q = query(collection(db, "usuarios"));
      const snap = await getDocs(q);
      if (!snap.empty) return; // already seeded

      await Promise.all(
        initialAdminUsers.map(async (u) => {
          await setDoc(doc(db, "usuarios", u.id), u);
        })
      );
    } catch (e) {
      console.error("Error seeding initial users to Firestore:", e);
    }
  })();
};

//Función para registrar posteriores usuarios que podran iniciar sesión
const setUsersToStorage = (_users: User[]): void => {
  // no-op: localStorage removed
};

//Funciones para generar un ID y una contraseña para los profesores
export const generateUserId = (): string => `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const generateGenericProfessorPassword = (): string => "profe123456";

//Obtener usuario en base a su Email
export const getUserByEmail = (email: string): User | undefined => {
  // sync version removed; prefer getUserByEmailAsync for Firestore-backed lookup
  return undefined;
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
export const addUserAccount = async (partial: Omit<User, "id" | "password">, customId?: string): Promise<{ user: User; password: string } | { error: string }> => {
  if (typeof window === "undefined") {
    return { error: "No disponible en servidor." };
  }

  try {
    const db = await getFirestoreInstance();
    const password = generateGenericProfessorPassword();
    const newUser: User = { id: customId || generateUserId(), ...partial, password };

    // Check collision by querying email
    const q = query(collection(db, "usuarios"), where("email", "==", partial.email));
    const snap = await getDocs(q);
    if (!snap.empty) return { error: "Ya existe un usuario con ese correo." };

    await setDoc(doc(db, "usuarios", newUser.id), newUser);
    return { user: newUser, password };
  } catch (e) {
    console.error("Error adding user to Firestore:", e);
    return { error: "Error creando usuario." };
  }
};

//Actualizar un usuario existente por correo antiguo
export const updateUserByEmail = async (oldEmail: string, updates: Partial<Omit<User, "password" | "id">>): Promise<boolean> => {
  if (typeof window === "undefined") return false;

  try {
    const db = await getFirestoreInstance();
    const q = query(collection(db, "usuarios"), where("email", "==", oldEmail));
    const snap = await getDocs(q);
    if (snap.empty) return false;

    const docRef = snap.docs[0].ref;

    if (updates.email && updates.email !== oldEmail) {
      const q2 = query(collection(db, "usuarios"), where("email", "==", updates.email));
      const snap2 = await getDocs(q2);
      if (!snap2.empty) return false;
    }

    await updateDoc(docRef, updates as any);
    return true;
  } catch (e) {
    console.error("Error updating user by email in Firestore:", e);
    return false;
  }
};

//Eliminar un usuario en base a su Email
export const deleteUserByEmail = async (email: string): Promise<boolean> => {
  if (typeof window === "undefined") return false;

  try {
    const db = await getFirestoreInstance();
    const q = query(collection(db, "usuarios"), where("email", "==", email));
    const snap = await getDocs(q);
    if (snap.empty) return false;

    const docRef = snap.docs[0].ref;
    await deleteDoc(docRef);
    return true;
  } catch (e) {
    console.error("Error deleting user by email in Firestore:", e);
    return false;
  }
};
