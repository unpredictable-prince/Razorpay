import React, { useState } from "react";
import { User, Mail, Phone, MapPin, Save, ShieldCheck, LogOut } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function ProfilePage({ onLogout }) {
  const { customer, setCustomer, showToast } = useCart();

  const [form, setForm] = useState({
    name: customer?.name || "Sam",
    email: customer?.email || "sam@gmail.com",
    phone: customer?.phone || "+91 9876543210",
    address: customer?.address || "Flat 402, Sunset Heights, Bandra West, Mumbai, MH 400050",
  });

  const handleSave = (e) => {
    e.preventDefault();
    setCustomer(form);
    localStorage.setItem("aura_customer", JSON.stringify(form));
    showToast("Profile details updated successfully!");
  };

  const handleLogoutClick = () => {
    showToast("Logged out of customer session.");
    if (onLogout) onLogout();
  };

  return (
    <div style={{ paddingTop: "1.5rem", maxWidth: "680px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Customer Account Profile</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>Manage your shipping address, contact details, and account session</p>
        </div>

        <button
          onClick={handleLogoutClick}
          className="btn-secondary"
          style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px", background: "rgba(244, 63, 94, 0.12)", border: "1px solid rgba(244, 63, 94, 0.3)", color: "#f43f5e" }}
        >
          <LogOut size={16} />
          <span>Logout Account</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="checkout-card">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
          <div style={{ width: "4rem", height: "4rem", borderRadius: "50%", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.5rem" }}>
            {customer?.name?.charAt(0) || "U"}
          </div>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800 }}>{customer?.name}</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Email: <code>{customer?.email}</code> • Session Active
            </p>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            required
            className="form-input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              required
              className="form-input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              required
              className="form-input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Default Shipping Address</label>
          <textarea
            required
            rows={3}
            className="form-input"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: "1rem" }}>
          <Save size={18} />
          <span>Save Profile Changes</span>
        </button>
      </form>
    </div>
  );
}
