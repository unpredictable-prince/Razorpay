import React, { useState } from 'react';
import { Search, Filter, RotateCcw, ChevronRight, AlertCircle } from 'lucide-react';
import { formatISTDateTime } from '../utils/dateUtils';

export default function TransactionTable({ transactions, onSelectTransaction }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [recoveryFilter, setRecoveryFilter] = useState('ALL');

  const formatINR = (paise) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(paise / 100);
  };

  // Filter transactions based on search term and dropdown selections
  const filteredTransactions = transactions.filter((tx) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      tx.payment_id.toLowerCase().includes(q) ||
      tx.customer_id.toLowerCase().includes(q) ||
      (tx.customer_name && tx.customer_name.toLowerCase().includes(q)) ||
      (tx.customer_email && tx.customer_email.toLowerCase().includes(q)) ||
      (tx.order_id && tx.order_id.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === 'ALL' ||
      tx.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesRecovery =
      recoveryFilter === 'ALL' ||
      tx.recovery_status.toLowerCase() === recoveryFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesRecovery;
  });

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setRecoveryFilter('ALL');
  };

  return (
    <div>
      <div className="section-title-container">
        <h2 className="section-title">
          <Filter size={18} color="var(--color-brand)" />
          Transaction Ledger
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Showing {filteredTransactions.length} of {transactions.length} records
        </span>
      </div>

      {/* Filter Controls Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Customer Name, ID, Order, or Payment ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="select-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Payment Statuses</option>
          <option value="captured">Captured</option>
          <option value="failed">Failed</option>
        </select>

        <select
          className="select-filter"
          value={recoveryFilter}
          onChange={(e) => setRecoveryFilter(e.target.value)}
        >
          <option value="ALL">All Recovery Statuses</option>
          <option value="pending">Pending</option>
          <option value="executed">Executed / Recovered</option>
          <option value="action_required">Action Required / Review</option>
          <option value="cancelled">Cancelled</option>
          <option value="failed">Failed</option>
          <option value="not_required">Not Required</option>
        </select>

        {(searchTerm || statusFilter !== 'ALL' || recoveryFilter !== 'ALL') && (
          <button className="btn-reset" onClick={handleClearFilters}>
            <RotateCcw size={14} />
            Clear Filters
          </button>
        )}
      </div>

      {/* Table Section */}
      <div className="table-container">
        {filteredTransactions.length === 0 ? (
          <div className="state-container">
            <AlertCircle size={36} color="var(--text-muted)" />
            <p style={{ fontWeight: 600 }}>No matching transactions found</p>
            <p style={{ fontSize: '0.85rem' }}>
              Try adjusting your search criteria or clear active filters.
            </p>
            <button className="btn-retry" onClick={handleClearFilters}>
              Reset Filters
            </button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Currency</th>
                <th>Payment Status</th>
                <th>Failure Reason</th>
                <th>Retries</th>
                <th>Recovery Status</th>
                <th>Created At</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} onClick={() => onSelectTransaction(tx)}>
                  <td style={{ fontWeight: 700, color: 'var(--color-brand)', fontFamily: 'monospace', fontSize: '1.02rem' }}>
                    {tx.payment_id}
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                      {tx.customer_name || tx.customer_id}
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {tx.customer_id}
                    </div>
                  </td>
                  <td style={{ fontWeight: 800, fontSize: '1.08rem' }}>{formatINR(tx.amount)}</td>
                  <td style={{ fontWeight: 600 }}>{tx.currency}</td>
                  <td>
                    <span className={`badge badge-${tx.status.toLowerCase()}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td style={{ color: tx.failure_reason ? 'var(--color-danger)' : 'var(--text-muted)', fontWeight: 600 }}>
                    {tx.failure_reason || '—'}
                  </td>
                  <td style={{ fontWeight: 700, fontSize: '1.05rem' }}>{tx.retry_count}</td>
                  <td>
                    <span className={`badge badge-${tx.recovery_status.toLowerCase()}`}>
                      {tx.recovery_status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', fontWeight: 600 }}>
                    {formatISTDateTime(tx.created_at)}
                  </td>
                  <td>
                    <ChevronRight size={18} color="var(--text-muted)" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
