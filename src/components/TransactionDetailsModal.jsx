import React from 'react';
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
} from 'lucide-react';

export default function TransactionDetailsModal({ transaction, onClose }) {
  if (!transaction) return null;

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
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Transaction Inspection
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
              {transaction.payment_id}
              <span className={`badge badge-${transaction.status.toLowerCase()}`}>
                {transaction.status}
              </span>
            </h2>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Summary Details Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 16,
              background: 'var(--bg-secondary)',
              padding: 16,
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Customer Name</span>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{transaction.customer_name || 'N/A'}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Customer ID</span>
              <p style={{ fontWeight: 600, fontFamily: 'monospace' }}>{transaction.customer_id}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Customer Email</span>
              <p style={{ fontWeight: 600 }}>{transaction.customer_email || 'N/A'}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Customer Phone</span>
              <p style={{ fontWeight: 600 }}>{transaction.customer_phone || 'N/A'}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Order ID</span>
              <p style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--color-brand)' }}>{transaction.order_id || 'N/A'}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Payment ID</span>
              <p style={{ fontWeight: 600, fontFamily: 'monospace' }}>{transaction.payment_id}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Amount</span>
              <p style={{ fontWeight: 700, color: 'var(--color-brand)' }}>{formatINR(transaction.amount)}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Failure Reason</span>
              <p style={{ fontWeight: 600, color: transaction.failure_reason ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                {transaction.failure_reason || 'None'}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Retry Count</span>
              <p style={{ fontWeight: 600 }}>{transaction.retry_count}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recovery Status</span>
              <p>
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
                marginTop: "1.25rem",
                padding: "1.25rem",
                borderRadius: "8px",
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(15, 23, 42, 0.4) 100%)",
                border: "1px solid var(--color-brand)",
              }}
            >
              <h3 style={{ fontSize: "0.95rem", fontWeight: 800, margin: "0 0 0.75rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-brand)" }}>
                <Info size={18} /> Why Did This Payment Fail?
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.85rem" }}>
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Technical Error Code</span>
                  <p style={{ fontWeight: 700, fontFamily: "monospace", color: "var(--color-danger)", margin: "0.15rem 0 0.5rem 0" }}>
                    {transaction.failure_reason || "unknown_failure"}
                  </p>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Human Explanation</span>
                  <p style={{ color: "var(--text-primary)", margin: "0.15rem 0 0 0" }}>
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
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Can RecoverAI Recover It?</span>
                  <p style={{ fontWeight: 800, color: pipeline.recoverable ? "var(--color-success)" : "var(--color-danger)", margin: "0.15rem 0 0.5rem 0" }}>
                    {pipeline.recoverable ? "YES — HIGH POTENTIAL" : "NO — MANUAL / BLOCKED"}
                  </p>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Why Was Recovery Allowed / Guarded?</span>
                  <p style={{ color: "var(--text-primary)", margin: "0.15rem 0 0 0" }}>
                    {pipeline.policyReason}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* RecoverAI Decision Pipeline Flow */}
          <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginTop: "1.25rem" }}>
            <Brain size={18} color="var(--color-brand)" />
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
              <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: 6 }}>
                {pipeline.serviceMessage}
              </p>
              {pipeline.recoveredAmount > 0 && (
                <div style={{ fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: 700 }}>
                  ✓ Amount Recovered: {formatINR(pipeline.recoveredAmount)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
