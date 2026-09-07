import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, Wifi, WifiOff, Bell, LogOut, UserCheck, ShoppingBag } from 'lucide-react';

export default function Header({ isConnected, isRefreshing, onRefresh, onOpenNotifications, onLogout, onOpenProfile, merchant, onToggleView }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const API_BASE = import.meta.env.VITE_RECOVERAI_API_URL || (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "http://localhost:8000" : "");

  const fetchUnreadCount = () => {
    fetch(`${API_BASE}/notifications/unread-count`)
      .then((res) => {
        if (res.ok) return res.json();
        return { unread_count: 0 };
      })
      .then((data) => setUnreadCount(data.unread_count || 0))
      .catch(() => setUnreadCount(0));
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const merchantName = merchant?.store_name || merchant?.name || 'Aura Store Admin';
  const merchantEmail = merchant?.email || 'admin@aurastore.com';

  return (
    <header className="dashboard-header">
      <div className="brand-section">
        <div className="brand-icon">
          <ShieldCheck size={26} />
        </div>
        <div>
          <h1 className="brand-title">RecoverAI</h1>
          <p className="brand-tagline">
            Autonomous Razorpay Revenue Recovery Console
          </p>
        </div>
      </div>

      <div className="header-status">
        {/* Notification Bell Button */}
        <button
          onClick={onOpenNotifications}
          className="btn-reset"
          style={{ position: 'relative', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          title="Open Notifications"
        >
          <Bell size={16} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Alerts</span>
          {unreadCount > 0 && (
            <span
              style={{
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontSize: '0.7rem',
                fontWeight: 800,
                borderRadius: '10px',
                padding: '0.1rem 0.45rem',
                marginLeft: '0.2rem',
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          className="btn-reset"
          disabled={isRefreshing}
          title="Refresh Data"
        >
          <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>

        {/* Connection Status Badge */}
        {isConnected ? (
          <div className="status-badge-online">
            <span className="pulse-dot"></span>
            <Wifi size={14} />
            API Connected
          </div>
        ) : (
          <div className="status-badge-offline">
            <WifiOff size={14} />
            Backend Offline
          </div>
        )}

        {/* Merchant Profile Badge (Placed RIGHT AFTER API Connected logo/badge) */}
        <button
          onClick={onOpenProfile}
          className="merchant-profile-badge btn-reset"
          style={{ cursor: 'pointer', textAlign: 'left', border: '1px solid var(--border-color)', marginLeft: '4px' }}
          title="View & Edit Merchant Profile"
        >
          <div className="merchant-avatar">
            <UserCheck size={16} color="#6366f1" />
          </div>
          <div className="merchant-info">
            <span className="merchant-name">{merchantName}</span>
            <span className="merchant-email">{merchantEmail}</span>
          </div>
        </button>

        {/* Aura Store E-Commerce In-App View Switcher */}
        {onToggleView && (
          <button
            onClick={onToggleView}
            title="View Aura Storefront"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.75rem',
              borderRadius: '6px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              color: '#a5b4fc',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginLeft: '4px',
            }}
          >
            <ShoppingBag size={15} color="#818cf8" />
            <span>View Storefront</span>
          </button>
        )}

        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="btn-logout"
            title="Log out of Merchant Console"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        )}
      </div>
    </header>
  );
}
