import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle, RefreshCw, ShoppingBag, ArrowRight } from "lucide-react";
import { fetchOrderById } from "../services/api";

export default function PaymentResultPage({ resultData, onNavigate, onRetryPayment }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (resultData?.order_id) {
      fetchOrderById(resultData.order_id)
        .then((data) => setOrder(data))
        .catch((err) => console.error("Error fetching order:", err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [resultData]);

  const isSuccess = resultData?.status === "success" || order?.payment_status === "paid";
  const isFailed = resultData?.status === "failed" || order?.payment_status === "failed";

  const formattedAmount = order
    ? `₹${(order.total_amount / 100).toLocaleString("en-IN")}`
    : "";

  return (
    <div style={{ paddingTop: "2rem" }}>
      <div className="result-card">
        {/* Status Icon */}
        <div className={`status-icon-wrapper ${isSuccess ? "success" : "failed"}`}>
          {isSuccess ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
        </div>

        {/* Title & Desc */}
        <h1 className="status-title">
          {isSuccess ? "Payment Successful!" : "Payment Attempt Failed"}
        </h1>

        <p className="status-desc">
          {isSuccess
            ? `Thank you for your order. We have received your payment of ${formattedAmount} and are preparing your shipment.`
            : "Your payment could not be completed. Don't worry, no funds were deducted from your account, and you can safely retry below."}
        </p>

        {/* Details Box */}
        {order && (
          <div style={{ background: "var(--border-light)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "1.25rem", textAlign: "left", marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Order Reference</span>
              <strong style={{ fontFamily: "monospace" }}>{order.order_id}</strong>
            </div>

            {order.razorpay_payment_id && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Razorpay Payment ID</span>
                <strong style={{ fontFamily: "monospace" }}>{order.razorpay_payment_id}</strong>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Total Amount</span>
              <strong style={{ color: "var(--primary)" }}>{formattedAmount}</strong>
            </div>
          </div>
        )}

        {/* Customer Actions */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          {isFailed && order && (
            <button
              onClick={() => onRetryPayment(order)}
              className="btn-primary"
              style={{ background: "var(--primary)" }}
            >
              <RefreshCw size={18} />
              <span>Try Payment Again</span>
            </button>
          )}

          <button onClick={() => onNavigate("my-orders")} className="btn-secondary">
            View My Orders
          </button>

          <button onClick={() => onNavigate("products")} className="btn-secondary">
            <span>Continue Shopping</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
