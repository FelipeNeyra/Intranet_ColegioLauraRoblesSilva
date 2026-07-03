"use client";

import { FormEvent, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { AuthContext } from "../../context/AuthContext";

function mapFirebaseError(errorCode: unknown) {
  if (typeof errorCode !== "string") {
    return "No se pudo iniciar sesión. Intenta nuevamente.";
  }

  switch (errorCode) {
    case "auth/user-not-found":
      return "Usuario no encontrado.";
    case "auth/wrong-password":
      return "Contraseña incorrecta.";
    case "auth/invalid-email":
      return "Correo electrónico inválido.";
    case "auth/user-disabled":
      return "La cuenta está deshabilitada.";
    default:
      return "Error de Firebase: no se pudo iniciar sesión.";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useContext(AuthContext);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (user) {
      const encodedName = encodeURIComponent(user.nombre || "");
      if (user.rol === "Administrador") {
        router.replace(`/admin_section/${encodedName}`);
      } else if (user.rol === "Profesor") {
        router.replace(`/profesor/${encodedName}`);
      } else {
        router.replace("/loading");
      }
    }
  }, [user, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    const loginResult = await login(email.trim(), password.trim());
    if (!loginResult.success) {
      setError(mapFirebaseError(loginResult.error));
      return;
    }

    setError("");
  };

  return (
    <main className={styles.loginPage}>
      <section className={styles.card}>
        <div className={styles.brand}>
          <h1 className={styles.title}>Iniciar Sesión</h1>
          <p className={styles.subtitle}>Accede con tu cuenta para gestionar los datos internos.</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(event) => {setEmail(event.target.value);setError("");}}
              placeholder="tu@dominio.cl"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(event) => {setPassword(event.target.value);setError("");}}
              placeholder="Ingresa tu contraseña"
            />
          </div>

          {error ? <p className={styles.error}>{error}</p> : null}

          <button type="submit" className={styles.submitButton}>
            Iniciar sesión
          </button>
        </form>
      </section>
    </main>
  );
}