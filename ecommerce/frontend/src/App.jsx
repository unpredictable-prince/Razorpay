import React, { useState } from "react";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import Toast from "./components/Toast";

import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentPage from "./pages/PaymentPage";
import PaymentResultPage from "./pages/PaymentResultPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import ProfilePage from "./pages/ProfilePage";
import CustomerLoginPage from "./pages/CustomerLoginPage";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("autologin") === "true" || params.get("login") === "true") {
      const email = params.get("email") || "sam@gmail.com";
      const cust = {
        name: params.get("name") || email.split("@")[0],
        email: email,
        phone: "+91 9876543210",
        address: "Flat 402, Sunset Heights, Bandra West, Mumbai, MH 400050",
      };
      localStorage.setItem("aura_customer", JSON.stringify(cust));
      localStorage.setItem("aura_customer_logged_in", "true");
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    }
    return localStorage.getItem("aura_customer_logged_in") === "true";
  });

  const [activePage, setActivePage] = useState("home");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [resultData, setResultData] = useState(null);

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
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = () => {
    localStorage.removeItem("aura_customer_logged_in");
    setIsAuthenticated(false);
  };

  return (
    <CartProvider>
      {!isAuthenticated ? (
        <CustomerLoginPage onLogin={() => setIsAuthenticated(true)} />
      ) : (
        <div className="app-layout">
          <Navbar activePage={activePage} setActivePage={navigate} onLogout={handleLogout} />

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
