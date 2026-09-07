import React, { useState } from "react";
import { Play, RotateCcw, AlertTriangle, Shield, CheckCircle2, Zap } from "lucide-react";

export default function DemoController({ onTriggerScenario, onResetDemo }) {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const API_BASE = import.meta.env.VITE_RECOVERAI_API_URL || (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "http://localhost:8000" : "");

  const handleSimulate = async (scenario) => {
    setIsSimulating(true);
    try {
      await fetch(`${API_BASE}/demo/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario,
          customer_name: "Sam",
          customer_email: "sam@gmail.com",
          customer_phone: "9876543210",
          amount: 299900,
        }),
      });
      if (onTriggerScenario) onTriggerScenario(scenario);
    } catch (err) {
      console.error("Demo simulation error:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  const confirmReset = async () => {
    try {
      await fetch(`${API_BASE}/demo/reset`, { method: "POST" });
      setIsResetModalOpen(false);
      if (onResetDemo) onResetDemo();
    } catch (err) {
      console.error("Reset error:", err);
    }
  };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
        border: "1px solid #4338ca",
        borderRadius: "12px",
        padding: "1rem 1.5rem",
        marginBottom: "1.5rem",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Zap size={22} color="#818cf8" />
        <div>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#f8fafc", margin: 0 }}>
            RecoverAI Interactive Demo Controller
          </h3>
          <p style={{ fontSize: "0.8rem", color: "#a5b4fc", margin: "0.15rem 0 0 0" }}>
            Trigger payment failure scenarios through the real backend pipeline for customer <strong>Sam</strong>
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" }}>
        <button
          onClick={() => handleSimulate("bank_server_down")}
          disabled={isSimulating}
          style={{
            background: "#4f46e5",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.8rem",
            padding: "0.45rem 0.85rem",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Play size={14} />
          <span>Run Demo (Bank Failure)</span>
        </button>

        <button
          onClick={() => handleSimulate("card_expired")}
          disabled={isSimulating}
          style={{
            background: "#334155",
            color: "#e2e8f0",
            fontWeight: 600,
            fontSize: "0.8rem",
            padding: "0.45rem 0.75rem",
            borderRadius: "6px",
            border: "1px solid #475569",
            cursor: "pointer",
          }}
        >
          Card Expired
        </button>

        <button
          onClick={() => handleSimulate("customer_cancelled")}
          disabled={isSimulating}
          style={{
            background: "#334155",
            color: "#e2e8f0",
            fontWeight: 600,
            fontSize: "0.8rem",
            padding: "0.45rem 0.75rem",
            borderRadius: "6px",
            border: "1px solid #475569",
            cursor: "pointer",
          }}
        >
          Customer Cancelled
        </button>

        <button
          onClick={() => handleSimulate("authentication_failed")}
          disabled={isSimulating}
          style={{
            background: "#334155",
            color: "#e2e8f0",
            fontWeight: 600,
            fontSize: "0.8rem",
            padding: "0.45rem 0.75rem",
            borderRadius: "6px",
            border: "1px solid #475569",
            cursor: "pointer",
          }}
        >
          Auth Failure
        </button>

        <button
          onClick={() => setIsResetModalOpen(true)}
          style={{
            background: "transparent",
            color: "#ef4444",
            fontWeight: 600,
            fontSize: "0.8rem",
            padding: "0.45rem 0.75rem",
            borderRadius: "6px",
            border: "1px solid #ef4444",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            cursor: "pointer",
          }}
        >
          <RotateCcw size={14} />
          <span>Reset Demo</span>
        </button>
      </div>

      {/* Confirmation Modal for Reset */}
      {isResetModalOpen && (
        <div className="modal-overlay" onClick={() => setIsResetModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <AlertTriangle size={24} color="#ef4444" />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Reset Demo Environment?</h3>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              This will remove demo test records and notifications while keeping core application schema and source code completely intact.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button className="btn-secondary" onClick={() => setIsResetModalOpen(false)}>
                Cancel
              </button>
              <button
                onClick={confirmReset}
                style={{ background: "#ef4444", color: "#fff", border: "none", padding: "0.45rem 1rem", borderRadius: "6px", fontWeight: 700 }}
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
