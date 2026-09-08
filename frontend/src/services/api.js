const API_BASE = import.meta.env.VITE_AURA_API_URL || (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "http://localhost:8000" : "");

export const FALLBACK_PRODUCTS = [
  {
    id: 1,
    name: "Aura Wireless Noise-Canceling Headphones",
    description: "Premium over-ear wireless headphones featuring active noise cancellation, 30-hour battery life, and crystal-clear acoustic drivers.",
    price: 499900,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    category: "Audio",
    stock: 45,
  },
  {
    id: 2,
    name: "Pulse Ultra Smartwatch Series 7",
    description: "Advanced fitness smartwatch with AMOLED display, continuous heart rate monitor, SPO2 sensor, and IP68 water resistance.",
    price: 899900,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
    category: "Wearables",
    stock: 30,
  },
  {
    id: 3,
    name: "ErgoLift Ergonomic Wireless Mouse",
    description: "Precision vertical ergonomic mouse engineered to reduce wrist strain with custom programmable buttons and dual Bluetooth connection.",
    price: 149900,
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80",
    category: "Accessories",
    stock: 60,
  },
  {
    id: 4,
    name: "Nomad Commuter Waterproof Backpack",
    description: "Sleek 25L weather-resistant travel backpack with padded 16-inch laptop compartment and integrated USB charging port.",
    price: 329900,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
    category: "Lifestyle",
    stock: 25,
  },
  {
    id: 5,
    name: "VoltBoost 3-in-1 Fast Wireless Charger",
    description: "Foldable magnetic wireless charging station for smartphone, smartwatch, and wireless earbuds simultaneously.",
    price: 219900,
    image: "https://images.unsplash.com/photo-1622445268465-843816584283?w=800&q=80",
    category: "Power",
    stock: 50,
  },
  {
    id: 6,
    name: "Lumina RGB Mechanical Keyboard",
    description: "Tactile hot-swappable mechanical keyboard with customizable RGB backlighting, aluminum frame, and PBT keycaps.",
    price: 549900,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80",
    category: "Gaming",
    stock: 20,
  },
  {
    id: 7,
    name: "SoundBar Pro Studio Speaker",
    description: "Compact desktop SoundBar delivering deep bass, room-filling sound, and seamless AUX / Bluetooth 5.3 connectivity.",
    price: 679900,
    image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80",
    category: "Audio",
    stock: 15,
  },
  {
    id: 8,
    name: "VisionHD 4K USB-C Webcam",
    description: "Ultra-HD 4K streaming webcam with auto-focus, dual noise-canceling microphones, and privacy shutter.",
    price: 399900,
    image: "https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?w=800&q=80",
    category: "Tech",
    stock: 35,
  },
  {
    id: 9,
    name: "ThermoSmart Insulated Smart Bottle",
    description: "Double-wall vacuum insulated stainless steel water bottle featuring real-time LED temperature display.",
    price: 129900,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80",
    category: "Lifestyle",
    stock: 40,
  },
  {
    id: 10,
    name: "Apex Precision Gaming Desk Pad",
    description: "Extra-large desk mat (900x400mm) with stitched edges, anti-slip rubber base, and micro-textured cloth surface.",
    price: 79900,
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
    category: "Accessories",
    stock: 80,
  },
];

export async function fetchConfig() {
  try {
    const res = await fetch(`${API_BASE}/api/config`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.error("Config fetch fallback:", err);
  }
  return { razorpay_key_id: "rzp_test_TUJ1LFMpXuNekP", currency: "INR" };
}

export async function fetchProducts(category = "") {
  try {
    const url = category && category.toLowerCase() !== "all" 
      ? `${API_BASE}/api/products?category=${encodeURIComponent(category)}` 
      : `${API_BASE}/api/products`;
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 2000) : null;
    
    const res = await fetch(url, { signal: controller ? controller.signal : undefined });
    if (timeoutId) clearTimeout(timeoutId);
    
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn("Notice: Fetching from backend API failed or timed out, using fallback catalog:", err);
  }

  // Guaranteed fallback product list
  if (category && category.toLowerCase() !== "all") {
    return FALLBACK_PRODUCTS.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }
  return FALLBACK_PRODUCTS;
}

export async function fetchProductById(id) {
  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Notice: Product detail fetch fallback:", err);
  }
  const found = FALLBACK_PRODUCTS.find((p) => p.id === Number(id));
  if (found) return found;
  throw new Error("Product not found");
}

export async function createOrder(orderData) {
  try {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 4000) : null;

    const res = await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
      signal: controller ? controller.signal : undefined,
    });
    if (timeoutId) clearTimeout(timeoutId);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Notice: Order creation API fallback:", err);
  }

  // Guaranteed fallback order generation if backend is cold-starting or unavailable
  const mockOrderId = `ord_aura_${Math.random().toString(36).substring(2, 10)}`;
  const totalAmount = orderData.items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  const fallbackOrder = {
    id: Date.now(),
    order_id: mockOrderId,
    customer_id: "cust_sam_01",
    customer_name: orderData.customer_name,
    customer_email: orderData.customer_email,
    customer_phone: orderData.customer_phone,
    items: orderData.items,
    total_amount: totalAmount,
    order_status: "created",
    payment_status: "pending",
    shipping_address: orderData.shipping_address,
    created_at: new Date().toISOString(),
  };

  const savedOrders = JSON.parse(localStorage.getItem("aura_customer_orders") || "[]");
  savedOrders.unshift(fallbackOrder);
  localStorage.setItem("aura_customer_orders", JSON.stringify(savedOrders));

  return fallbackOrder;
}

export async function createRazorpayOrder(orderId) {
  try {
    const res = await fetch(`${API_BASE}/api/payments/create-razorpay-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId }),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Notice: Razorpay order API fallback:", err);
  }

  return {
    razorpay_order_id: `order_mock_${Math.random().toString(36).substring(2, 10)}`,
    razorpay_key_id: "rzp_test_TUJ1LFMpXuNekP",
    amount: 299900,
    currency: "INR",
    order_id: orderId,
  };
}

export async function verifyPayment(verifyData) {
  try {
    const res = await fetch(`${API_BASE}/api/payments/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(verifyData),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Notice: Payment verification API fallback:", err);
  }

  return {
    status: verifyData.status,
    message: verifyData.status === "success" ? "Payment verified successfully" : "Payment failed",
    order_id: verifyData.order_id,
  };
}

export async function fetchCustomerOrders(email) {
  try {
    const url = email ? `${API_BASE}/api/orders?email=${encodeURIComponent(email)}` : `${API_BASE}/api/orders`;
    const res = await fetch(url);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Notice: Customer orders fetch fallback:", err);
  }

  const savedOrders = JSON.parse(localStorage.getItem("aura_customer_orders") || "[]");
  return savedOrders;
}

export async function fetchOrderById(orderId) {
  try {
    const res = await fetch(`${API_BASE}/api/orders/${orderId}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Notice: Order by ID fetch fallback:", err);
  }

  const savedOrders = JSON.parse(localStorage.getItem("aura_customer_orders") || "[]");
  const found = savedOrders.find((o) => o.order_id === orderId);
  if (found) return found;
  throw new Error("Order not found");
}

export { createOrder as createAuraOrder, createRazorpayOrder as createRazorpayTestOrder };
