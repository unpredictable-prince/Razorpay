import React from "react";
import { Store, ShieldCheck, Truck, RefreshCw } from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#fff", fontWeight: 800, fontSize: "1.2rem", marginBottom: "0.75rem" }}>
            <Store size={22} color="var(--primary)" />
            <span>Aura Store</span>
          </div>
          <p style={{ maxWidth: "320px", fontSize: "0.85rem", lineHeight: "1.6" }}>
            Premium consumer electronics & lifestyle accessories. Integrated with Razorpay Payment Gateway Test Mode.
          </p>
        </div>

        <div>
          <h4 style={{ color: "#fff", fontWeight: 700, marginBottom: "0.75rem" }}>Shop & Discover</h4>
          <ul style={{ listStyle: "none", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <li>Audio & Headphones</li>
            <li>Wearables & Smartwatches</li>
            <li>Gaming & Accessories</li>
            <li>Power & Chargers</li>
          </ul>
        </div>

        <div>
          <h4 style={{ color: "#fff", fontWeight: 700, marginBottom: "0.75rem" }}>Customer Service</h4>
          <ul style={{ listStyle: "none", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <li>Express Delivery</li>
            <li>Instant Payment Processing</li>
            <li>Order Tracking</li>
            <li>Razorpay Test Sandbox</li>
          </ul>
        </div>
      </div>
      <div className="container" style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #1e293b", textAlign: "center", fontSize: "0.8rem" }}>
        © {new Date().getFullYear()} Aura Store Inc. All rights reserved. Razorpay Test Mode Demo Application.
      </div>
    </footer>
  );
}
