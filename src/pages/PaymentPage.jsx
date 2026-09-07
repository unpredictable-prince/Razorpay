import React, { useState, useEffect } from "react";
import { ShieldCheck, CreditCard, ArrowLeft, RefreshCw, Lock } from "lucide-react";
import { createRazorpayOrder, verifyPayment, fetchConfig } from "../services/api";
import { useCart } from "../context/CartContext";

export default function PaymentPage({ order, onNavigate, onPaymentComplete }) {
  const { clearCart, showToast } = useCart();
  const [loading, setLoading] = useState(false);
  const [razorpayKey, setRazorpayKey] = useState("rzp_test_mockkey");

  useEffect(() => {
    fetchConfig()
      .then((cfg) => {
        if (cfg?.razorpay_key_id) setRazorpayKey(cfg.razorpay_key_id);
      })
      .catch((err) => console.error("Config fetch error:", err));
  }, []);


  if (!order) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <h3 style={{ color: "#fff" }}>No active order found</h3>
        <button onClick={() => onNavigate("products")} className="btn-hero-secondary" style={{ marginTop: "1rem" }}>
          Back to Catalog
        </button>
      </div>
    );
  }

  const formattedTotal = `₹${(order.total_amount / 100).toLocaleString("en-IN")}`;

  const handleRazorpayPayment = async () => {
    setLoading(true);
    try {
      // 1. Create Razorpay Test Order via e-commerce backend
      const rzpOrderData = await createRazorpayOrder(order.order_id);

      // 2. Configure Razorpay SDK popup
      const options = {
        key: rzpOrderData.razorpay_key_id || razorpayKey,
        amount: rzpOrderData.amount,
        currency: rzpOrderData.currency,
        name: "Aura Store",
        description: `Payment for Order ${order.order_id}`,
        order_id: rzpOrderData.razorpay_order_id,
        prefill: {
          name: order.customer_name,
          email: order.customer_email,
          contact: order.customer_phone,
        },
        theme: { color: "#6366f1" },
        handler: async function (response) {
          try {
            // Verify payment
            await verifyPayment({
              order_id: order.order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              status: "success",
            });
            clearCart();
            showToast("Payment Successful!", "success");
            onPaymentComplete({
              order_id: order.order_id,
              status: "success",
              razorpay_payment_id: response.razorpay_payment_id,
            });
          } catch (e) {
            console.error("Payment verification error:", e);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", async function (response) {
          const paymentId = response.error?.metadata?.payment_id || `pay_fail_${os.urandom(4).hex()}`;
          const reason = response.error?.reason || response.error?.description || "bank_server_down";
          await verifyPayment({
            order_id: order.order_id,
            razorpay_payment_id: paymentId,
            status: "failed",
            error_reason: reason,
          });
          onPaymentComplete({
            order_id: order.order_id,
            status: "failed",
            razorpay_payment_id: paymentId,
            error_reason: reason,
          });
        });
        rzp.open();
      } else {
        console.warn("Razorpay SDK script not found on window object.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Payment initiation error:", err);
      showToast("Payment initiation error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const simulateTestPayment = async (targetStatus, reason = "bank_server_down") => {
    setLoading(true);
    try {
      const mockPayId = `pay_${targetStatus}_${Date.now().toString().slice(-6)}`;
      await verifyPayment({
        order_id: order.order_id,
        razorpay_payment_id: mockPayId,
        status: targetStatus,
        error_reason: targetStatus === "failed" ? reason : null,
      });
      if (targetStatus === "success") clearCart();
      onPaymentComplete({
        order_id: order.order_id,
        status: targetStatus,
        razorpay_payment_id: mockPayId,
        error_reason: targetStatus === "failed" ? reason : null,
      });
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: "1.5rem" }}>
      <button
        onClick={() => onNavigate("checkout")}
        className="btn-hero-secondary"
        style={{ marginBottom: "1.5rem", padding: "0.5rem 1rem", fontSize: "0.85rem" }}
      >
        <ArrowLeft size={16} />
        <span>Back to Checkout</span>
      </button>

      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ background: "var(--bg-surface)", border: "var(--glass-border)", borderRadius: "var(--radius-lg)", padding: "2.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ width: "4rem", height: "4rem", borderRadius: "50%", background: "rgba(99, 102, 241, 0.15)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem auto" }}>
              <CreditCard size={32} />
            </div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fff" }}>Complete Your Order Payment</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
              Order Reference: <strong style={{ color: "#fff", fontFamily: "monospace" }}>{order.order_id}</strong>
            </p>
          </div>

          {/* Amount Summary */}
          <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "var(--glass-border)", padding: "1.5rem", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
            <div>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>Total Payable</span>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--primary)" }}>{formattedTotal}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "var(--success)", padding: "0.35rem 0.75rem", borderRadius: "var(--radius-full)", fontSize: "0.75rem", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                <Lock size={12} />
                Razorpay TEST MODE
              </span>
            </div>
          </div>

          {/* Main Launch Button */}
          <button
            onClick={handleRazorpayPayment}
            disabled={loading}
            className="btn-hero-primary"
            style={{ width: "100%", justifyContent: "center", padding: "1rem", fontSize: "1.05rem", marginBottom: "1.5rem" }}
          >
            <ShieldCheck size={20} />
            <span>{loading ? "Launching Razorpay..." : `Launch Razorpay Checkout (${formattedTotal})`}</span>
          </button>

          {/* Developer Test Simulator Box */}
          <div style={{ borderTop: "var(--glass-border)", paddingTop: "1.5rem" }}>
            <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem", textAlign: "center" }}>
              Test Mode Direct Scenarios
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <button
                onClick={() => simulateTestPayment("success")}
                className="btn-hero-secondary"
                style={{ justifyContent: "center", color: "var(--success)", borderColor: "rgba(16, 185, 129, 0.4)", fontSize: "0.85rem" }}
              >
                Test Success
              </button>

              <button
                onClick={() => simulateTestPayment("failed", "bank_server_down")}
                className="btn-hero-secondary"
                style={{ justifyContent: "center", color: "var(--danger)", borderColor: "rgba(239, 68, 68, 0.4)", fontSize: "0.85rem" }}
              >
                Test Bank Failure
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
