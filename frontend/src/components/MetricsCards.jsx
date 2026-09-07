import React from 'react';
import {
  CreditCard,
  AlertTriangle,
  TrendingDown,
  CheckCircle2,
  TrendingUp,
  Clock,
  UserCheck,
} from 'lucide-react';

export default function MetricsCards({ stats }) {
  const formatINR = (paise) => {
    const rupees = (paise || 0) / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(rupees);
  };

  const metrics = [
    {
      title: 'Total Transactions',
      value: stats.total_transactions || 0,
      icon: CreditCard,
      color: 'var(--color-info)',
      bg: 'var(--color-info-bg)',
      footer: 'Database records',
    },
    {
      title: 'Failed Payments',
      value: stats.failed_payments || 0,
      icon: AlertTriangle,
      color: 'var(--color-danger)',
      bg: 'var(--color-danger-bg)',
      footer: 'Require attention',
    },
    {
      title: 'Failed Revenue',
      value: formatINR(stats.failed_revenue),
      icon: TrendingDown,
      color: 'var(--color-danger)',
      bg: 'var(--color-danger-bg)',
      footer: 'Total failed volume',
    },
    {
      title: 'Recovered Revenue',
      value: formatINR(stats.recovered_revenue),
      icon: CheckCircle2,
      color: 'var(--color-success)',
      bg: 'var(--color-success-bg)',
      footer: 'Successfully captured',
    },
    {
      title: 'Recovery Rate',
      value: `${stats.recovery_rate || 0}%`,
      icon: TrendingUp,
      color: 'var(--color-success)',
      bg: 'var(--color-success-bg)',
      footer: 'Recovery efficiency',
    },
    {
      title: 'Pending Recovery',
      value: stats.pending_recovery || 0,
      icon: Clock,
      color: 'var(--color-warning)',
      bg: 'var(--color-warning-bg)',
      footer: 'Awaiting retry pipeline',
    },
    {
      title: 'Human Review',
      value: stats.human_review_required || 0,
      icon: UserCheck,
      color: 'var(--color-purple)',
      bg: 'var(--color-purple-bg)',
      footer: 'Flagged for review',
    },
  ];

  return (
    <div className="metrics-grid">
      {metrics.map((item, index) => {
        const Icon = item.icon;
        return (
          <div key={index} className="metric-card">
            <div className="metric-card-header">
              <span>{item.title}</span>
              <div
                className="metric-icon-box"
                style={{ backgroundColor: item.bg, color: item.color }}
              >
                <Icon size={18} />
              </div>
            </div>
            <div className="metric-value">{item.value}</div>
            <div className="metric-footer">{item.footer}</div>
          </div>
        );
      })}
    </div>
  );
}
