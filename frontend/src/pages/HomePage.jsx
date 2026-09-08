import React, { useState, useEffect } from "react";
import { ArrowRight, ShieldCheck, Truck, Zap, Star, Sparkles } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { fetchProducts, FALLBACK_PRODUCTS } from "../services/api";

export default function HomePage({ onNavigate, onSelectProduct }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [products, setProducts] = useState(() => FALLBACK_PRODUCTS);

  const categories = ["All", "Audio", "Wearables", "Gaming", "Lifestyle", "Accessories", "Power", "Tech"];

  useEffect(() => {
    const initial = activeCategory && activeCategory.toLowerCase() !== "all"
      ? FALLBACK_PRODUCTS.filter((p) => p.category.toLowerCase() === activeCategory.toLowerCase())
      : FALLBACK_PRODUCTS;
    setProducts(initial);

    fetchProducts(activeCategory)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      })
      .catch((err) => console.error("Error fetching products:", err));
  }, [activeCategory]);

  return (
    <div>
      {/* Cinematic Hero Section */}
      <section className="hero-section">
        <div className="hero-glow" />
        <div className="container hero-grid">
          <div>
            <span className="brand-badge" style={{ fontSize: "0.8rem", padding: "0.35rem 0.85rem", marginBottom: "1rem", display: "inline-block" }}>
              ✨ NEXT-GEN ELECTRONICS STOREFRONT
            </span>
            <h1 className="hero-title">
              Engineered for Ultimate Performance.
            </h1>
            <p className="hero-subtitle">
              Discover high-performance audio gear, smart wearables, and premium gaming accessories with instant Razorpay checkout.
            </p>

            <div className="hero-cta-group">
              <button onClick={() => onNavigate("products")} className="btn-hero-primary">
                <span>Explore Catalog</span>
                <ArrowRight size={18} />
              </button>

              <button onClick={() => onNavigate("my-orders")} className="btn-hero-secondary">
                My Orders
              </button>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-card-3d">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <span className="product-badge">FEATURED GEAR</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#f59e0b", fontSize: "0.85rem", fontWeight: 700 }}>
                  <Star size={14} fill="#f59e0b" />
                  <span>4.9 (128 reviews)</span>
                </div>
              </div>

              <img
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"
                alt="Aura Studio Pro Headphones"
                className="hero-product-img"
              />

              <div style={{ marginTop: "1rem" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff" }}>Aura Studio Pro Wireless</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.25rem 0 0.75rem 0" }}>Active Noise Cancelling • 40h Battery</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--primary)" }}>₹2,999</span>
                  <button onClick={() => onNavigate("products")} className="btn-hero-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.8rem" }}>
                    View Gear
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Badges */}
      <section style={{ margin: "2rem 0 4rem 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
          <div style={{ background: "var(--bg-surface)", border: "var(--glass-border)", padding: "1.5rem", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ background: "rgba(99, 102, 241, 0.15)", color: "var(--primary)", padding: "0.85rem", borderRadius: "var(--radius-md)" }}>
              <Truck size={24} />
            </div>
            <div>
              <h4 style={{ fontWeight: 700, fontSize: "1rem", color: "#fff" }}>Express Shipping</h4>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Free 2-day delivery across India</p>
            </div>
          </div>

          <div style={{ background: "var(--bg-surface)", border: "var(--glass-border)", padding: "1.5rem", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--success)", padding: "0.85rem", borderRadius: "var(--radius-md)" }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 style={{ fontWeight: 700, fontSize: "1rem", color: "#fff" }}>Razorpay Test Gateway</h4>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>100% encrypted & secure checkout</p>
            </div>
          </div>

          <div style={{ background: "var(--bg-surface)", border: "var(--glass-border)", padding: "1.5rem", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ background: "rgba(6, 182, 212, 0.15)", color: "var(--accent)", padding: "0.85rem", borderRadius: "var(--radius-md)" }}>
              <Zap size={24} />
            </div>
            <div>
              <h4 style={{ fontWeight: 700, fontSize: "1rem", color: "#fff" }}>Instant Recovery Guarantee</h4>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Frictionless retry on failed payments</p>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Section */}
      <section style={{ marginTop: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#fff" }}>Featured Catalog</h2>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Handpicked gadgets and gear for your everyday setup</p>
          </div>
          <button onClick={() => onNavigate("products")} className="btn-hero-secondary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }}>
            View All Products
          </button>
        </div>

        {/* Category Filter Chips */}
        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "0.5rem 1.15rem",
                borderRadius: "var(--radius-full)",
                fontSize: "0.85rem",
                fontWeight: 700,
                background: activeCategory === cat ? "var(--primary)" : "rgba(255, 255, 255, 0.05)",
                color: activeCategory === cat ? "#fff" : "var(--text-muted)",
                border: activeCategory === cat ? "1px solid var(--primary)" : "var(--glass-border)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="product-grid">
          {products.map((prod) => (
            <ProductCard key={prod.id} product={prod} onSelectProduct={onSelectProduct} />
          ))}
        </div>
      </section>
    </div>
  );
}
