"use client";

import React from "react";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title = "Confirmar eliminación",
  message = "¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}>
      <div style={{ width: "min(560px, 92%)", background: "white", borderRadius: 12, padding: "1.25rem", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: 0, marginBottom: "0.5rem", color: "#db353d" }}>{title}</h3>
        <p style={{ marginTop: 0, marginBottom: "1rem", color: "#475569" }}>{message}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
          <button onClick={onCancel} style={{ padding: "0.6rem 0.9rem", borderRadius: 8, border: "1px solid #cbd5e1", background: "white", cursor: "pointer" }}>{cancelLabel}</button>
          <button onClick={onConfirm} style={{ padding: "0.6rem 0.9rem", borderRadius: 8, border: "none", background: "#db353d", color: "white", cursor: "pointer" }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
