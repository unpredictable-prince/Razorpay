import React, { useState, useEffect } from "react";
import { ShoppingCart, User, Store, Bell, CheckCircle2, AlertTriangle, X, Sparkles, LogOut, UserCheck } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function Navbar({ activePage, setActivePage, onLogout }) {
  const { cartCount, openCart, customer, showToast } = useCart();
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/notifications?recipient_type=customer&limit=5")
      .then((res) => {
        if (res.ok) return res.json();
        return [];
      })
      .then((data) => setNotifications(data))
      .catch(() => setNotifications([]));
  }, [activePage]);

  const unreadCount = notifications.filter((n) => n.is_read === 0).length;

  const handleLogoutClick = () => {
    showToast("Logged out of Aura Store.");
    if (onLogout) onLogout();
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        {/* Brand Logo */}
        <button onClick={() => setActivePage("home")} className="brand-logo">
          <div className="brand-icon-wrapper">
            <Sparkles size={20} color="#fff" />
          </div>
          <span>AURA</span>
          <span className="brand-badge">STORE</span>
        </button>

        {/* Nav Links */}
        <div className="nav-links">
          <button
            onClick={() => setActivePage("home")}
            className={`nav-link ${activePage === "home" ? "active" : ""}`}
          >
            Home
          </button>
          <button
            onClick={() => setActivePage("products")}
            className={`nav-link ${activePage === "products" ? "active" : ""}`}
          >
            Products
          </button>
          <button
            onClick={() => setActivePage("my-orders")}
            className={`nav-link ${activePage === "my-orders" ? "active" : ""}`}
          >
            My Orders
          </button>
          <button
            onClick={() => setActivePage("profile")}
            className={`nav-link ${activePage === "profile" ? "active" : ""}`}
          >
            Profile
          </button>
        </div>

        {/* Actions & Cart */}
        <div className="nav-actions" style={{ position: "relative" }}>
          {/* Customer Notifications Dropdown */}
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            title="Customer Status Notifications"
            style={{
              position: "relative",
              padding: "0.5rem",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.05)",
              border: "var(--glass-border)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-2px",
                  right: "-2px",
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  background: "var(--warning)",
                  color: "#000",
                  fontSize: "0.65rem",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div
              style={{
                position: "absolute",
                top: "3rem",
                right: "6rem",
                width: "320px",
                background: "var(--bg-surface)",
                border: "var(--glass-border)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-subtle)",
                padding: "1rem",
                zIndex: 100,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", borderBottom: "var(--glass-border)", paddingBottom: "0.5rem" }}>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff" }}>Payment Status Alerts</h4>
                <button onClick={() => setShowNotifDropdown(false)} style={{ color: "var(--text-muted)" }}>
                  <X size={16} />
                </button>
              </div>

              {notifications.length === 0 ? (
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center", padding: "1rem 0" }}>
                  No payment alerts.
                </p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} style={{ padding: "0.5rem 0", borderBottom: "var(--glass-border)", fontSize: "0.8rem" }}>
                    <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.35rem", color: "#fff" }}>
                      {n.severity === "success" ? <CheckCircle2 size={14} color="var(--success)" /> : <AlertTriangle size={14} color="var(--warning)" />}
                      <span>{n.title}</span>
                    </div>
                    <p style={{ color: "var(--text-muted)", marginTop: "0.2rem" }}>{n.message}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Customer Account Avatar Button (Navigates to Profile) */}
          <button
            onClick={() => setActivePage("profile")}
            title="Customer Profile & Account Details"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              background: "rgba(99, 102, 241, 0.12)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              padding: "0.4rem 0.85rem",
              borderRadius: "var(--radius-full)",
              cursor: "pointer",
            }}
          >
            <UserCheck size={16} color="var(--primary)" />
            <span style={{ color: "#fff" }}>{customer?.name?.split(" ")[0] || "Account"}</span>
          </button>

          {/* Cart Button */}
          <button onClick={openCart} className="cart-btn">
            <ShoppingCart size={18} />
            <span>Cart</span>
            {cartCount > 0 && <span className="cart-count-badge">{cartCount}</span>}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogoutClick}
            title="Logout of Aura Store"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.45rem 0.85rem",
              borderRadius: "var(--radius-md)",
              background: "rgba(244, 63, 94, 0.12)",
              border: "1px solid rgba(244, 63, 94, 0.3)",
              color: "#f43f5e",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
