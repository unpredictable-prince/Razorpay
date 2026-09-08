import React, { useState } from 'react';
import { Search, Filter, RotateCcw, ChevronRight, AlertCircle, Trash2 } from 'lucide-react';
import { formatISTDateTime } from '../utils/dateUtils';

export default function TransactionTable({ transactions, onSelectTransaction, onRefresh, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [recoveryFilter, setRecoveryFilter] = useState('ALL');
  const [deletingPaymentId, setDeletingPaymentId] = useState(null);
  const [txToDelete, setTxToDelete] = useState(null);

  const API_BASE = import.meta.env.VITE_RECOVERAI_API_URL || (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "http://127.0.0.1:8000" : "");

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

  const handleDeleteConfirm = async () => {
    if (!txToDelete) return;
    setDeletingPaymentId(txToDelete.payment_id);
    if (onDelete) {
      await onDelete(txToDelete.payment_id);
      setTxToDelete(null);
      setDeletingPaymentId(null);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/transactions/${txToDelete.payment_id}`, {
        method: 'DELETE',
      });
      if (res.ok && onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to delete transaction:", err);
    } finally {
      setTxToDelete(null);
      setDeletingPaymentId(null);
    }
  };

  return (
    <div>
      <div className="section-title-container">
        <h2 className="section-title">
          <Filter size={20} color="var(--color-brand)" />
          Transaction Ledger & Customer Records
        </h2>
        <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Showing {filteredTransactions.length} of {transactions.length} records
        </span>
      </div>

      {/* Filter Controls Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
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
            <RotateCcw size={16} />
            Clear Filters
          </button>
        )}
      </div>

      {/* Table Section */}
      <div className="table-container">
        {filteredTransactions.length === 0 ? (
          <div className="state-container">
            <AlertCircle size={44} color="var(--text-muted)" />
            <p style={{ fontWeight: 800, fontSize: '1.2rem' }}>No matching transactions found</p>
            <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
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
                <th style={{ textAlign: 'center' }}>Actions</th>
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
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      {/* Delete Action Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTxToDelete(tx);
                        }}
                        style={{
                          background: 'rgba(244, 63, 94, 0.12)',
                          color: '#f43f5e',
                          border: '1px solid rgba(244, 63, 94, 0.3)',
                          padding: '0.45rem 0.65rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                        }}
                        title="Delete this record"
                      >
                        <Trash2 size={15} />
                        <span>Delete</span>
                      </button>

                      <ChevronRight size={18} color="var(--text-muted)" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {txToDelete && (
        <div className="modal-overlay" onClick={() => setTxToDelete(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={22} color="#f43f5e" />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Delete Transaction Record?</h3>
            </div>
            <p style={{ fontSize: '1.02rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              Are you sure you want to permanently delete record <strong>{txToDelete.payment_id}</strong> for customer <strong>{txToDelete.customer_name || txToDelete.customer_id}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn-secondary" onClick={() => setTxToDelete(null)}>
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deletingPaymentId !== null}
                style={{
                  background: '#f43f5e',
                  color: '#fff',
                  border: 'none',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '1rem',
                  cursor: 'pointer',
                }}
              >
                {deletingPaymentId ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
