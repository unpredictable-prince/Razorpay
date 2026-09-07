import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MetricsCards from './components/MetricsCards';
import TransactionTable from './components/TransactionTable';
import TransactionDetailsModal from './components/TransactionDetailsModal';
import RecoveryInsights from './components/RecoveryInsights';
import RecoveryActivityLog from './components/RecoveryActivityLog';
import ErrorBanner from './components/ErrorBanner';
import NotificationDrawer from './components/NotificationDrawer';
import NotificationPageModal from './components/NotificationPageModal';
import LiveRecoveryStream from './components/LiveRecoveryStream';
import DemoController from './components/DemoController';
import CustomerJourneyModal from './components/CustomerJourneyModal';
import LoginPage from './components/LoginPage';
import MerchantCharts from './components/MerchantCharts';
import MerchantProfileModal from './components/MerchantProfileModal';
import { Sparkles, RefreshCw, Zap, LayoutDashboard, Activity, ShieldCheck, BarChart3 } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("autologin") === "merchant" || params.get("login") === "true") {
      localStorage.setItem('recoverai_auth', 'true');
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    }
    return localStorage.getItem('recoverai_auth') === 'true';
  });

  const [merchant, setMerchant] = useState(() => {
    const saved = localStorage.getItem('recoverai_merchant_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error(err);
      }
    }
    return null;
  });

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    total_transactions: 0,
    failed_payments: 0,
    captured_payments: 0,
    failed_revenue: 0,
    recovered_revenue: 0,
    recovery_rate: 0.0,
    pending_recovery: 0,
    human_review_required: 0,
  });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Active View Tab ("overview" | "charts" | "live_stream")
  const [activeTab, setActiveTab] = useState("overview");

  // Notification Modals State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFullNotifOpen, setIsFullNotifOpen] = useState(false);

  const fetchData = async () => {
    if (!isAuthenticated) return;
    setIsRefreshing(true);
    setErrorMsg(null);

    try {
      // Fetch stats and transactions in parallel from backend
      const [statsRes, txRes] = await Promise.all([
        fetch(`${API_BASE_URL}/transactions/stats`),
        fetch(`${API_BASE_URL}/transactions/`),
      ]);

      if (!statsRes.ok || !txRes.ok) {
        throw new Error(`HTTP Error: Stats status ${statsRes.status}, Transactions status ${txRes.status}`);
      }

      const statsData = await statsRes.json();
      const txData = await txRes.json();

      setStats(statsData);
      setTransactions(txData);
      setIsConnected(true);
    } catch (err) {
      console.error('Failed to fetch data from RecoverAI API:', err);
      setIsConnected(false);
      setErrorMsg(err.message || 'Failed to connect to backend server');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleLoginSuccess = (merchantProfileData) => {
    if (merchantProfileData) {
      setMerchant(merchantProfileData);
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('recoverai_auth');
    setIsAuthenticated(false);
  };

  const handleSelectPaymentId = (paymentId) => {
    const found = transactions.find((t) => t.payment_id === paymentId);
    if (found) {
      setSelectedTransaction(found);
    } else {
      fetch(`${API_BASE_URL}/transactions/${paymentId}`)
        .then((res) => res.json())
        .then((data) => setSelectedTransaction(data))
        .catch((err) => console.error(err));
    }
  };

  // If user is not authenticated, render Login Page
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLoginSuccess} />;
  }

  return (
    <div className="dashboard-container">
      {/* Demo Environment Banner */}
      <div
        style={{
          background: "#1e1b4b",
          color: "#a5b4fc",
          padding: "0.4rem 1.5rem",
          fontSize: "0.78rem",
          fontWeight: 700,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #312e81",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ShieldCheck size={14} color="#818cf8" />
          <span>RAZORPAY TEST MODE ACTIVE — RECOVERAI DEMO ENVIRONMENT</span>
        </div>
        <span>Aura Store Sandbox Integration</span>
      </div>

      {/* Header Bar */}
      <Header
        isConnected={isConnected}
        isRefreshing={isRefreshing}
        onRefresh={fetchData}
        onOpenNotifications={() => setIsDrawerOpen(true)}
        onLogout={handleLogout}
        onOpenProfile={() => setIsProfileOpen(true)}
        merchant={merchant}
      />

      {/* Demo Controller Toolbar */}
      <DemoController
        onTriggerScenario={() => fetchData()}
        onResetDemo={() => fetchData()}
      />

      {/* RecoverAI Value Proposition Banner */}
      <div className="recovery-banner">
        <Sparkles size={20} color="var(--color-brand)" />
        <div>
          <strong>RecoverAI Autonomous Agent Active:</strong> RecoverAI automatically analyzes failed payments and determines whether they can safely be recovered.
        </div>
      </div>

      {/* Connection Error Notification */}
      {!isConnected && !isLoading && (
        <ErrorBanner errorMsg={errorMsg} onRetry={fetchData} />
      )}

      {/* Navigation View Tabs */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <button
          onClick={() => setActiveTab("overview")}
          style={{
            padding: "0.6rem 1.25rem",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: activeTab === "overview" ? "var(--color-brand)" : "var(--bg-secondary)",
            color: activeTab === "overview" ? "#fff" : "var(--text-muted)",
            border: "1px solid var(--border-color)",
            cursor: "pointer",
          }}
        >
          <LayoutDashboard size={16} />
          <span>Dashboard Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("charts")}
          style={{
            padding: "0.6rem 1.25rem",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: activeTab === "charts" ? "var(--color-brand)" : "var(--bg-secondary)",
            color: activeTab === "charts" ? "#fff" : "var(--text-muted)",
            border: "1px solid var(--border-color)",
            cursor: "pointer",
          }}
        >
          <BarChart3 size={16} />
          <span>Analytics & Visual Charts</span>
        </button>

        <button
          onClick={() => setActiveTab("live_stream")}
          style={{
            padding: "0.6rem 1.25rem",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: activeTab === "live_stream" ? "var(--color-brand)" : "var(--bg-secondary)",
            color: activeTab === "live_stream" ? "#fff" : "var(--text-muted)",
            border: "1px solid var(--border-color)",
            cursor: "pointer",
          }}
        >
          <Zap size={16} />
          <span>Live Recovery & Pipeline</span>
        </button>
      </div>

      {/* Content Rendering */}
      {isLoading ? (
        <div className="state-container">
          <RefreshCw size={32} className="spin" color="var(--color-brand)" />
          <p style={{ fontWeight: 600 }}>Loading RecoverAI Merchant Dashboard...</p>
        </div>
      ) : activeTab === "live_stream" ? (
        <LiveRecoveryStream
          onSelectTransaction={(tx) => setSelectedTransaction(tx)}
          refreshTrigger={isRefreshing}
        />
      ) : activeTab === "charts" ? (
        <>
          <MetricsCards stats={stats} />
          <MerchantCharts stats={stats} transactions={transactions} />
        </>
      ) : (
        <>
          {/* Metrics Summary Cards */}
          <MetricsCards stats={stats} />

          {/* Interactive Merchant Visual Charts */}
          <MerchantCharts stats={stats} transactions={transactions} />

          {/* Insights & Activity Grid */}
          <div className="dashboard-grid-2">
            <RecoveryInsights stats={stats} transactions={transactions} />
            <RecoveryActivityLog
              transactions={transactions}
              onSelectTransaction={(tx) => setSelectedTransaction(tx)}
            />
          </div>

          {/* Transaction Ledger Table */}
          <TransactionTable
            transactions={transactions}
            onSelectTransaction={(tx) => setSelectedTransaction(tx)}
          />

          {/* Transaction Inspection Modal */}
          {selectedTransaction && (
            <TransactionDetailsModal
              transaction={selectedTransaction}
              onClose={() => setSelectedTransaction(null)}
            />
          )}

          {/* Customer Journey Modal */}
          {selectedCustomerId && (
            <CustomerJourneyModal
              customerId={selectedCustomerId}
              onClose={() => setSelectedCustomerId(null)}
            />
          )}
        </>
      )}

      {/* Global Slide-Over Notification Drawer (Triggered by Alerts button) */}
      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectTransaction={handleSelectPaymentId}
        onOpenFullPage={() => setIsFullNotifOpen(true)}
      />

      {/* Global Notification Center Full Modal */}
      <NotificationPageModal
        isOpen={isFullNotifOpen}
        onClose={() => setIsFullNotifOpen(false)}
        onSelectTransaction={handleSelectPaymentId}
      />

      {/* Global Merchant Profile Details & Edit Modal */}
      <MerchantProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        merchant={merchant}
        stats={stats}
        onSaveMerchant={(updatedData) => setMerchant(updatedData)}
      />
    </div>
  );
}
