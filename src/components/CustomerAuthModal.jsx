import React, { useState } from "react";
import { User, Mail, Phone, Lock, Eye, EyeOff, Sparkles, X, UserPlus, LogIn, CheckCircle2, MapPin, ArrowRight } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function CustomerAuthModal({ isOpen, onClose }) {
  const { setCustomer, showToast } = useCart();
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"

  // Login Form State
  const [loginEmail, setLoginEmail] = useState("sam@gmail.com");
  const [loginPassword, setLoginPassword] = useState("customer123");

  // Register Form State
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Preset quick demo customers for fast testing
  const DEMO_CUSTOMERS = [
    { name: "Sam", email: "sam@gmail.com", phone: "+91 9876543210", address: "Flat 402, Sunset Heights, Bandra West, Mumbai, MH 400050" },
    { name: "Priya Singh", email: "priya.singh@example.com", phone: "+91 9765432109", address: "88 Sector 15, Noida, UP 201301" },
    { name: "Ram Kumar", email: "ram.kumar@example.com", phone: "+91 9812345678", address: "12 Connaught Place, New Delhi, DL 110001" },
    { name: "Ayush Verma", email: "ayush.verma@example.com", phone: "+91 9988776655", address: "55 Marine Drive, Mumbai, MH 400020" },
  ];

  const handleSelectDemoCustomer = (cust) => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setCustomer(cust);
      localStorage.setItem("aura_customer", JSON.stringify(cust));
      localStorage.setItem("aura_customer_logged_in", "true");
      showToast(`Signed in as ${cust.name}`);
      onClose();
    }, 400);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      // Check if email matches one of preset demo customers or use custom
      const matched = DEMO_CUSTOMERS.find((c) => c.email.toLowerCase() === loginEmail.toLowerCase());
      const loggedUser = matched || {
        name: loginEmail.split("@")[0].toUpperCase(),
        email: loginEmail,
        phone: "+91 9876543210",
        address: "74 Park Street, Kolkata, WB 700016",
      };

      setCustomer(loggedUser);
      localStorage.setItem("aura_customer", JSON.stringify(loggedUser));
      localStorage.setItem("aura_customer_logged_in", "true");
      showToast(`Welcome back, ${loggedUser.name}!`);
      onClose();
    }, 500);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      const newCustomer = {
        name: regName,
        email: regEmail,
        phone: regPhone,
        address: regAddress || "15 MG Road, Indiranagar, Bengaluru, KA 560038",
        customer_id: `cust_aura_${Math.floor(1000 + Math.random() * 9000)}`,
        joined: "Just Now",
      };

      setCustomer(newCustomer);
      localStorage.setItem("aura_customer", JSON.stringify(newCustomer));
      localStorage.setItem("aura_customer_logged_in", "true");
      showToast(`Registration complete! Welcome ${newCustomer.name}`);
      onClose();
    }, 600);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(6px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "460px", width: "100%", background: "#0a0f1d", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "20px", padding: "30px 24px", boxShadow: "0 25px 50px rgba(0,0,0,0.6)", color: "#fff" }}>
        
        {/* Modal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800, margin: 0, background: "linear-gradient(135deg, #fff 0%, #cbd5e1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Aura Store Portal
              </h2>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>Customer Sign In & Registration</p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}>
            <X size={20} />
          </button>
        </div>

        {/* Auth Tab Switcher */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", padding: "4px", borderRadius: "10px", gap: "4px", marginBottom: "18px" }}>
          <button
            type="button"
            onClick={() => { setAuthMode("login"); setError(""); }}
            style={{ flex: 1, padding: "8px", border: "none", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", background: authMode === "login" ? "#6366f1" : "transparent", color: authMode === "login" ? "#fff" : "#94a3b8", transition: "all 0.2s" }}
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => { setAuthMode("register"); setError(""); }}
            style={{ flex: 1, padding: "8px", border: "none", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", background: authMode === "register" ? "#6366f1" : "transparent", color: authMode === "register" ? "#fff" : "#94a3b8", transition: "all 0.2s" }}
          >
            <UserPlus size={15} />
            <span>Register</span>
          </button>
        </div>

        {error && (
          <div style={{ background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.4)", color: "#f43f5e", padding: "10px 12px", borderRadius: "8px", fontSize: "0.82rem", fontWeight: 600, marginBottom: "14px" }}>
            {error}
          </div>
        )}

        {/* --- SIGN IN MODE --- */}
        {authMode === "login" ? (
          <>
            <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="form-group">
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Customer Email</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Mail size={16} style={{ position: "absolute", left: "12px", color: "#64748b" }} />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="sam@gmail.com"
                    style={{ width: "100%", padding: "10px 12px 10px 38px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", color: "#fff", fontSize: "0.9rem", outline: "none" }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Password</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Lock size={16} style={{ position: "absolute", left: "12px", color: "#64748b" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: "100%", padding: "10px 38px 10px 38px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", color: "#fff", fontSize: "0.9rem", outline: "none" }}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "10px", background: "transparent", border: "none", color: "#64748b", cursor: "pointer" }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.92rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "6px" }}>
                <span>{isSubmitting ? "Signing In..." : "Sign In to Aura Store"}</span>
                <ArrowRight size={16} />
              </button>
            </form>

            <div style={{ display: "flex", alignItems: "center", textAlign: "center", color: "#64748b", fontSize: "0.75rem", margin: "16px 0 12px 0" }}>
              <div style={{ flex: 1, borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}></div>
              <span style={{ padding: "0 10px" }}>OR QUICK DEMO LOGIN</span>
              <div style={{ flex: 1, borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}></div>
            </div>

            {/* Quick Demo Customers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {DEMO_CUSTOMERS.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectDemoCustomer(c)}
                  style={{ padding: "8px 10px", background: "rgba(99, 102, 241, 0.12)", border: "1px solid rgba(99, 102, 241, 0.25)", borderRadius: "8px", color: "#a5b4fc", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <User size={14} color="#818cf8" />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          /* --- REGISTER MODE --- */
          <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="form-group">
              <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Full Name *</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <User size={16} style={{ position: "absolute", left: "12px", color: "#64748b" }} />
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Ananya Sharma"
                  style={{ width: "100%", padding: "10px 12px 10px 38px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", color: "#fff", fontSize: "0.9rem", outline: "none" }}
                  required
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div className="form-group">
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Email *</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="ananya@example.com"
                  style={{ width: "100%", padding: "10px 12px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", color: "#fff", fontSize: "0.85rem", outline: "none" }}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Phone *</label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  style={{ width: "100%", padding: "10px 12px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", color: "#fff", fontSize: "0.85rem", outline: "none" }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Shipping Address</label>
              <input
                type="text"
                value={regAddress}
                onChange={(e) => setRegAddress(e.target.value)}
                placeholder="42 Park Avenue, Connaught Place, New Delhi"
                style={{ width: "100%", padding: "10px 12px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", color: "#fff", fontSize: "0.85rem", outline: "none" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div className="form-group">
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Password *</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: "100%", padding: "10px 12px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", color: "#fff", fontSize: "0.85rem", outline: "none" }}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Confirm *</label>
                <input
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: "100%", padding: "10px 12px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", color: "#fff", fontSize: "0.85rem", outline: "none" }}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.92rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "6px" }}>
              <span>{isSubmitting ? "Creating Account..." : "Create Aura Account"}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
