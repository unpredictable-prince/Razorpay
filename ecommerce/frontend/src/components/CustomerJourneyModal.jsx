import React, { useState, useEffect } from "react";
import { X, User, ShoppingBag, AlertCircle, CheckCircle2, Clock, ShieldCheck, ArrowRight } from "lucide-react";
import { formatISTDateTime } from "../utils/dateUtils";

export default function CustomerJourneyModal({ customerId, onClose }) {
  const [journeyData, setJourneyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customerId) {
      setLoading(true);
      const API_BASE = import.meta.env.VITE_RECOVERAI_API_URL || (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "http://localhost:8000" : "");
      fetch(`${API_BASE}/transactions/customer/${customerId}`)
        .then((res) => res.json())
        .then((data) => setJourneyData(data))
        .catch((err) => console.error("Error fetching customer journey:", err))
        .finally(() => setLoading(false));
    }
  }, [customerId]);

  if (!customerId) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "750px", width: "90%", padding: 0, overflow: "hidden" }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.75rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-card-header, rgba(255,255,255,0.02))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <User size={24} color="var(--primary)" />
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>
                Customer Payment Journey: {journeyData?.customer_name || customerId}
              </h2>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                ID: {customerId} • {journeyData?.customer_email || ""}
              </span>
            </div>
          </div>

          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.5rem 1.75rem", maxHeight: "520px", overflowY: "auto" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
              Loading customer timeline...
            </div>
          ) : !journeyData ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
              No customer record found.
            </div>
          ) : (
            <>
              {/* Profile Metrics Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                  background: "var(--bg-secondary)",
                  padding: "1rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Total Orders</span>
                  <p style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0.2rem 0 0 0" }}>{journeyData.total_orders}</p>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Failed Attempts</span>
                  <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--danger)", margin: "0.2rem 0 0 0" }}>
                    {journeyData.failed_attempts}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Total Spent</span>
                  <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--primary)", margin: "0.2rem 0 0 0" }}>
                    ₹{(journeyData.total_spent / 100).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Recovered Revenue</span>
                  <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--success)", margin: "0.2rem 0 0 0" }}>
                    ₹{(journeyData.recovered_revenue / 100).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Chronological Journey Timeline */}
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Clock size={16} color="var(--primary)" />
                Chronological Event Timeline
              </h3>

              <div style={{ position: "relative", paddingLeft: "1.5rem", borderLeft: "2px solid var(--border)" }}>
                {journeyData.timeline.map((evt, idx) => (
                  <div key={idx} style={{ marginBottom: "1.25rem", position: "relative" }}>
                    <div
                      style={{
                        position: "absolute",
                        left: "-1.95rem",
                        top: "0.15rem",
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background:
                          evt.event === "recovery_executed" || evt.event === "payment_captured"
                            ? "var(--success)"
                            : evt.event === "payment_failed"
                            ? "var(--danger)"
                            : "var(--primary)",
                      }}
                    />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: "0.9rem" }}>{evt.title}</strong>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {formatISTDateTime(evt.timestamp)}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.25rem 0 0 0" }}>{evt.details}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
