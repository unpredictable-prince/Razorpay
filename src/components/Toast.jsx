import React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function Toast() {
  const { toast } = useCart();
  if (!toast) return null;

  const bgMap = {
    success: "#10b981",
    error: "#ef4444",
    info: "#3b82f6",
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        zIndex: 100,
        backgroundColor: bgMap[toast.type] || "#10b981",
        color: "#ffffff",
        padding: "0.85rem 1.25rem",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        fontWeight: 600,
        fontSize: "0.95rem",
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      {toast.type === "error" ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
      <span>{toast.message}</span>
    </div>
  );
}
