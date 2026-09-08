import React, { useState, useEffect } from "react";
import { Search, Filter } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { fetchProducts, FALLBACK_PRODUCTS } from "../services/api";

export default function ProductsPage({ onSelectProduct }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [products, setProducts] = useState(() => FALLBACK_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ paddingTop: "1.5rem" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#fff" }}>Explore All Products</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Browse our complete range of high-grade gadgets and accessories.
        </p>
      </div>

      {/* Search & Filter Header */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
          <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search products by name or feature..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", paddingLeft: "2.75rem" }}
          />
        </div>
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

      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
          No products matched your search.
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} onSelectProduct={onSelectProduct} />
          ))}
        </div>
      )}
    </div>
  );
}
