import React from "react";
import { Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function CartPage({ onProceedToCheckout, onNavigate }) {
  const { cart, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();

  const formattedTotal = `₹${(cartTotal / 100).toLocaleString("en-IN")}`;

  if (cart.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "5rem 1rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", marginTop: "2rem" }}>
        <ShoppingBag size={56} style={{ color: "var(--text-light)", marginBottom: "1rem" }} />
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Your cart is currently empty</h2>
        <p style={{ color: "var(--text-muted)", marginTop: "0.5rem", marginBottom: "1.5rem" }}>
          Discover our latest devices and accessories to get started.
        </p>
        <button onClick={() => onNavigate("products")} className="btn-primary">
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: "1.5rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "1.5rem" }}>Shopping Cart</h1>

      <div className="checkout-grid">
        {/* Cart Item List */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "1.5rem" }}>
          {cart.map((item) => (
            <div key={item.product_id} className="cart-item">
              <img src={item.image} alt={item.name} className="cart-item-img" style={{ width: "90px", height: "90px" }} />
              <div className="cart-item-info">
                <h3 className="cart-item-name">{item.name}</h3>
                <div className="cart-item-price" style={{ fontSize: "1.05rem" }}>
                  ₹{((item.price * item.quantity) / 100).toLocaleString("en-IN")}
                </div>
                <div className="qty-controls" style={{ marginTop: "0.75rem" }}>
                  <button className="qty-btn" onClick={() => updateQuantity(item.product_id, -1)}>
                    -
                  </button>
                  <span style={{ fontWeight: 700, padding: "0 0.5rem" }}>{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQuantity(item.product_id, 1)}>
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    style={{ marginLeft: "auto", color: "var(--danger)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.85rem", fontWeight: 600 }}
                  >
                    <Trash2 size={16} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
            <button onClick={clearCart} style={{ color: "var(--text-muted)", fontSize: "0.85rem", textDecoration: "underline" }}>
              Clear Cart
            </button>
            <button onClick={() => onNavigate("products")} className="btn-secondary" style={{ padding: "0.4rem 0.85rem", fontSize: "0.85rem" }}>
              Continue Shopping
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="checkout-card">
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.25rem" }}>Order Summary</h2>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem", fontSize: "0.95rem" }}>
            <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
            <span style={{ fontWeight: 700 }}>{formattedTotal}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem", fontSize: "0.95rem" }}>
            <span style={{ color: "var(--text-muted)" }}>Shipping</span>
            <span style={{ fontWeight: 700, color: "var(--success)" }}>FREE</span>
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginTop: "1rem", display: "flex", justifyContent: "space-between", fontSize: "1.2rem", fontWeight: 800 }}>
            <span>Total:</span>
            <span>{formattedTotal}</span>
          </div>

          <button
            onClick={onProceedToCheckout}
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: "1.5rem" }}
          >
            <span>Checkout Now</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
