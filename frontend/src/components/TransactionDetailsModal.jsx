import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Brain,
  Sliders,
  CheckCircle,
  AlertOctagon,
  Clock,
  ArrowRight,
  Info,
  Trash2,
} from 'lucide-react';

export default function TransactionDetailsModal({ transaction, onClose, onRefresh, onDelete }) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!transaction) return null;

  const API_BASE = import.meta.env.VITE_RECOVERAI_API_URL || (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "http://127.0.0.1:8000" : "");

  const handleDelete = async () => {
    setIsDeleting(true);
    if (onDelete) {
      await onDelete(transaction.payment_id);
      onClose();
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/transactions/${transaction.payment_id}`, {
        method: 'DELETE',
      });
      if (res.ok && onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  const formatINR = (paise) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format((paise || 0) / 100);
  };

  const isFailed = transaction.status === 'failed';

  // Derive realistic AI & Policy pipeline metrics based on transaction properties
  const getAnalysisData = () => {
    const reason = transaction.failure_reason || 'none';
    if (!isFailed) {
      return {
        riskLevel: 'low',
        recoverable: false,
        recommendedAction: 'no_action_needed',
        aiDecision: 'do_not_attempt',
        aiReason: 'Payment was successfully captured.',
        confidence: 1.0,
        humanReview: false,
        policyAllowed: false,
        policyDecision: 'not_applicable',
        policyReason: 'Payment is already captured.',
        serviceAction: 'none',
        serviceStatus: 'not_required',
        serviceMessage: 'No recovery operation required for successful payments.',
        recoveredAmount: 0,
      };
    }

    if (reason === 'bank_server_down' || reason === 'network_timeout') {
      return {
        riskLevel: 'medium',
        recoverable: true,
        recommendedAction: 'retry_later',
        aiDecision: 'attempt_recovery',
        aiReason: `Temporary infrastructure/bank issue detected: '${reason}'. High recovery probability via automated retry.`,
        confidence: 0.95,
        humanReview: false,
        policyAllowed: true,
        policyDecision: 'approved',
        policyReason: `Approved for automated retry: temporary error '${reason}'.`,
        serviceAction: 'retry_payment',
        serviceStatus: transaction.recovery_status === 'executed' ? 'executed' : 'pending',
        serviceMessage: transaction.recovery_status === 'executed'
          ? `Payment retry executed successfully for payment '${transaction.payment_id}'.`
          : `Queued for automated retry attempt.`,
        recoveredAmount: transaction.recovery_status === 'executed' ? transaction.amount : 0,
      };
    } else if (reason === 'card_expired' || reason === 'insufficient_funds') {
      return {
        riskLevel: 'medium',
        recoverable: true,
        recommendedAction: 'contact_customer',
        aiDecision: 'flag_human_review',
        aiReason: `Customer payment method issue detected: '${reason}'. Requires customer action to update payment details.`,
        confidence: 0.85,
        humanReview: true,
        policyAllowed: true,
        policyDecision: 'manual_review_required',
        policyReason: `Flagged for customer outreach: requires updated payment authorization for '${reason}'.`,
        serviceAction: 'customer_outreach_queued',
        serviceStatus: 'pending',
        serviceMessage: `Outreach notification queued for customer '${transaction.customer_id}'.`,
        recoveredAmount: 0,
      };
    } else if (reason === 'customer_cancelled') {
      return {
        riskLevel: 'high',
        recoverable: false,
        recommendedAction: 'do_not_retry',
        aiDecision: 'do_not_attempt',
        aiReason: 'Transaction was explicitly cancelled by the customer.',
        confidence: 0.99,
        humanReview: false,
        policyAllowed: false,
        policyDecision: 'blocked',
        policyReason: 'Blocked: Customer explicitly cancelled payment intent.',
        serviceAction: 'none',
        serviceStatus: 'cancelled',
        serviceMessage: 'Recovery pipeline halted to honor customer cancellation.',
        recoveredAmount: 0,
      };
    } else {
      return {
        riskLevel: 'high',
        recoverable: false,
        recommendedAction: 'do_not_retry',
        aiDecision: 'do_not_attempt',
        aiReason: `Repeated failure or unrecoverable error: '${reason}'.`,
        confidence: 0.90,
        humanReview: false,
        policyAllowed: false,
        policyDecision: 'blocked',
        policyReason: 'Blocked by policy guard: High risk threshold exceeded.',
        serviceAction: 'none',
        serviceStatus: 'failed',
        serviceMessage: 'Recovery abandoned based on risk assessment.',
        recoveredAmount: 0,
      };
    }
  };

  const pipeline = getAnalysisData();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <span style={{ fontSize: '0.92rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              Transaction Inspection
            </span>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
              {transaction.payment_id}
              <span className={`badge badge-${transaction.status.toLowerCase()}`}>
                {transaction.status}
              </span>
            </h2>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Summary Details Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 18,
              background: 'var(--bg-secondary)',
              padding: 20,
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Customer Name</span>
              <p style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', marginTop: 2 }}>{transaction.customer_name || 'N/A'}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Customer ID</span>
              <p style={{ fontWeight: 700, fontSize: '1.02rem', fontFamily: 'monospace', marginTop: 2 }}>{transaction.customer_id}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Customer Email</span>
              <p style={{ fontWeight: 700, fontSize: '1.02rem', marginTop: 2 }}>{transaction.customer_email || 'N/A'}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Customer Phone</span>
              <p style={{ fontWeight: 700, fontSize: '1.02rem', marginTop: 2 }}>{transaction.customer_phone || 'N/A'}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Order ID</span>
              <p style={{ fontWeight: 700, fontSize: '1.02rem', fontFamily: 'monospace', color: 'var(--color-brand)', marginTop: 2 }}>{transaction.order_id || 'N/A'}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Payment ID</span>
              <p style={{ fontWeight: 700, fontSize: '1.02rem', fontFamily: 'monospace', marginTop: 2 }}>{transaction.payment_id}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Amount</span>
              <p style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--color-brand)', marginTop: 2 }}>{formatINR(transaction.amount)}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Failure Reason</span>
              <p style={{ fontWeight: 700, fontSize: '1.02rem', color: transaction.failure_reason ? 'var(--color-danger)' : 'var(--text-primary)', marginTop: 2 }}>
                {transaction.failure_reason || 'None'}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Retry Count</span>
              <p style={{ fontWeight: 700, fontSize: '1.05rem', marginTop: 2 }}>{transaction.retry_count}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Recovery Status</span>
              <p style={{ marginTop: 2 }}>
                <span className={`badge badge-${transaction.recovery_status.toLowerCase()}`}>
                  {transaction.recovery_status}
                </span>
              </p>
            </div>
          </div>

          {/* Why Did This Payment Fail? Explanation Panel */}
          {isFailed && (
            <div
              style={{
                marginTop: "1.5rem",
                padding: "1.5rem",
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(15, 23, 42, 0.5) 100%)",
                border: "1px solid var(--color-brand)",
              }}
            >
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.65rem", color: "var(--color-brand)" }}>
                <Info size={20} /> Why Did This Payment Fail?
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", fontSize: "0.98rem" }}>
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.88rem", fontWeight: 700 }}>Technical Error Code</span>
                  <p style={{ fontWeight: 800, fontFamily: "monospace", fontSize: "1.05rem", color: "var(--color-danger)", margin: "0.25rem 0 0.75rem 0" }}>
                    {transaction.failure_reason || "unknown_failure"}
                  </p>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.88rem", fontWeight: 700 }}>Human Explanation</span>
                  <p style={{ color: "var(--text-primary)", margin: "0.25rem 0 0 0", lineHeight: "1.6" }}>
                    {transaction.failure_reason === "bank_server_down"
                      ? "The customer's bank or payment gateway infrastructure temporarily failed to respond during authorization."
                      : transaction.failure_reason === "network_timeout"
                      ? "Network connection timed out between the customer's bank and Razorpay servers."
                      : transaction.failure_reason === "card_expired"
                      ? "The customer's card or mandate has passed its expiration date."
                      : transaction.failure_reason === "insufficient_funds"
                      ? "The customer's bank account has insufficient balance to complete the transaction."
                      : transaction.failure_reason === "customer_cancelled"
                      ? "The customer manually closed or cancelled the payment window before completion."
                      : "The payment attempt failed due to an authentication or security risk flag."}
                  </p>
                </div>

                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.88rem", fontWeight: 700 }}>Can RecoverAI Recover It?</span>
                  <p style={{ fontWeight: 900, fontSize: "1.05rem", color: pipeline.recoverable ? "var(--color-success)" : "var(--color-danger)", margin: "0.25rem 0 0.75rem 0" }}>
                    {pipeline.recoverable ? "YES — HIGH POTENTIAL" : "NO — MANUAL / BLOCKED"}
                  </p>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.88rem", fontWeight: 700 }}>Why Was Recovery Allowed / Guarded?</span>
                  <p style={{ color: "var(--text-primary)", margin: "0.25rem 0 0 0", lineHeight: "1.6" }}>
                    {pipeline.policyReason}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* RecoverAI Decision Pipeline Flow */}
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, marginTop: "1.75rem" }}>
            <Brain size={22} color="var(--color-brand)" />
            RecoverAI Decision Pipeline Trace
          </h3>

          <div className="pipeline-flow">
            {/* Step 1: RecoverAI Analysis */}
            <div className="pipeline-step">
              <div className="pipeline-step-header">
                <div>
                  <span className="pipeline-number">1</span>
                  <span>RecoverAI Analysis</span>
                </div>
                <span className={`badge badge-${pipeline.riskLevel === 'low' ? 'captured' : pipeline.riskLevel === 'medium' ? 'pending' : 'failed'}`}>
                  Risk: {pipeline.riskLevel}
                </span>
              </div>
              <div style={{ fontSize: '0.88rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Potentially Recoverable: </span>
                  <strong style={{ color: pipeline.recoverable ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {pipeline.recoverable ? 'Yes' : 'No'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Recommended Action: </span>
                  <strong>{pipeline.recommendedAction}</strong>
                </div>
              </div>
            </div>

            {/* Step 2: AI Agent */}
            <div className="pipeline-step">
              <div className="pipeline-step-header">
                <div>
                  <span className="pipeline-number" style={{ background: '#8b5cf6' }}>2</span>
                  <span>AI Agent Decision</span>
                </div>
                <span className={`badge badge-${pipeline.aiDecision === 'attempt_recovery' ? 'captured' : pipeline.aiDecision === 'flag_human_review' ? 'review' : 'cancelled'}`}>
                  {pipeline.aiDecision}
                </span>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                {pipeline.aiReason}
              </p>
              <div style={{ fontSize: '0.8rem', display: 'flex', gap: 16, color: 'var(--text-muted)' }}>
                <span>Confidence: <strong>{Math.round(pipeline.confidence * 100)}%</strong></span>
                <span>Human Review Required: <strong style={{ color: pipeline.humanReview ? 'var(--color-purple)' : 'var(--text-primary)' }}>{pipeline.humanReview ? 'Yes' : 'No'}</strong></span>
              </div>
            </div>

            {/* Step 3: Policy Engine */}
            <div className="pipeline-step">
              <div className="pipeline-step-header">
                <div>
                  <span className="pipeline-number" style={{ background: '#3b82f6' }}>3</span>
                  <span>Policy Engine Guard</span>
                </div>
                <span className={`badge badge-${pipeline.policyDecision === 'approved' ? 'approved' : pipeline.policyDecision === 'manual_review_required' ? 'review' : 'blocked'}`}>
                  {pipeline.policyDecision}
                </span>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                {pipeline.policyReason}
              </p>
            </div>

            {/* Step 4: Recovery Service Outcome */}
            <div className="pipeline-step" style={{ borderLeft: '4px solid var(--color-brand)' }}>
              <div className="pipeline-step-header">
                <div>
                  <span className="pipeline-number" style={{ background: 'var(--color-success)' }}>4</span>
                  <span>Recovery Service Execution</span>
                </div>
                <span className={`badge badge-${pipeline.serviceStatus.toLowerCase()}`}>
                  {pipeline.serviceStatus}
                </span>
              </div>
              <p style={{ fontSize: '0.98rem', color: 'var(--text-primary)', marginBottom: 6 }}>
                {pipeline.serviceMessage}
              </p>
              {pipeline.recoveredAmount > 0 && (
                <div style={{ fontSize: '0.95rem', color: 'var(--color-success)', fontWeight: 800 }}>
                  ✓ Amount Recovered: {formatINR(pipeline.recoveredAmount)}
                </div>
              )}
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {!isConfirmingDelete ? (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                style={{
                  background: 'rgba(244, 63, 94, 0.12)',
                  color: '#f43f5e',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  padding: '0.65rem 1.15rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                }}
              >
                <Trash2 size={16} />
                <span>Delete Record</span>
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.95rem', color: '#f43f5e', fontWeight: 700 }}>Confirm deletion?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  style={{
                    background: '#f43f5e',
                    color: '#fff',
                    border: 'none',
                    padding: '0.55rem 1rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                  }}
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="btn-secondary"
                  style={{ padding: '0.55rem 0.85rem', fontSize: '0.9rem' }}
                >
                  Cancel
                </button>
              </div>
            )}

            <button className="btn-secondary" onClick={onClose} style={{ marginLeft: 'auto' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
