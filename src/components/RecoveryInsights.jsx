import React from 'react';
import { PieChart, TrendingUp, DollarSign, Award, ShieldAlert } from 'lucide-react';

export default function RecoveryInsights({ stats, transactions }) {
  const formatINR = (paise) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format((paise || 0) / 100);
  };

  // Calculate recoverable revenue (temporary bank errors & insufficient funds)
  const recoverableRevenue = (transactions || [])
    .filter((tx) => {
      const reason = tx.failure_reason || '';
      return (
        tx.status === 'failed' &&
        (reason.includes('bank') ||
          reason.includes('network') ||
          reason.includes('funds') ||
          reason.includes('expired'))
      );
    })
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="card-panel">
      <h2 className="section-title" style={{ marginBottom: 16 }}>
        <PieChart size={18} color="var(--color-brand)" />
        Revenue Recovery Intelligence
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 18,
        }}
      >
        <div style={{ background: 'var(--bg-secondary)', padding: 20, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Failed Revenue</span>
          <p style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-danger)', marginTop: 6 }}>
            {formatINR(stats.failed_revenue)}
          </p>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: 20, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Recoverable Potential</span>
          <p style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-warning)', marginTop: 6 }}>
            {formatINR(recoverableRevenue)}
          </p>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: 20, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Recovered Revenue</span>
          <p style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-success)', marginTop: 6 }}>
            {formatINR(stats.recovered_revenue)}
          </p>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: 20, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Recovery Rate</span>
          <p style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-brand)', marginTop: 6 }}>
            {stats.recovery_rate || 0}%
          </p>
        </div>
      </div>
    </div>
  );
}
