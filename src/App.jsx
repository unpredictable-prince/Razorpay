import React, { useState, useEffect } from "react";
import { CartProvider } from "./context/CartContext";
import AuthPortalPage from "./components/AuthPortalPage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import Toast from "./components/Toast";

// Customer E-Commerce Store Pages
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentPage from "./pages/PaymentPage";
import PaymentResultPage from "./pages/PaymentResultPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import ProfilePage from "./pages/ProfilePage";

// RecoverAI Merchant Console Components
import Header from "./components/Header";
import MetricsCards from "./components/MetricsCards";
import TransactionTable from "./components/TransactionTable";
import TransactionDetailsModal from "./components/TransactionDetailsModal";
import RecoveryInsights from "./components/RecoveryInsights";
import RecoveryActivityLog from "./components/RecoveryActivityLog";
import ErrorBanner from "./components/ErrorBanner";
import NotificationDrawer from "./components/NotificationDrawer";
import NotificationPageModal from "./components/NotificationPageModal";
import LiveRecoveryStream from "./components/LiveRecoveryStream";
import DemoController from "./components/DemoController";
import CustomerJourneyModal from "./components/CustomerJourneyModal";
import MerchantCharts from "./components/MerchantCharts";
import MerchantProfileModal from "./components/MerchantProfileModal";
import { Sparkles, RefreshCw, Zap, LayoutDashboard, ShieldCheck, BarChart3 } from "lucide-react";

