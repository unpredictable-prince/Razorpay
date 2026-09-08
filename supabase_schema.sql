-- ==============================================================================
-- RecoverAI & Aura Store: Complete Supabase PostgreSQL Schema & Seed Migration
-- ==============================================================================

-- 1. Create Products Table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    image VARCHAR(500),
    category VARCHAR(100),
    stock INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(100) UNIQUE NOT NULL,
    customer_id VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    items JSONB NOT NULL,
    total_amount INTEGER NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    order_status VARCHAR(50) DEFAULT 'created',
    payment_status VARCHAR(50) DEFAULT 'pending',
    shipping_address TEXT,
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    payment_id VARCHAR(100) UNIQUE NOT NULL,
    order_id VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(50) NOT NULL,
    failure_code VARCHAR(100),
    failure_reason TEXT,
    action_taken TEXT,
    recovery_attempt_count INTEGER DEFAULT 0,
    requires_human_review BOOLEAN DEFAULT FALSE,
    customer_id VARCHAR(100),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    channel VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'sent',
    message_body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 5. Seed Catalog Products
-- ==============================================================================
INSERT INTO products (id, name, description, price, image, category, stock)
VALUES
    (1, 'Aura Wireless Noise-Canceling Headphones', 'Premium over-ear wireless headphones featuring active noise cancellation, 30-hour battery life, and crystal-clear acoustic drivers.', 499900, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', 'Audio', 45),
    (2, 'Pulse Ultra Smartwatch Series 7', 'Advanced fitness smartwatch with AMOLED display, continuous heart rate monitor, SPO2 sensor, and IP68 water resistance.', 899900, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', 'Wearables', 30),
    (3, 'ErgoLift Ergonomic Wireless Mouse', 'Precision vertical ergonomic mouse engineered to reduce wrist strain with custom programmable buttons and dual Bluetooth connection.', 149900, 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80', 'Accessories', 60),
    (4, 'Nomad Commuter Waterproof Backpack', 'Sleek 25L weather-resistant travel backpack with padded 16-inch laptop compartment and integrated USB charging port.', 329900, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80', 'Lifestyle', 25),
    (5, 'VoltBoost 3-in-1 Fast Wireless Charger', 'Foldable magnetic wireless charging station for smartphone, smartwatch, and wireless earbuds simultaneously.', 219900, 'https://images.unsplash.com/photo-1622445268465-843816584283?w=800&q=80', 'Power', 50),
    (6, 'Lumina RGB Mechanical Keyboard', 'Tactile hot-swappable mechanical keyboard with customizable RGB backlighting, aluminum frame, and PBT keycaps.', 549900, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80', 'Gaming', 20),
    (7, 'SoundBar Pro Studio Speaker', 'Compact desktop SoundBar delivering deep bass, room-filling sound, and seamless AUX / Bluetooth 5.3 connectivity.', 679900, 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80', 'Audio', 15),
    (8, 'VisionHD 4K USB-C Webcam', 'Ultra-HD 4K streaming webcam with auto-focus, dual noise-canceling microphones, and privacy shutter.', 399900, 'https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?w=800&q=80', 'Tech', 35),
    (9, 'ThermoSmart Insulated Smart Bottle', 'Double-wall vacuum insulated stainless steel water bottle featuring real-time LED temperature display.', 129900, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80', 'Lifestyle', 40),
    (10, 'Apex Precision Gaming Desk Pad', 'Extra-large desk mat (900x400mm) with stitched edges, anti-slip rubber base, and micro-textured cloth surface.', 79900, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80', 'Accessories', 80)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    image = EXCLUDED.image,
    category = EXCLUDED.category,
    stock = EXCLUDED.stock;

-- Reset serial sequence for products
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

-- ==============================================================================
-- 6. Seed Demo Transactions
-- ==============================================================================
INSERT INTO transactions (payment_id, order_id, amount, currency, status, failure_code, failure_reason, action_taken, recovery_attempt_count, requires_human_review, customer_id, customer_name, customer_email, customer_phone)
VALUES
    ('pay_demo_seed_001', 'order_demo_seed_001', 4999.00, 'INR', 'failed', 'BAD_REQUEST_ERROR', 'Bank gateway timeout during authentication', 'Autonomous retry scheduled + Smart recovery link dispatched via WhatsApp & Email', 1, FALSE, 'cust_rahul_01', 'Rahul Sharma', 'rahul.sharma@example.com', '+91 98765 43210'),
    ('pay_demo_seed_002', 'order_demo_seed_002', 8999.00, 'INR', 'recovered', 'GATEWAY_ERROR', 'Temporary issuing bank server downtime', 'Auto-switched routing to secondary bank gateway (HDFC Direct Rail). Payment captured.', 1, FALSE, 'cust_priya_02', 'Priya Patel', 'priya.patel@example.com', '+91 98123 45678'),
    ('pay_demo_seed_003', 'order_demo_seed_003', 2199.00, 'INR', 'captured', NULL, NULL, 'Payment captured successfully via UPI', 0, FALSE, 'cust_amit_03', 'Amit Verma', 'amit.v@example.com', '+91 99887 76655')
ON CONFLICT (payment_id) DO NOTHING;
