import React, { useState, useEffect } from "react";
import { X, Bell, CheckCheck, AlertCircle, CheckCircle2, AlertTriangle, Info, Search, Filter } from "lucide-react";
import { formatISTDateTime } from "../utils/dateUtils";

export default function NotificationPageModal({ isOpen, onClose, onSelectTransaction }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const API_BASE = import.meta.env.VITE_RECOVERAI_API_URL || (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "http://localhost:8000" : "");

  const fetchNotifications = () => {
    setLoading(true);
    fetch(`${API_BASE}/notifications?limit=100`)
      .then((res) => res.json())
      .then((data) => setNotifications(data))
      .catch((err) => console.error("Error fetching notifications:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) fetchNotifications();
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
    if (unreadOnly && n.is_read !== 0) return false;

    if (activeTab === "FAILED PAYMENTS" && n.notification_type !== "payment_failed") return false;
    if (activeTab === "RECOVERIES" && n.notification_type !== "recovery_executed") return false;
    if (activeTab === "HUMAN REVIEW" && n.notification_type !== "human_review_required") return false;
    if (activeTab === "SYSTEM" && !["payment_captured", "payment_authorized"].includes(n.notification_type)) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        (n.payment_id && n.payment_id.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "success":
        return <span className="badge badge-captured">SUCCESS</span>;
      case "warning":
        return <span className="badge badge-authorized">WARNING</span>;
      case "error":
        return <span className="badge badge-failed">ERROR</span>;
      default:
        return <span className="badge" style={{ background: "#334155", color: "#94a3b8" }}>INFO</span>;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "800px", width: "90%", padding: 0, overflow: "hidden" }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: "1.5rem 2rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Bell size={24} color="var(--primary)" />
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Merchant Notification Center</h2>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                RecoverAI Event & Alert History
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={handleMarkAllRead}
              className="btn-secondary"
              style={{ fontSize: "0.85rem", padding: "0.4rem 0.85rem" }}
            >
              <CheckCheck size={16} />
              <span>Mark All as Read</span>
            </button>

            <button className="btn-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filters & Tabs Bar */}
        <div style={{ padding: "1rem 2rem", borderBottom: "1px solid var(--border)", background: "var(--bg-card-header, rgba(255,255,255,0.02))" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
            {["ALL", "FAILED PAYMENTS", "RECOVERIES", "HUMAN REVIEW", "SYSTEM"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "0.4rem 0.85rem",
                  borderRadius: "20px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  background: activeTab === tab ? "var(--primary)" : "var(--border-light, #1e293b)",
                  color: activeTab === tab ? "#fff" : "var(--text-muted)",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.4rem 0.75rem 0.4rem 2.25rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  background: "var(--bg-main)",
                  color: "inherit",
                  fontSize: "0.85rem",
                }}
              />
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
              />
              <span>Unread Only</span>
            </label>
          </div>
        </div>

        {/* Notifications Body */}
        <div style={{ maxHeight: "480px", overflowY: "auto", padding: "1.5rem 2rem" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
              Loading notifications...
            </div>
          ) : filteredNotifs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
              No notifications match your current filters.
            </div>
          ) : (
            filteredNotifs.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (n.payment_id) {
                    onClose();
                    onSelectTransaction(n.payment_id);
                  }
                }}
                style={{
                  padding: "1rem 1.25rem",
                  borderRadius: "8px",
                  marginBottom: "0.75rem",
                  background: n.is_read ? "transparent" : "rgba(99, 102, 241, 0.08)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: n.payment_id ? "pointer" : "default",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  {getSeverityBadge(n.severity)}
                  <div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>{n.title}</h4>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.25rem 0" }}>{n.message}</p>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {formatISTDateTime(n.created_at)}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  {n.payment_id && (
                    <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--primary)" }}>
                      {n.payment_id}
                    </span>
                  )}
                  {n.is_read === 0 && (
                    <button
                      onClick={(e) => handleMarkAsRead(n.id, e)}
                      style={{ color: "var(--text-muted)", padding: "0.25rem" }}
                      title="Mark as read"
                    >
                      <CheckCheck size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
