import React, { useState, useEffect } from "react";
import { X, Bell, CheckCheck, AlertCircle, CheckCircle2, AlertTriangle, Info, ArrowRight } from "lucide-react";
import { formatISTTimeOnly } from "../utils/dateUtils";

export default function NotificationDrawer({ isOpen, onClose, onSelectTransaction, onOpenFullPage }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const API_BASE = "http://localhost:8000";

  const fetchNotifications = () => {
    setLoading(true);
    fetch(`${API_BASE}/notifications?limit=30`)
      .then((res) => res.json())
      .then((data) => setNotifications(data))
      .catch((err) => console.error("Error fetching notifications:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch(`${API_BASE}/notifications/read-all`, { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotifs = notifications.filter((n) => {
    if (filter === "unread") return n.is_read === 0;
    return true;
  });

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "success":
        return <CheckCircle2 size={18} color="var(--success, #10b981)" />;
      case "warning":
        return <AlertTriangle size={18} color="var(--warning, #f59e0b)" />;
      case "error":
        return <AlertCircle size={18} color="var(--danger, #ef4444)" />;
      default:
        return <Info size={18} color="var(--primary, #6366f1)" />;
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(6px)",
          zIndex: 999,
        }}
      />

      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          maxWidth: "460px",
          background: "#0f172a",
          color: "#f8fafc",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-10px 0 25px rgba(0,0,0,0.5)",
          borderLeft: "1px solid #1e293b",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #1e293b",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Bell size={20} color="#6366f1" />
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Merchant Notifications</h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              onClick={handleMarkAllRead}
              title="Mark all as read"
              style={{
                fontSize: "0.75rem",
                color: "#94a3b8",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                padding: "0.25rem 0.5rem",
                borderRadius: "4px",
                border: "1px solid #334155",
              }}
            >
              <CheckCheck size={14} />
              <span>Mark All Read</span>
            </button>

            <button onClick={onClose} style={{ color: "#94a3b8", padding: "0.25rem" }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Sub-Header Filter */}
        <div style={{ padding: "0.75rem 1.5rem", background: "#1e293b", display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setFilter("all")}
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              padding: "0.25rem 0.75rem",
              borderRadius: "20px",
              background: filter === "all" ? "#6366f1" : "transparent",
              color: filter === "all" ? "#fff" : "#94a3b8",
            }}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              padding: "0.25rem 0.75rem",
              borderRadius: "20px",
              background: filter === "unread" ? "#6366f1" : "transparent",
              color: filter === "unread" ? "#fff" : "#94a3b8",
            }}
          >
            Unread
          </button>
        </div>

        {/* List Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.5rem" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
              Loading alerts...
            </div>
          ) : filteredNotifs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
              No notifications found.
            </div>
          ) : (
            filteredNotifs.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (n.payment_id) onSelectTransaction(n.payment_id);
                }}
                style={{
                  padding: "1rem",
                  marginBottom: "0.75rem",
                  borderRadius: "8px",
                  background: n.is_read ? "#1e293b" : "#0f172a",
                  border: n.is_read ? "1px solid #334155" : "1px solid #6366f1",
                  cursor: n.payment_id ? "pointer" : "default",
                  position: "relative",
                  transition: "all 0.2s ease",
                }}
              >
                {n.is_read === 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "1rem",
                      right: "1rem",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#ef4444",
                    }}
                  />
                )}

                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  {getSeverityIcon(n.severity)}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#f8fafc" }}>{n.title}</h4>
                      {n.is_read === 0 && (
                        <button
                          onClick={(e) => handleMarkAsRead(n.id, e)}
                          title="Mark read"
                          style={{ color: "#64748b", padding: "2px" }}
                        >
                          <CheckCheck size={14} />
                        </button>
                      )}
                    </div>

                    <p style={{ fontSize: "0.8rem", color: "#cbd5e1", margin: "0.35rem 0" }}>{n.message}</p>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748b", marginTop: "0.5rem" }}>
                      <span>{formatISTTimeOnly(n.created_at)}</span>
                      {n.payment_id && (
                        <span style={{ fontFamily: "monospace", color: "#818cf8" }}>{n.payment_id}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #1e293b", background: "#1e293b" }}>
          <button
            onClick={() => {
              onClose();
              onOpenFullPage();
            }}
            style={{
              width: "100%",
              padding: "0.65rem",
              background: "#334155",
              color: "#fff",
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <span>Open Notification Center</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