const RECOVERAI_API_URL = import.meta.env.VITE_RECOVERAI_API_URL || (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "http://127.0.0.1:8000" : "");

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return (
      localStorage.getItem("aura_customer_logged_in") === "true" ||
      localStorage.getItem("recoverai_auth") === "true"
    );
  });

  const [userRole, setUserRole] = useState(() => {
    if (localStorage.getItem("recoverai_auth") === "true") return "merchant";
    return "customer";
  });

  const [viewMode, setViewMode] = useState(() => {
    if (localStorage.getItem("recoverai_auth") === "true") return "merchant_console";
    return "store";
  });

  // Customer Navigation State
  const [activePage, setActivePage] = useState("home");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [resultData, setResultData] = useState(null);

  // Merchant Console State
  const [merchant, setMerchant] = useState(() => {
    const saved = localStorage.getItem("recoverai_merchant_profile");
    return saved ? JSON.parse(saved) : null;
  });

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
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const [activeMerchantTab, setActiveMerchantTab] = useState("overview");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFullNotifOpen, setIsFullNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Fetch Merchant Dashboard Data
  const fetchMerchantData = async () => {
    if (!isAuthenticated) return;
    setIsRefreshing(true);
    setErrorMsg(null);

    try {
      const [statsRes, txRes] = await Promise.all([
        fetch(`${RECOVERAI_API_URL}/transactions/stats`),
        fetch(`${RECOVERAI_API_URL}/transactions/`),
      ]);

      if (statsRes.ok && txRes.ok) {
        const statsData = await statsRes.json();
        const txData = await txRes.json();
        setStats(statsData);
        setTransactions(txData);
        setIsConnected(true);
      }
    } catch (err) {
      console.error(err);
      setIsConnected(false);
      setErrorMsg(err.message || "Failed to connect to RecoverAI API");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && (userRole === "merchant" || viewMode === "merchant_console")) {
      fetchMerchantData();
      const interval = setInterval(fetchMerchantData, 4000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, userRole, viewMode]);

  const handleLoginSuccess = (role, profileData) => {
    setIsAuthenticated(true);
    setUserRole(role);
    if (role === "merchant") {
      if (profileData) setMerchant(profileData);
      setViewMode("merchant_console");
    } else {
      setViewMode("store");
      setActivePage("home");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("aura_customer_logged_in");
    localStorage.removeItem("recoverai_auth");
    setIsAuthenticated(false);
    setUserRole("customer");
    setViewMode("store");
  };

  const handleSelectProduct = (productId) => {
    setSelectedProductId(productId);
    setActivePage("product-details");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOrderCreated = (order) => {
    setActiveOrder(order);
    setActivePage("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePaymentComplete = (result) => {
    setResultData(result);
    setActivePage("payment-result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRetryPayment = (order) => {
    setActiveOrder(order);
    setActivePage("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigate = (page) => {
    setViewMode("store");
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectPaymentId = (paymentId) => {
    const found = transactions.find((t) => t.payment_id === paymentId);
    if (found) {
      setSelectedTransaction(found);
    } else {
      fetch(`${RECOVERAI_API_URL}/transactions/${paymentId}`)
        .then((res) => res.json())
        .then((data) => setSelectedTransaction(data))
        .catch((err) => console.error(err));
    }
  };

  return (
    <CartProvider>
      {!isAuthenticated ? (
        <AuthPortalPage onLoginSuccess={handleLoginSuccess} />
      ) : viewMode === "merchant_console" ? (
        /* VIEW MODE 1: RECOVERAI MERCHANT CONSOLE (SINGLE CLEAN HEADER, NO DOUBLE NAVBARS) */
        <div className="dashboard-container">
          {/* Environment Banner */}
          <div
            style={{
              background: "#1e1b4b",
              color: "#a5b4fc",
              padding: "0.45rem 1.5rem",
              fontSize: "0.78rem",
              fontWeight: 700,
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              border: "1px solid #312e81",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ShieldCheck size={14} color="#818cf8" />
              <span>RAZORPAY TEST MODE ACTIVE — RECOVERAI REVENUE RECOVERY CONSOLE</span>
            </div>
            <span>Single Unified Platform</span>
          </div>

          {/* RecoverAI Merchant Header */}
          <Header
            isConnected={isConnected}
            isRefreshing={isRefreshing}
            onRefresh={fetchMerchantData}
            onOpenNotifications={() => setIsDrawerOpen(true)}
            onLogout={handleLogout}
            onOpenProfile={() => setIsProfileOpen(true)}
            merchant={merchant}
            onToggleView={() => setViewMode("store")}
          />

          {/* Demo Controller Toolbar */}
          <DemoController
            onTriggerScenario={() => fetchMerchantData()}
            onResetDemo={() => fetchMerchantData()}
          />

          {/* Value Proposition Banner */}
          <div className="recovery-banner" style={{ background: "rgba(99, 102, 241, 0.12)", border: "1px solid rgba(99, 102, 241, 0.3)", padding: "1rem 1.25rem", borderRadius: "12px", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Sparkles size={20} color="var(--color-brand)" />
            <div style={{ fontSize: "0.9rem" }}>
              <strong>RecoverAI Autonomous Agent Active:</strong> Automatically analyzing payment failures, evaluating deterministic guardrails, and executing recovery retries.
            </div>
          </div>

          {!isConnected && !isLoading && (
            <ErrorBanner errorMsg={errorMsg} onRetry={fetchMerchantData} />
          )}

          {/* Navigation View Tabs */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={() => setActiveMerchantTab("overview")}
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: activeMerchantTab === "overview" ? "var(--color-brand)" : "var(--bg-secondary)",
                color: activeMerchantTab === "overview" ? "#fff" : "var(--text-muted)",
                border: "1px solid var(--border-color)",
                cursor: "pointer",
              }}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => setActiveMerchantTab("charts")}
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: activeMerchantTab === "charts" ? "var(--color-brand)" : "var(--bg-secondary)",
                color: activeMerchantTab === "charts" ? "#fff" : "var(--text-muted)",
                border: "1px solid var(--border-color)",
                cursor: "pointer",
              }}
            >
              <BarChart3 size={16} />
              <span>Analytics & Visual Charts</span>
            </button>

            <button
              onClick={() => setActiveMerchantTab("live_stream")}
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: activeMerchantTab === "live_stream" ? "var(--color-brand)" : "var(--bg-secondary)",
                color: activeMerchantTab === "live_stream" ? "#fff" : "var(--text-muted)",
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
            <div style={{ textAlign: "center", padding: "3rem 0" }}>
              <RefreshCw size={32} className="spin" color="var(--color-brand)" />
              <p style={{ fontWeight: 600, marginTop: "1rem" }}>Loading Merchant Revenue Recovery Data...</p>
            </div>
          ) : activeMerchantTab === "live_stream" ? (
            <LiveRecoveryStream
              onSelectTransaction={(tx) => setSelectedTransaction(tx)}
              refreshTrigger={isRefreshing}
            />
          ) : activeMerchantTab === "charts" ? (
            <>
              <MetricsCards stats={stats} />
              <MerchantCharts stats={stats} transactions={transactions} />
            </>
          ) : (
            <>
              <MetricsCards stats={stats} />
              <MerchantCharts stats={stats} transactions={transactions} />
              <div className="dashboard-grid-2">
                <RecoveryInsights stats={stats} transactions={transactions} />
                <RecoveryActivityLog
                  transactions={transactions}
                  onSelectTransaction={(tx) => setSelectedTransaction(tx)}
                />
              </div>
              <TransactionTable
                transactions={transactions}
                onSelectTransaction={(tx) => setSelectedTransaction(tx)}
                onRefresh={fetchMerchantData}
              />

              {selectedTransaction && (
                <TransactionDetailsModal
                  transaction={selectedTransaction}
                  onClose={() => setSelectedTransaction(null)}
                  onRefresh={fetchMerchantData}
                />
              )}

              {selectedCustomerId && (
                <CustomerJourneyModal
                  customerId={selectedCustomerId}
                  onClose={() => setSelectedCustomerId(null)}
                />
              )}
            </>
          )}

          <NotificationDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            onSelectTransaction={handleSelectPaymentId}
            onOpenFullPage={() => setIsFullNotifOpen(true)}
          />

          <NotificationPageModal
            isOpen={isFullNotifOpen}
            onClose={() => setIsFullNotifOpen(false)}
            onSelectTransaction={handleSelectPaymentId}
          />

          <MerchantProfileModal
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            merchant={merchant}
            stats={stats}
            onSaveMerchant={(updatedData) => setMerchant(updatedData)}
          />
        </div>
      ) : (
        /* VIEW MODE 2: AURA STORE E-COMMERCE PLATFORM (SINGLE STORE NAVBAR & FOOTER) */
        <div className="app-layout">
          <Navbar
            activePage={activePage}
            setActivePage={navigate}
            onLogout={handleLogout}
            userRole={userRole}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />

          <main className="main-content">
            <div className="container">
              {activePage === "home" && (
                <HomePage onNavigate={navigate} onSelectProduct={handleSelectProduct} />
              )}

              {activePage === "products" && (
                <ProductsPage onSelectProduct={handleSelectProduct} />
              )}

              {activePage === "product-details" && (
                <ProductDetailsPage
                  productId={selectedProductId}
                  onNavigate={navigate}
                  onBuyNow={() => navigate("checkout")}
                />
              )}

              {activePage === "cart" && (
                <CartPage
                  onProceedToCheckout={() => navigate("checkout")}
                  onNavigate={navigate}
                />
              )}

              {activePage === "checkout" && (
                <CheckoutPage
                  onNavigate={navigate}
                  onOrderCreated={handleOrderCreated}
                />
              )}

              {activePage === "payment" && (
                <PaymentPage
                  order={activeOrder}
                  onNavigate={navigate}
                  onPaymentComplete={handlePaymentComplete}
                />
              )}

              {activePage === "payment-result" && (
                <PaymentResultPage
                  resultData={resultData}
                  onNavigate={navigate}
                  onRetryPayment={handleRetryPayment}
                />
              )}

              {activePage === "my-orders" && (
                <MyOrdersPage
                  onRetryPayment={handleRetryPayment}
                  onNavigate={navigate}
                />
              )}

              {activePage === "profile" && <ProfilePage onLogout={handleLogout} />}
            </div>
          </main>

          <CartDrawer onProceedToCheckout={() => navigate("checkout")} />
          <Toast />
          <Footer />
        </div>
      )}
    </CartProvider>
  );
}
