import React, { useState, useEffect } from "react";
import { Activity, Play, CheckCircle2, Clock, AlertTriangle, ShieldCheck, Zap, ArrowRight, User } from "lucide-react";
import { formatISTTimeOnly } from "../utils/dateUtils";

export default function LiveRecoveryStream({ onSelectTransaction, refreshTrigger }) {
  const [events, setEvents] = useState([]);
  const [activeStage, setActiveStage] = useState(0);

  const stages = [
    { id: 1, label: "Customer Checkout", desc: "Aura Store Order" },
    { id: 2, label: "Razorpay Test Mode", desc: "Payment Attempt" },
    { id: 3, label: "Webhook Ingestion", desc: "POST /webhooks/razorpay" },
    { id: 4, label: "HMAC Verification", desc: "SHA-256 Signature Check" },
    { id: 5, label: "Recovery Analyzer", desc: "Rule Diagnostics" },
    { id: 6, label: "AI Recovery Agent", desc: "Strategy Recommendation" },
    { id: 7, label: "Policy Guard Engine", desc: "Financial & Retry Limits" },
    { id: 8, label: "Recovery Execution", desc: "Automated Action" },
    { id: 9, label: "SQLite Storage", desc: "recoverai.db" },
    { id: 10, label: "Notifications", desc: "Merchant + Customer Alert" },
  ];

  const API_BASE = import.meta.env.VITE_RECOVERAI_API_URL || (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "http://localhost:8000" : "");

  const fetchLiveEvents = () => {
    fetch(`${API_BASE}/transactions/`)
      .then((res) => res.json())
      .then((txs) => {
        const sorted = txs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);
        setEvents(sorted);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchLiveEvents();
    const interval = setInterval(fetchLiveEvents, 5000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const getSeverityBadge = (status, recStatus) => {
    if (status === "captured") return <span className="badge badge-captured">SUCCESS</span>;
    if (recStatus === "executed" || recStatus === "recovered") return <span className="badge badge-captured">RECOVERED</span>;
    if (recStatus === "human_review") return <span className="badge badge-authorized">HUMAN REVIEW</span>;
    return <span className="badge badge-failed">FAILED</span>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Visual Sequential Pipeline Card */}
      <div className="card-panel" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>
              <Zap size={20} color="var(--color-brand)" />
              Real-Time Recovery Pipeline Inspector
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.25rem 0 0 0" }}>
              Sequential stage execution trace of incoming Razorpay payment events
            </p>
          </div>
          <div className="status-badge-online" style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}>
            <span className="pulse-dot"></span> Pipeline Active
          </div>
        </div>

        {/* Stages Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
          {stages.map((st, idx) => (
            <div
              key={st.id}
              style={{
                padding: "1rem",
                borderRadius: "10px",
                background: idx === activeStage ? "rgba(99, 102, 241, 0.18)" : "var(--bg-secondary)",
                border: idx === activeStage ? "1px solid var(--color-brand)" : "1px solid var(--border-color)",
                transition: "all 0.3s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.45rem" }}>
                <span
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    background: "var(--color-brand)",
                    color: "#fff",
                    fontSize: "0.85rem",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {st.id}
                </span>
                <span style={{ fontSize: "0.95rem", fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {st.label}
                </span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>{st.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Live Stream Audit Feed */}
      <div className="card-panel" style={{ padding: "1.75rem" }}>
        <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <Activity size={22} color="var(--color-brand)" />
          Live Event Audit Feed
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {events.map((tx) => (
            <div
              key={tx.id}
              onClick={() => onSelectTransaction(tx)}
              style={{
                padding: "1.25rem 1.5rem",
                borderRadius: "10px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                <User size={24} color="var(--color-brand)" />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                    <strong style={{ fontSize: "1.1rem" }}>{tx.customer_name || tx.customer_id}</strong>
                    <span style={{ fontSize: "0.92rem", fontFamily: "monospace", color: "var(--text-muted)" }}>
                      ({tx.payment_id})
                    </span>
                  </div>
                  <p style={{ fontSize: "0.98rem", color: "var(--text-secondary)", margin: "0.35rem 0 0 0" }}>
                    Order: <span style={{ fontFamily: "monospace", color: "var(--color-brand)" }}>{tx.order_id || "N/A"}</span> • Amount: <strong>₹{(tx.amount / 100).toFixed(2)}</strong> • Reason: <span style={{ color: tx.failure_reason ? 'var(--color-danger)' : 'var(--color-success)' }}>{tx.failure_reason || "captured"}</span>
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                {getSeverityBadge(tx.status, tx.recovery_status)}
                <span style={{ fontSize: "0.88rem", color: "var(--text-muted)", fontWeight: 600 }}>
                  {formatISTTimeOnly(tx.created_at)}
                </span>
                <ArrowRight size={18} color="var(--text-muted)" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
