import React, { useState, useEffect } from "react";
import { Package, RefreshCw, ShoppingBag, CheckCircle, AlertTriangle } from "lucide-react";
import { fetchCustomerOrders } from "../services/api";
import { useCart } from "../context/CartContext";

export default function MyOrdersPage({ onRetryPayment, onNavigate }) {
  const { customer } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchCustomerOrders(customer?.email)
      .then((data) => setOrders(data))
      .catch((err) => console.error("Error fetching orders:", err))
      .finally(() => setLoading(false));
  }, [customer]);

  if (loading) {
    return <div style={{ padding: "4rem", textAlign: "center" }}>Loading your orders...</div>;
  }

  return (
    <div style={{ paddingTop: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>My Orders</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Viewing order history for <strong>{customer?.email}</strong>
          </p>
        </div>
        <button onClick={() => onNavigate("products")} className="btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}>
          Browse Catalog
        </button>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "5rem 1rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" }}>
          <Package size={48} style={{ color: "var(--text-light)", marginBottom: "1rem" }} />
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>No orders found</h3>
          <p style={{ color: "var(--text-muted)", marginTop: "0.25rem", marginBottom: "1.5rem" }}>
            You haven't placed any orders yet.
          </p>
          <button onClick={() => onNavigate("products")} className="btn-primary">
            Start Shopping
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {orders.map((ord) => {
            const isPaid = ord.payment_status === "paid";
            const isFailed = ord.payment_status === "failed";
            const formattedTotal = `₹${(ord.total_amount / 100).toLocaleString("en-IN")}`;
            const orderDate = new Date(ord.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={ord.order_id}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {/* Order Top Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", borderBottom: "1px solid var(--border-light)", paddingBottom: "1rem" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                      Order ID
                    </span>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 800, fontFamily: "monospace" }}>{ord.order_id}</h3>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Placed on {orderDate}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span
                      style={{
                        padding: "0.35rem 0.85rem",
                        borderRadius: "20px",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        backgroundColor: isPaid ? "var(--success-bg)" : isFailed ? "var(--danger-bg)" : "var(--warning-bg)",
                        color: isPaid ? "var(--success)" : isFailed ? "var(--danger)" : "var(--warning)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                    >
                      {isPaid ? <CheckCircle size={14} /> : isFailed ? <AlertTriangle size={14} /> : null}
                      {ord.payment_status.toUpperCase()}
                    </span>

                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Total</span>
                      <strong style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)" }}>{formattedTotal}</strong>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                  {ord.items?.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "var(--border-light)", padding: "0.5rem 0.85rem", borderRadius: "var(--radius-sm)" }}>
                      {item.image && <img src={item.image} alt={item.name} style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "4px" }} />}
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{item.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Qty: {item.quantity} × ₹{(item.price / 100).toLocaleString("en-IN")}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Action */}
                {isFailed && (
                  <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "0.5rem", borderTop: "1px solid var(--border-light)" }}>
                    <button
                      onClick={() => onRetryPayment(ord)}
                      className="btn-primary"
                      style={{ padding: "0.5rem 1.25rem", fontSize: "0.9rem" }}
                    >
                      <RefreshCw size={16} />
                      <span>Try Payment Again</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
