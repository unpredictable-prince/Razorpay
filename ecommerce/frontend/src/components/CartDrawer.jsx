import React from "react";
import { X, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function CartDrawer({ onProceedToCheckout }) {
  const { isCartOpen, closeCart, cart, updateQuantity, removeFromCart, cartTotal } = useCart();

  if (!isCartOpen) return null;

  const formattedTotal = `₹${(cartTotal / 100).toLocaleString("en-IN")}`;

  return (
    <div className="drawer-overlay" onClick={closeCart}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "var(--glass-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <ShoppingBag size={20} color="var(--primary)" />
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", margin: 0 }}>
              Your Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
            </h2>
          </div>
          <button onClick={closeCart} style={{ color: "var(--text-muted)", padding: "0.25rem" }}>
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body */}
        <div style={{ padding: "1.5rem", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--text-muted)" }}>
              <ShoppingBag size={48} style={{ margin: "0 auto 1rem auto", opacity: 0.3 }} />
              <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "#fff" }}>Your cart is empty</p>
              <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                Browse our catalog and add products to start shopping.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product_id}
                style={{
                  display: "flex",
                  gap: "1rem",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "var(--glass-border)",
                  padding: "0.85rem",
                  borderRadius: "var(--radius-md)",
                  alignItems: "center",
                }}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  style={{ width: "64px", height: "64px", objectFit: "contain", background: "#0f172a", borderRadius: "var(--radius-sm)", padding: "0.35rem" }}
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff", margin: "0 0 0.25rem 0" }}>{item.name}</h4>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--primary)" }}>
                    ₹{((item.price * item.quantity) / 100).toLocaleString("en-IN")}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "0.5rem" }}>
                    <button
                      onClick={() => updateQuantity(item.product_id, -1)}
                      style={{ background: "rgba(255, 255, 255, 0.08)", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}
                    >
                      -
                    </button>
                    <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "#fff" }}>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product_id, 1)}
                      style={{ background: "rgba(255, 255, 255, 0.08)", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}
                    >
                      +
                    </button>

                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      style={{ marginLeft: "auto", color: "var(--danger)", padding: "0.25rem" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {cart.length > 0 && (
          <div style={{ padding: "1.5rem", borderTop: "var(--glass-border)", background: "rgba(17, 24, 39, 0.95)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem", fontWeight: 800, color: "#fff", marginBottom: "1.25rem" }}>
              <span>Subtotal:</span>
              <span style={{ color: "var(--primary)" }}>{formattedTotal}</span>
            </div>
            <button
              onClick={() => {
                closeCart();
                onProceedToCheckout();
              }}
              className="btn-hero-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
