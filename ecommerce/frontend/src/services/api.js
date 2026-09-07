const API_BASE = "http://localhost:8001";

export async function fetchConfig() {
  const res = await fetch(`${API_BASE}/api/config`);
  if (!res.ok) throw new Error("Failed to fetch public config");
  return res.json();
}

export async function fetchProducts(category = "") {
  const url = category ? `${API_BASE}/api/products?category=${encodeURIComponent(category)}` : `${API_BASE}/api/products`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export async function fetchProductById(id) {
  const res = await fetch(`${API_BASE}/api/products/${id}`);
  if (!res.ok) throw new Error("Failed to fetch product details");
  return res.json();
}

export async function createOrder(orderData) {
  const res = await fetch(`${API_BASE}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  });
  if (!res.ok) throw new Error("Failed to create order");
  return res.json();
}

export async function createRazorpayOrder(orderId) {
  const res = await fetch(`${API_BASE}/api/payments/create-razorpay-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order_id: orderId }),
  });
  if (!res.ok) throw new Error("Failed to create Razorpay Order");
  return res.json();
}

export async function verifyPayment(verifyData) {
  const res = await fetch(`${API_BASE}/api/payments/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(verifyData),
  });
  if (!res.ok) throw new Error("Failed to verify payment");
  return res.json();
}

export async function fetchCustomerOrders(email) {
  const url = email ? `${API_BASE}/api/orders?email=${encodeURIComponent(email)}` : `${API_BASE}/api/orders`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch customer orders");
  return res.json();
}

export async function fetchOrderById(orderId) {
  const res = await fetch(`${API_BASE}/api/orders/${orderId}`);
  if (!res.ok) throw new Error("Failed to fetch order details");
  return res.json();
}
