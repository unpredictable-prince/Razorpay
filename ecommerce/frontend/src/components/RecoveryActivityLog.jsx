import React from 'react';
import { Activity, Clock } from 'lucide-react';
import { formatISTDateTime } from '../utils/dateUtils';

export default function RecoveryActivityLog({ transactions, onSelectTransaction }) {
  const formatINR = (paise) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format((paise || 0) / 100);
  };

  // Filter transactions that have been processed by recovery pipeline or have non-default recovery status
  const recoveryActivities = (transactions || [])
    .filter((tx) => tx.recovery_status !== 'not_required')
    .slice(0, 8); // Top 8 recent actions

  const getActionName = (reason) => {
    if (reason === 'bank_server_down' || reason === 'network_timeout') return 'automated_retry';
    if (reason === 'card_expired' || reason === 'insufficient_funds') return 'customer_outreach';
    if (reason === 'customer_cancelled') return 'halt_recovery';
    return 'risk_block';
  };

  const getPolicyDecision = (reason) => {
    if (reason === 'bank_server_down' || reason === 'network_timeout') return 'approved';
    if (reason === 'card_expired' || reason === 'insufficient_funds') return 'manual_review';
    return 'blocked';
  };

  return (
    <div className="card-panel">
      <h2 className="section-title" style={{ marginBottom: 16 }}>
        <Activity size={18} color="var(--color-brand)" />
        Recent Recovery Pipeline Audit Trail
      </h2>

      {recoveryActivities.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
          No recovery activity logged yet.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Action</th>
                <th>AI Decision</th>
                <th>Policy</th>
                <th>Status</th>
                <th>Recovered</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {recoveryActivities.map((tx) => {
                const action = getActionName(tx.failure_reason);
                const policy = getPolicyDecision(tx.failure_reason);
                return (
                  <tr key={tx.id} onClick={() => onSelectTransaction(tx)}>
                    <td style={{ fontWeight: 600, color: 'var(--color-brand)' }}>
                      {tx.customer_name ? `${tx.customer_name} (${tx.payment_id})` : tx.payment_id}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{action}</td>
                    <td>
                      <span className={`badge badge-${action === 'automated_retry' ? 'captured' : action === 'customer_outreach' ? 'review' : 'failed'}`}>
                        {action === 'automated_retry' ? 'attempt' : action === 'customer_outreach' ? 'review' : 'block'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${policy === 'approved' ? 'approved' : policy === 'manual_review' ? 'review' : 'blocked'}`}>
                        {policy}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${tx.recovery_status.toLowerCase()}`}>
                        {tx.recovery_status}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {tx.recovery_status === 'executed' || tx.recovery_status === 'recovered'
                        ? formatINR(tx.amount)
                        : '₹0.00'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {formatISTDateTime(tx.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
