"use client";

import { createContext, useEffect, useState, type ReactNode } from "react";
import { getUsersFromStorage, seedInitialUsers, type User } from "../lib/auth";

//Definición de interfaz para el valor que compartira el Contexto
interface AuthContextType {
  user: User | null;
  isInitializing: boolean;
  login: (email: string, password: string) => {
    success: boolean;
    error?: string;
  };
  logout: () => void;
}

//Instancia de localStorage para posterior almacenamiento
const sessionStorageKey = "intranet_sesion";

//Se crea el contexto por defecto con valores iniciales seguros
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isInitializing: true,
  login: () => ({ success: false, error: "Contexto de autenticación no disponible." }),
  logout: () => {},
});

//AuthProvider carga los usuarios iniciales y verifica el estado de Inicio de Sesión
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  //Carga inicial de datos desde localStorage
  useEffect(() => {
    //Almacenamiento de usuarios registrados desde archivo auth.ts
    seedInitialUsers();

    //Verificación de que se haya iniciado la página de Inicio de Sesión
    //setIsInitializing se establece en falso para evitar el ingreso desde otra ruta
    if (typeof window === "undefined") {
      setIsInitializing(false);
      return;
    }

    //setIsInitializing se establece en falso en caso de no haber una sesión iniciada con anterioridad
    const storedSession = localStorage.getItem(sessionStorageKey);
    if (!storedSession) {
      setIsInitializing(false);
      return;
    }

    //En caso de haber una sesión iniciada, se obtiene y almacena el usuario de la sesión mediante el parseo
    try {
      const parsedUser = JSON.parse(storedSession) as User;
      setUser(parsedUser);
    } catch { //De fallar el inicio de sesión, se elimina de localStorage
      localStorage.removeItem(sessionStorageKey);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  //Función de login que valida las credenciales ingresadas con las almacenadas en localStorage
  const login = (email: string, password: string) => {
    //Se obtienen los usuarios registrados
    const users = getUsersFromStorage();
    const foundUser = users.find(
      (candidate) => candidate.email === email && candidate.password === password,
    );

    //Mensaje que se mostrara en caso de no encontrar un usuario
    if (!foundUser) {
      return {
        success: false,
        error: "Usuario o contraseña incorrectos.",
      };
    }

    //Almacenamiento de la sesión (intranet_sesion) con los datos del usuario
    if (typeof window !== "undefined") {
      localStorage.setItem(sessionStorageKey, JSON.stringify(foundUser));
    }

    setUser(foundUser);

    return {
      success: true,
    };
  };

  //Elimina la sesión (intranet_sesion) de localStorage
  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(sessionStorageKey);
    }
    setUser(null);
  };

  //Establecer el Provider para su acceso desde otras rutas y pages
  return (
    <AuthContext.Provider value={{ user, isInitializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
