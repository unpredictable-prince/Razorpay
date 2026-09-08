import React from "react";
import { Trash2, ArrowRight, ShoppingBag, Plus, Minus } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function CartPage({ onProceedToCheckout, onNavigate }) {
  const { cart, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();

  const formattedTotal = `₹${(cartTotal / 100).toLocaleString("en-IN")}`;

  if (cart.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "6rem 1.5rem", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", marginTop: "2rem" }}>
        <ShoppingBag size={64} style={{ color: "var(--text-light)", marginBottom: "1.25rem" }} />
        <h2 style={{ fontSize: "1.85rem", fontWeight: 800 }}>Your cart is currently empty</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", marginTop: "0.5rem", marginBottom: "2rem" }}>
          Discover our latest devices and accessories to get started.
        </p>
        <button onClick={() => onNavigate("products")} className="btn-hero-primary" style={{ margin: "0 auto" }}>
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: "2rem" }}>
      <h1 style={{ fontSize: "2.4rem", fontWeight: 900, marginBottom: "1.75rem" }}>Shopping Cart</h1>

      <div className="checkout-grid">
        {/* Cart Item List */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", padding: "2rem" }}>
          {cart.map((item, idx) => {
            const itemId = item.product_id || item.id || `cart-item-${idx}`;
            return (
              <div key={itemId} className="cart-item">
                <img src={item.image} alt={item.name} className="cart-item-img" style={{ width: "100px", height: "100px" }} />
                <div className="cart-item-info">
                  <h3 className="cart-item-name">{item.name}</h3>
                  <div className="cart-item-price">
                    ₹{(((Number(item.price) || 0) * (Number(item.quantity) || 1)) / 100).toLocaleString("en-IN")}
                  </div>
                  <div className="qty-controls" style={{ marginTop: "1rem" }}>
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateQuantity(itemId, -1);
                      }}
                      title="Decrease quantity"
                    >
                      <Minus size={16} />
                    </button>
                    <span style={{ fontWeight: 800, fontSize: "1.15rem", padding: "0 0.75rem" }}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateQuantity(itemId, 1);
                      }}
                      title="Increase quantity"
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeFromCart(itemId);
                      }}
                      style={{
                        marginLeft: "auto",
                        color: "#f43f5e",
                        background: "rgba(244, 63, 94, 0.12)",
                        border: "1px solid rgba(244, 63, 94, 0.3)",
                        borderRadius: "8px",
                        padding: "0.45rem 0.85rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.92rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                      title="Delete item"
                    >
                      <Trash2 size={16} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem" }}>
            <button
              onClick={clearCart}
              style={{ color: "var(--text-muted)", fontSize: "0.95rem", textDecoration: "underline", cursor: "pointer" }}
            >
              Clear Cart
            </button>
            <button
              onClick={() => onNavigate("products")}
              className="btn-secondary"
              style={{ padding: "0.6rem 1.2rem", fontSize: "0.95rem" }}
            >
              Continue Shopping
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="checkout-card">
          <h2 style={{ fontSize: "1.45rem", fontWeight: 800, marginBottom: "1.5rem" }}>Order Summary</h2>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", fontSize: "1.05rem" }}>
            <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
            <span style={{ fontWeight: 800 }}>{formattedTotal}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", fontSize: "1.05rem" }}>
            <span style={{ color: "var(--text-muted)" }}>Shipping</span>
            <span style={{ fontWeight: 800, color: "var(--success)" }}>FREE</span>
          </div>

          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.25rem", marginTop: "1.25rem", display: "flex", justifyContent: "space-between", fontSize: "1.35rem", fontWeight: 900 }}>
            <span>Total:</span>
            <span style={{ color: "var(--primary)" }}>{formattedTotal}</span>
          </div>

          <button
            onClick={onProceedToCheckout}
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: "1.75rem" }}
          >
            <span>Proceed to Checkout</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
