import React from "react";
import { ShoppingCart, Star } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function ProductCard({ product, onSelectProduct }) {
  const { addToCart } = useCart();
  const formattedPrice = `₹${(product.price / 100).toLocaleString("en-IN")}`;

  return (
    <div className="product-card">
      <div
        className="product-card-img-wrapper"
        onClick={() => onSelectProduct(product.id)}
        style={{ cursor: "pointer" }}
      >
        <img src={product.image} alt={product.name} className="product-card-img" />
        <span className="product-badge">{product.category}</span>
      </div>

      <div className="product-card-body">
        <h3
          className="product-card-title"
          onClick={() => onSelectProduct(product.id)}
          style={{ cursor: "pointer" }}
        >
          {product.name}
        </h3>

        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.75rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {product.description}
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
          <span className="product-card-price">{formattedPrice}</span>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            className="btn-add-cart"
          >
            <ShoppingCart size={15} />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
}
