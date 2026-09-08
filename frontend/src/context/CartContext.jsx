import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("aura_cart");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item, idx) => {
        const id = item.product_id || item.id || `product-${idx}`;
        return {
          ...item,
          product_id: id,
          id: id,
          price: Number(item.price) || 0,
          quantity: Math.max(1, Number(item.quantity) || 1),
        };
      });
    } catch {
      return [];
    }
  });

  const [customer, setCustomer] = useState(() => {
    try {
      const saved = localStorage.getItem("aura_customer");
      return saved
        ? JSON.parse(saved)
        : {
            name: "Sam",
            email: "sam@gmail.com",
            phone: "+91 9876543210",
            address: "Flat 402, Sunset Heights, Bandra West, Mumbai, MH 400050",
          };
    } catch {
      return {
        name: "Sam",
        email: "sam@gmail.com",
        phone: "+91 9876543210",
        address: "Flat 402, Sunset Heights, Bandra West, Mumbai, MH 400050",
      };
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem("aura_cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to save cart to localStorage:", e);
    }
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    if (!product) return;
    const pId = String(product.product_id || product.id || product.name || Date.now());
    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex(
        (item) => String(item.product_id || item.id) === pId
      );
      if (existingIdx >= 0) {
        return prevCart.map((item, i) =>
          i === existingIdx
            ? { ...item, quantity: item.quantity + (quantity || 1) }
            : item
        );
      }
      return [
        ...prevCart,
        {
          ...product,
          product_id: pId,
          id: pId,
          price: Number(product.price) || 0,
          quantity: Math.max(1, Number(quantity) || 1),
        },
      ];
    });
    showToast(`Added ${product.name} to cart`);
  };

  const updateQuantity = (productId, newQuantityOrDelta) => {
    if (productId === undefined || productId === null) return;
    const targetId = String(productId);
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          const currentId = String(item.product_id || item.id);
          if (currentId !== targetId) return item;

          let targetQty = newQuantityOrDelta;
          if (newQuantityOrDelta === 1 || newQuantityOrDelta === -1) {
            targetQty = item.quantity + newQuantityOrDelta;
          }
          if (targetQty <= 0) return null;
          return { ...item, quantity: targetQty };
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    if (productId === undefined || productId === null) return;
    const targetId = String(productId);
    setCart((prevCart) =>
      prevCart.filter((item) => String(item.product_id || item.id) !== targetId)
    );
    showToast("Item removed from cart");
  };

  const clearCart = () => {
    setCart([]);
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
  const cartCount = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        customer,
        setCustomer,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartTotal,
        cartCount,
        showToast,
        toastMessage,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
