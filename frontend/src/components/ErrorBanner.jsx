import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

export default function ErrorBanner({ errorMsg, onRetry }) {
  return (
    <div
      style={{
        background: 'var(--color-danger-bg)',
        border: '1px solid var(--color-danger-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#fda4af',
        margin: '12px 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <AlertOctagon size={28} color="var(--color-danger)" />
        <div>
          <h4 style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
            Backend API Connection Error
          </h4>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            {errorMsg || 'Unable to connect to RecoverAI FastAPI backend (http://127.0.0.1:8000). Ensure backend server is running.'}
          </p>
        </div>
      </div>

      <button className="btn-retry" onClick={onRetry} style={{ whiteSpace: 'nowrap' }}>
        <RefreshCw size={14} style={{ marginRight: 6 }} />
        Retry Connection
      </button>
    </div>
  );
}
