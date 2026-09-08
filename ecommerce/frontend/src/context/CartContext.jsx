import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("aura_cart");
    return saved ? JSON.parse(saved) : [];
  });

  const [customer, setCustomer] = useState(() => {
    const saved = localStorage.getItem("aura_customer");
    return saved
      ? JSON.parse(saved)
      : {
          name: "Sam",
          email: "sam@gmail.com",
          phone: "+91 9876543210",
          address: "Flat 402, Sunset Heights, Bandra West, Mumbai, MH 400050",
        };
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    localStorage.setItem("aura_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    const pId = product.product_id || product.id;
    setCart((prevCart) => {
      const existing = prevCart.find((item) => (item.product_id || item.id) === pId);
      if (existing) {
        return prevCart.map((item) =>
          (item.product_id || item.id) === pId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { ...product, product_id: pId, id: pId, quantity }];
    });
    showToast(`Added ${product.name} to cart`);
  };

  const updateQuantity = (productId, newQuantityOrDelta) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          const currentId = item.product_id || item.id;
          if (currentId !== productId) return item;

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
    setCart((prevCart) =>
      prevCart.filter((item) => (item.product_id || item.id) !== productId)
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

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
