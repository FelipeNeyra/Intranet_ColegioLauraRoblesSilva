import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Iniciar Sesión",
  description: "Pantalla de inicio de sesión inicial para la intranet escolar.",
};

export default function LoadingLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <>{children}</>;
}
