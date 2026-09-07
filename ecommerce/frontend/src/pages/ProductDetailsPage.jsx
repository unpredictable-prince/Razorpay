import React, { useState, useEffect } from "react";
import { ArrowLeft, ShoppingBag, ShieldCheck, Truck, Plus, Minus, Check, Star } from "lucide-react";
import { fetchProductById } from "../services/api";
import { useCart } from "../context/CartContext";

export default function ProductDetailsPage({ productId, onNavigate, onBuyNow }) {
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addToCart, openCart } = useCart();

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    fetchProductById(productId)
      .then((data) => setProduct(data))
      .catch((err) => console.error("Error fetching product details:", err))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>Loading product details...</div>;
  }

  if (!product) {
    return (
      <div style={{ padding: "4rem", textAlign: "center" }}>
        <h3>Product not found</h3>
        <button onClick={() => onNavigate("products")} className="btn-hero-secondary" style={{ marginTop: "1rem" }}>
          Back to Catalog
        </button>
      </div>
    );
  }

  const formattedPrice = `₹${(product.price / 100).toLocaleString("en-IN")}`;

  return (
    <div style={{ paddingTop: "1.5rem" }}>
      <button
        onClick={() => onNavigate("products")}
        className="btn-hero-secondary"
        style={{ marginBottom: "1.5rem", padding: "0.5rem 1rem", fontSize: "0.85rem" }}
      >
        <ArrowLeft size={16} />
        <span>Back to Products</span>
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "3rem", background: "var(--bg-surface)", border: "var(--glass-border)", borderRadius: "var(--radius-lg)", padding: "2.5rem" }}>
        {/* Product Image */}
        <div style={{ borderRadius: "var(--radius-md)", overflow: "hidden", background: "#0f172a", aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(0 15px 25px rgba(0,0,0,0.5))" }} />
        </div>

        {/* Specs & Buy Controls */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span className="product-badge" style={{ position: "static", width: "fit-content", marginBottom: "0.75rem" }}>
            {product.category}
          </span>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#fff", marginBottom: "0.5rem" }}>{product.name}</h1>
          
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem", color: "#f59e0b", fontSize: "0.9rem" }}>
            <Star size={16} fill="#f59e0b" />
            <span>4.9 (High Rating) • In Stock</span>
          </div>

          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--primary)", marginBottom: "1.5rem" }}>
            {formattedPrice}
          </div>

          <p style={{ color: "var(--text-muted)", fontSize: "1rem", lineHeight: "1.7", marginBottom: "2rem" }}>
            {product.description}
          </p>

          {/* Quantity Selector */}
          <div style={{ marginBottom: "2rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>Quantity</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                style={{ background: "rgba(255,255,255,0.05)", border: "var(--glass-border)", color: "#fff", width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <Minus size={14} />
              </button>
              <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff", width: "2.5rem", textAlign: "center" }}>{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                style={{ background: "rgba(255,255,255,0.05)", border: "var(--glass-border)", color: "#fff", width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
            <button
              onClick={() => {
                addToCart(product, quantity);
                openCart();
              }}
              className="btn-hero-secondary"
              style={{ flex: 1, justifyContent: "center" }}
            >
              <ShoppingBag size={18} />
              <span>Add to Cart</span>
            </button>

            <button
              onClick={() => {
                addToCart(product, quantity);
                onBuyNow();
              }}
              className="btn-hero-primary"
              style={{ flex: 1, justifyContent: "center" }}
            >
              <span>Buy Now</span>
            </button>
          </div>

          {/* Value Badges */}
          <div style={{ borderTop: "var(--glass-border)", paddingTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              <Truck size={16} color="var(--primary)" />
              <span>Express Shipping — Ships within 24 hours</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              <ShieldCheck size={16} color="var(--success)" />
              <span>Encrypted Razorpay Payment Gateway Test Integration</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
