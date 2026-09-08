import React from "react";
import { X, Trash2, ArrowRight, ShoppingBag, Plus, Minus } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function CartDrawer({ onProceedToCheckout }) {
  const { isCartOpen, closeCart, cart, updateQuantity, removeFromCart, cartTotal } = useCart();

  if (!isCartOpen) return null;

  const formattedTotal = `₹${(cartTotal / 100).toLocaleString("en-IN")}`;

  return (
    <div
      className="drawer-overlay"
      onClick={closeCart}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10, 15, 30, 0.82)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 9998,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        className="drawer-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "480px",
          height: "100%",
          background: "#0f172a",
          borderLeft: "1px solid #1e293b",
          boxShadow: "-12px 0 35px rgba(0,0,0,0.7)",
          display: "flex",
          flexDirection: "column",
          zIndex: 9999,
        }}
      >
        {/* Drawer Header */}
        <div style={{ padding: "1.5rem 1.75rem", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <ShoppingBag size={24} color="var(--primary)" />
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#fff", margin: 0 }}>
              Your Cart ({cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)})
            </h2>
          </div>
          <button
            onClick={closeCart}
            style={{ color: "var(--text-muted)", padding: "0.5rem", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="Close Cart"
          >
            <X size={24} />
          </button>
        </div>

        {/* Drawer Body */}
        <div style={{ padding: "1.75rem", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "5rem 1rem", color: "var(--text-muted)" }}>
              <ShoppingBag size={56} style={{ margin: "0 auto 1.25rem auto", opacity: 0.3 }} />
              <p style={{ fontWeight: 800, fontSize: "1.3rem", color: "#fff" }}>Your cart is empty</p>
              <p style={{ fontSize: "1rem", marginTop: "0.5rem" }}>
                Browse our catalog and add products to start shopping.
              </p>
            </div>
          ) : (
            cart.map((item, idx) => {
              const itemId = item.product_id || item.id || `cart-item-${idx}`;
              return (
                <div
                  key={itemId}
                  style={{
                    display: "flex",
                    gap: "1.25rem",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    padding: "1.15rem",
                    borderRadius: "14px",
                    alignItems: "center",
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{ width: "76px", height: "76px", objectFit: "contain", background: "#0a0d14", borderRadius: "10px", padding: "0.45rem", flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", margin: "0 0 0.35rem 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.name}
                    </h4>
                    <div style={{ fontSize: "1.15rem", fontWeight: 900, color: "var(--primary)" }}>
                      ₹{(((Number(item.price) || 0) * (Number(item.quantity) || 1)) / 100).toLocaleString("en-IN")}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.75rem" }}>
                      {/* Decrement Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          updateQuantity(itemId, -1);
                        }}
                        style={{
                          background: "rgba(255, 255, 255, 0.1)",
                          color: "#fff",
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 900,
                          cursor: "pointer",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                        }}
                        title="Decrease quantity"
                      >
                        <Minus size={16} />
                      </button>

                      {/* Quantity display */}
                      <span style={{ fontWeight: 900, fontSize: "1.1rem", color: "#fff", minWidth: "1.5rem", textAlign: "center" }}>
                        {item.quantity}
                      </span>

                      {/* Increment Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          updateQuantity(itemId, 1);
                        }}
                        style={{
                          background: "rgba(255, 255, 255, 0.1)",
                          color: "#fff",
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 900,
                          cursor: "pointer",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                        }}
                        title="Increase quantity"
                      >
                        <Plus size={16} />
                      </button>

                      {/* Delete / Remove Button */}
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
                          padding: "0.45rem 0.65rem",
                          borderRadius: "8px",
                          background: "rgba(244, 63, 94, 0.12)",
                          border: "1px solid rgba(244, 63, 94, 0.3)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                        }}
                        title="Delete item from cart"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        {cart.length > 0 && (
          <div style={{ padding: "1.75rem", borderTop: "1px solid rgba(255, 255, 255, 0.1)", background: "rgba(17, 24, 39, 0.95)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.25rem", fontWeight: 900, color: "#fff", marginBottom: "1.35rem" }}>
              <span>Subtotal:</span>
              <span style={{ color: "var(--primary)" }}>{formattedTotal}</span>
            </div>
            <button
              onClick={() => {
                closeCart();
                if (onProceedToCheckout) onProceedToCheckout();
              }}
              className="btn-hero-primary"
              style={{ width: "100%", justifyContent: "center", fontSize: "1.15rem", padding: "1rem" }}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
