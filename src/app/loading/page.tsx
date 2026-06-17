"use client";

import { FormEvent, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { AuthContext } from "../../context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useContext(AuthContext);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (user) {
      router.replace("/admin_section");
    }
  }, [user, router]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    const loginResult = login(email.trim(), password.trim());
    if (!loginResult.success) {
      setError(loginResult.error ?? "No se pudo iniciar sesión.");
      return;
    }

    setError("");
    router.replace("/admin_section");
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
              onChange={(event) => setEmail(event.target.value)}
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
              onChange={(event) => setPassword(event.target.value)}
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
