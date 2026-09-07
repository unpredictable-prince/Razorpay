import React, { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  UserPlus,
  LogIn,
  CheckCircle2,
  ArrowRight,
  ShoppingBag,
  Store,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { useCart } from "../context/CartContext";

export default function AuthPortalPage({ onLoginSuccess }) {
  const { setCustomer, showToast } = useCart();

  // Mode: "login" | "register"
  const [authMode, setAuthMode] = useState("login");

  // Role: "customer" | "merchant"
  const [selectedRole, setSelectedRole] = useState("customer");

  // Form inputs
  const [loginEmail, setLoginEmail] = useState("sam@gmail.com");
  const [loginPassword, setLoginPassword] = useState("customer123");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regStoreName, setRegStoreName] = useState("");
  const [regRazorpayKey, setRegRazorpayKey] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Demo Customers
  const DEMO_CUSTOMERS = [
    { name: "Sam", email: "sam@gmail.com", phone: "+91 9876543210", address: "Flat 402, Sunset Heights, Bandra West, Mumbai, MH 400050" },
    { name: "Priya Singh", email: "priya.singh@example.com", phone: "+91 9765432109", address: "88 Sector 15, Noida, UP 201301" },
    { name: "Ram Kumar", email: "ram.kumar@example.com", phone: "+91 9812345678", address: "12 Connaught Place, New Delhi, DL 110001" },
    { name: "Ayush Verma", email: "ayush.verma@example.com", phone: "+91 9988776655", address: "55 Marine Drive, Mumbai, MH 400020" },
  ];

  // Quick Demo Merchants
  const DEMO_MERCHANTS = [
    { name: "Vikram Sharma", store_name: "Aura Trends India", email: "admin@aurastore.com", phone: "+91 98765 43210", razorpay_key: "rzp_test_TUJ1LFMpXuNekP" },
    { name: "Rohan Gupta", store_name: "Apex Electronics", email: "rohan@apexelectronics.in", phone: "+91 98111 22334", razorpay_key: "rzp_test_APEX88900" },
  ];

  const handleRoleToggle = (role) => {
    setSelectedRole(role);
    setError("");
    if (role === "customer") {
      setLoginEmail("sam@gmail.com");
      setLoginPassword("customer123");
    } else {
      setLoginEmail("admin@aurastore.com");
      setLoginPassword("merchant123");
    }
  };

  const handleDemoSelectCustomer = (cust) => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setCustomer(cust);
      localStorage.setItem("aura_customer", JSON.stringify(cust));
      localStorage.setItem("aura_customer_logged_in", "true");
      showToast(`Signed in as Customer: ${cust.name}`);
      onLoginSuccess("customer", cust);
    }, 300);
  };

  const handleDemoSelectMerchant = (mch) => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const profile = {
        name: mch.name,
        store_name: mch.store_name,
        email: mch.email,
        phone: mch.phone,
        merchant_id: `mch_${mch.store_name.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Math.floor(1000 + Math.random() * 9000)}`,
        category: "E-Commerce & Digital Commerce",
        razorpay_key: mch.razorpay_key,
        webhook_secret: "recoverai_test_webhook_secret",
        plan: "Enterprise Autonomous Recovery",
        status: "Verified & Active",
        joined_date: "Just Now",
      };
      localStorage.setItem("recoverai_merchant_profile", JSON.stringify(profile));
      localStorage.setItem("recoverai_auth", "true");
      showToast(`Signed in as Merchant: ${mch.store_name}`);
      onLoginSuccess("merchant", profile);
    }, 300);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      if (selectedRole === "customer") {
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
        onLoginSuccess("customer", loggedUser);
      } else {
        const matchedMch = DEMO_MERCHANTS.find((m) => m.email.toLowerCase() === loginEmail.toLowerCase());
        const merchantProfile = matchedMch
          ? {
              name: matchedMch.name,
              store_name: matchedMch.store_name,
              email: matchedMch.email,
              phone: matchedMch.phone,
              merchant_id: "mch_aura_admin",
              category: "E-Commerce & Digital Commerce",
              razorpay_key: matchedMch.razorpay_key,
              webhook_secret: "recoverai_test_webhook_secret",
              plan: "Enterprise Autonomous Recovery",
              status: "Verified & Active",
              joined_date: "Just Now",
            }
          : {
              name: loginEmail.split("@")[0].toUpperCase(),
              store_name: "Aura Commerce Store",
              email: loginEmail,
              phone: "+91 9876543210",
              merchant_id: "mch_custom",
              category: "E-Commerce",
              razorpay_key: "rzp_test_TUJ1LFMpXuNekP",
              webhook_secret: "recoverai_test_webhook_secret",
              plan: "Enterprise Autonomous Recovery",
              status: "Verified & Active",
              joined_date: "Just Now",
            };

        localStorage.setItem("recoverai_merchant_profile", JSON.stringify(merchantProfile));
        localStorage.setItem("recoverai_auth", "true");
        showToast(`Welcome back Merchant: ${merchantProfile.store_name}!`);
        onLoginSuccess("merchant", merchantProfile);
      }
    }, 400);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (regPassword !== regConfirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      if (selectedRole === "customer") {
        if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword.trim()) {
          setError("Please complete all required Customer registration fields.");
          return;
        }

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
        onLoginSuccess("customer", newCustomer);
      } else {
        if (!regName.trim() || !regStoreName.trim() || !regEmail.trim() || !regPassword.trim()) {
          setError("Please complete all required Merchant registration fields.");
          return;
        }

        const newMerchant = {
          name: regName,
          store_name: regStoreName,
          email: regEmail,
          phone: regPhone || "+91 98765 43210",
          merchant_id: `mch_${regStoreName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Math.floor(1000 + Math.random() * 9000)}`,
          category: "E-Commerce & Digital Commerce",
          razorpay_key: regRazorpayKey || "rzp_test_TUJ1LFMpXuNekP",
          webhook_secret: "recoverai_test_webhook_secret",
          plan: "Enterprise Autonomous Recovery",
          status: "Verified & Active",
          joined_date: "Just Now",
        };

        localStorage.setItem("recoverai_merchant_profile", JSON.stringify(newMerchant));
        localStorage.setItem("recoverai_auth", "true");
        showToast(`Merchant account created for ${newMerchant.store_name}!`);
        onLoginSuccess("merchant", newMerchant);
      }
    }, 500);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at 50% 20%, #1e1b4b 0%, #0a0d14 70%)",
        padding: "24px",
        color: "#fff",
        position: "relative",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "rgba(18, 24, 36, 0.88)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "24px",
          padding: "36px 32px",
          backdropFilter: "blur(16px)",
          boxShadow: "0 30px 60px rgba(0, 0, 0, 0.6)",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 25px rgba(99, 102, 241, 0.5)",
              marginBottom: "4px",
            }}
          >
            <Sparkles size={28} color="#ffffff" />
          </div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              margin: 0,
              background: "linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Aura & RecoverAI Portal
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>Unified Customer & Merchant Platform</p>
        </div>

        {/* Tab 1: Auth Mode Switcher (Sign In vs Register) */}
        <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.05)", padding: "4px", borderRadius: "12px", gap: "4px" }}>
          <button
            type="button"
            onClick={() => { setAuthMode("login"); setError(""); }}
            style={{
              flex: 1,
              padding: "10px",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              background: authMode === "login" ? "#6366f1" : "transparent",
              color: authMode === "login" ? "#fff" : "#94a3b8",
              transition: "all 0.2s",
            }}
          >
            <LogIn size={16} />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => { setAuthMode("register"); setError(""); }}
            style={{
              flex: 1,
              padding: "10px",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              background: authMode === "register" ? "#6366f1" : "transparent",
              color: authMode === "register" ? "#fff" : "#94a3b8",
              transition: "all 0.2s",
            }}
          >
            <UserPlus size={16} />
            <span>Register</span>
          </button>
        </div>

        {/* Tab 2: Role Selector (Customer vs Merchant) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <button
            type="button"
            onClick={() => handleRoleToggle("customer")}
            style={{
              padding: "10px 12px",
              borderRadius: "10px",
              border: selectedRole === "customer" ? "2px solid #6366f1" : "1px solid rgba(255, 255, 255, 0.1)",
              background: selectedRole === "customer" ? "rgba(99, 102, 241, 0.15)" : "rgba(255, 255, 255, 0.03)",
              color: selectedRole === "customer" ? "#a5b4fc" : "#94a3b8",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <ShoppingBag size={16} color={selectedRole === "customer" ? "#818cf8" : "#64748b"} />
            <span>Customer (Buyer)</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleToggle("merchant")}
            style={{
              padding: "10px 12px",
              borderRadius: "10px",
              border: selectedRole === "merchant" ? "2px solid #a855f7" : "1px solid rgba(255, 255, 255, 0.1)",
              background: selectedRole === "merchant" ? "rgba(168, 85, 247, 0.15)" : "rgba(255, 255, 255, 0.03)",
              color: selectedRole === "merchant" ? "#c084fc" : "#94a3b8",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <Store size={16} color={selectedRole === "merchant" ? "#c084fc" : "#64748b"} />
            <span>Merchant (Seller)</span>
          </button>
        </div>

        {error && (
          <div style={{ background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.4)", color: "#f43f5e", padding: "10px 14px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* --- SIGN IN FORM --- */}
        {authMode === "login" ? (
          <>
            <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group">
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                  {selectedRole === "customer" ? "Customer Email" : "Merchant Business Email"}
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Mail size={18} style={{ position: "absolute", left: "14px", color: "#64748b" }} />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder={selectedRole === "customer" ? "sam@gmail.com" : "admin@aurastore.com"}
                    style={{ width: "100%", padding: "12px 14px 12px 42px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "10px", color: "#fff", fontSize: "0.92rem", outline: "none" }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Password</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Lock size={18} style={{ position: "absolute", left: "14px", color: "#64748b" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: "100%", padding: "12px 42px 12px 42px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "10px", color: "#fff", fontSize: "0.92rem", outline: "none" }}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "12px", background: "transparent", border: "none", color: "#64748b", cursor: "pointer" }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: selectedRole === "customer" ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" : "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 15px rgba(99, 102, 241, 0.4)",
                  marginTop: "4px",
                }}
              >
                <span>
                  {isSubmitting
                    ? "Signing In..."
                    : selectedRole === "customer"
                    ? "Sign In to Aura Store"
                    : "Sign In to Merchant Console"}
                </span>
                <ArrowRight size={18} />
              </button>
            </form>

            <div style={{ display: "flex", alignItems: "center", textAlign: "center", color: "#64748b", fontSize: "0.75rem", margin: "14px 0 8px 0" }}>
              <div style={{ flex: 1, borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}></div>
              <span style={{ padding: "0 10px" }}>QUICK DEMO SHORTCUTS</span>
              <div style={{ flex: 1, borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}></div>
            </div>

            {selectedRole === "customer" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {DEMO_CUSTOMERS.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleDemoSelectCustomer(c)}
                    style={{ padding: "10px 12px", background: "rgba(99, 102, 241, 0.12)", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: "10px", color: "#a5b4fc", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    <User size={15} color="#818cf8" />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
                {DEMO_MERCHANTS.map((m, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleDemoSelectMerchant(m)}
                    style={{ padding: "10px 14px", background: "rgba(168, 85, 247, 0.12)", border: "1px solid rgba(168, 85, 247, 0.3)", borderRadius: "10px", color: "#e9d5ff", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Store size={16} color="#c084fc" />
                      <span>{m.store_name} ({m.name})</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          /* --- REGISTER FORM --- */
          selectedRole === "customer" ? (
            <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="form-group">
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Full Name *</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <User size={18} style={{ position: "absolute", left: "14px", color: "#64748b" }} />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Ananya Sharma"
                    style={{ width: "100%", padding: "10px 14px 10px 42px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "10px", color: "#fff", fontSize: "0.88rem", outline: "none" }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div className="form-group">
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Email *</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ananya@example.com"
                    style={{ width: "100%", padding: "10px 12px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "10px", color: "#fff", fontSize: "0.85rem", outline: "none" }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Phone *</label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    style={{ width: "100%", padding: "10px 12px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "10px", color: "#fff", fontSize: "0.85rem", outline: "none" }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Shipping Address</label>
                <input
                  type="text"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="42 Park Avenue, Connaught Place, New Delhi"
                  style={{ width: "100%", padding: "10px 12px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "10px", color: "#fff", fontSize: "0.85rem", outline: "none" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div className="form-group">
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Password *</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: "100%", padding: "10px 12px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "10px", color: "#fff", fontSize: "0.85rem", outline: "none" }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Confirm *</label>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: "100%", padding: "10px 12px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "10px", color: "#fff", fontSize: "0.85rem", outline: "none" }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "0.92rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "4px" }}
              >
                <span>{isSubmitting ? "Creating Account..." : "Create Customer Account"}</span>
                <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            /* Merchant Register Form */
            <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="form-group">
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Full Name (Owner) *</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <User size={18} style={{ position: "absolute", left: "14px", color: "#64748b" }} />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Vikram Sharma"
                    style={{ width: "100%", padding: "10px 14px 10px 42px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "10px", color: "#fff", fontSize: "0.88rem", outline: "none" }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Store / Business Name *</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Store size={18} style={{ position: "absolute", left: "14px", color: "#64748b" }} />
                  <input
                    type="text"
                    value={regStoreName}
                    onChange={(e) => setRegStoreName(e.target.value)}
                    placeholder="e.g. Aura Fashion & Electronics"
                    style={{ width: "100%", padding: "10px 14px 10px 42px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "10px", color: "#fff", fontSize: "0.88rem", outline: "none" }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div className="form-group">
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Business Email *</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="admin@aurastore.com"
                    style={{ width: "100%", padding: "10px 12px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "10px", color: "#fff", fontSize: "0.85rem", outline: "none" }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Razorpay Key ID</label>
                  <input
                    type="text"
                    value={regRazorpayKey}
                    onChange={(e) => setRegRazorpayKey(e.target.value)}
                    placeholder="rzp_test_..."
                    style={{ width: "100%", padding: "10px 12px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "10px", color: "#fff", fontSize: "0.85rem", outline: "none" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div className="form-group">
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Password *</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: "100%", padding: "10px 12px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "10px", color: "#fff", fontSize: "0.85rem", outline: "none" }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Confirm *</label>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: "100%", padding: "10px 12px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "10px", color: "#fff", fontSize: "0.85rem", outline: "none" }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "0.92rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "4px" }}
              >
                <span>{isSubmitting ? "Registering Merchant..." : "Register Merchant & Launch Console"}</span>
                <ArrowRight size={18} />
              </button>
            </form>
          )
        )}

        {/* Security & System Features */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.76rem", color: "#64748b" }}>
            <CheckCircle2 size={14} color="#10b981" />
            <span>Razorpay Test Sandbox Connected</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.76rem", color: "#64748b" }}>
            <CheckCircle2 size={14} color="#10b981" />
            <span>RecoverAI Autonomous Agent Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
