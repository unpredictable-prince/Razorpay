import React, { useState } from "react";
import { ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import { useCart } from "../context/CartContext";
import { createOrder } from "../services/api";

export default function CheckoutPage({ onNavigate, onOrderCreated }) {
  const { cart, cartTotal, customer, setCustomer, showToast } = useCart();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: customer?.name || "Rahul Sharma",
    email: customer?.email || "rahul.sharma@example.com",
    phone: customer?.phone || "+919876543210",
    address: customer?.address || "42 MG Road, Koramangala, Bengaluru, KA 560034",
  });

  const formattedTotal = `₹${(cartTotal / 100).toLocaleString("en-IN")}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      showToast("Please complete all shipping details", "error");
      return;
    }

    setSubmitting(true);
    try {
      setCustomer(formData);
      const orderPayload = {
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        shipping_address: formData.address,
        items: cart,
      };
      const createdOrder = await createOrder(orderPayload);
      showToast("Order placed! Proceeding to payment...");
      onOrderCreated(createdOrder);
    } catch (err) {
      console.error("Order creation error:", err);
      showToast("Failed to create order. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ paddingTop: "1.5rem" }}>
      <button
        onClick={() => onNavigate("cart")}
        className="btn-secondary"
        style={{ marginBottom: "1.5rem", padding: "0.5rem 1rem", fontSize: "0.9rem" }}
      >
        <ArrowLeft size={16} />
        <span>Return to Cart</span>
      </button>

      <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "1.5rem" }}>Shipping & Checkout</h1>

      <form onSubmit={handleSubmit} className="checkout-grid">
        {/* Customer Form */}
        <div className="checkout-card">
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.25rem" }}>Customer Shipping Information</h2>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              required
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Rahul Sharma"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                required
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="rahul@example.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                required
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+919876543210"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Delivery Address</label>
            <textarea
              required
              rows={3}
              className="form-input"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="House/Flat No., Street, City, State, Pincode"
            />
          </div>

          <div style={{ background: "var(--border-light)", padding: "1rem", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "1rem" }}>
            <Lock size={18} color="var(--primary)" />
            <span>Razorpay TEST MODE: Payment info is encrypted and verified server-side.</span>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="checkout-card">
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.25rem" }}>Order Summary ({cart.length})</h2>

          <div style={{ maxHeight: "240px", overflowY: "auto", marginBottom: "1rem" }}>
            {cart.map((item) => (
              <div key={item.product_id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem", fontSize: "0.9rem" }}>
                <span style={{ fontWeight: 600 }}>{item.name} × {item.quantity}</span>
                <span style={{ fontWeight: 700 }}>₹{((item.price * item.quantity) / 100).toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", display: "flex", justifyContent: "space-between", fontSize: "1.25rem", fontWeight: 800 }}>
            <span>Total Payable</span>
            <span style={{ color: "var(--primary)" }}>{formattedTotal}</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: "1.5rem" }}
          >
            <ShieldCheck size={18} />
            <span>{submitting ? "Creating Order..." : "Proceed to Payment"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
