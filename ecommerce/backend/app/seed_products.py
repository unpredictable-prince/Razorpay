import os
import sys

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from .database import SessionLocal, init_ecommerce_db
from .models import Product

SEED_PRODUCTS = [
    {
        "name": "Aura Wireless Noise-Canceling Headphones",
        "description": "Premium over-ear wireless headphones featuring active noise cancellation, 30-hour battery life, and crystal-clear acoustic drivers.",
        "price": 499900,  # ₹4,999
        "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
        "category": "Audio",
        "stock": 45,
    },
    {
        "name": "Pulse Ultra Smartwatch Series 7",
        "description": "Advanced fitness smartwatch with AMOLED display, continuous heart rate monitor, SPO2 sensor, and IP68 water resistance.",
        "price": 899900,  # ₹8,999
        "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
        "category": "Wearables",
        "stock": 30,
    },
    {
        "name": "ErgoLift Ergonomic Wireless Mouse",
        "description": "Precision vertical ergonomic mouse engineered to reduce wrist strain with custom programmable buttons and dual Bluetooth connection.",
        "price": 149900,  # ₹1,499
        "image": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80",
        "category": "Accessories",
        "stock": 60,
    },
    {
        "name": "Nomad Commuter Waterproof Backpack",
        "description": "Sleek 25L weather-resistant travel backpack with padded 16-inch laptop compartment and integrated USB charging port.",
        "price": 329900,  # ₹3,299
        "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
        "category": "Lifestyle",
        "stock": 25,
    },
    {
        "name": "VoltBoost 3-in-1 Fast Wireless Charger",
        "description": "Foldable magnetic wireless charging station for smartphone, smartwatch, and wireless earbuds simultaneously.",
        "price": 219900,  # ₹2,199
        "image": "https://images.unsplash.com/photo-1622445268465-843816584283?w=800&q=80",
        "category": "Power",
        "stock": 50,
    },
    {
        "name": "Lumina RGB Mechanical Keyboard",
        "description": "Tactile hot-swappable mechanical keyboard with customizable RGB backlighting, aluminum frame, and PBT keycaps.",
        "price": 549900,  # ₹5,499
        "image": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80",
        "category": "Gaming",
        "stock": 20,
    },
    {
        "name": "SoundBar Pro Studio Speaker",
        "description": "Compact desktop SoundBar delivering deep bass, room-filling sound, and seamless AUX / Bluetooth 5.3 connectivity.",
        "price": 679900,  # ₹6,799
        "image": "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80",
        "category": "Audio",
        "stock": 15,
    },
    {
        "name": "VisionHD 4K USB-C Webcam",
        "description": "Ultra-HD 4K streaming webcam with auto-focus, dual noise-canceling microphones, and privacy shutter.",
        "price": 399900,  # ₹3,999
        "image": "https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?w=800&q=80",
        "category": "Tech",
        "stock": 35,
    },
    {
        "name": "ThermoSmart Insulated Smart Bottle",
        "description": "Double-wall vacuum insulated stainless steel water bottle featuring real-time LED temperature display.",
        "price": 129900,  # ₹1,299
        "image": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80",
        "category": "Lifestyle",
        "stock": 40,
    },
    {
        "name": "Apex Precision Gaming Desk Pad",
        "description": "Extra-large desk mat (900x400mm) with stitched edges, anti-slip rubber base, and micro-textured cloth surface.",
        "price": 79900,   # ₹799
        "image": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
        "category": "Accessories",
        "stock": 80,
    },
]


def seed_products():
    init_ecommerce_db()
    db = SessionLocal()
    try:
        if db.query(Product).count() == 0:
            for item in SEED_PRODUCTS:
                p = Product(**item)
                db.add(p)
            db.commit()
            print(f"Seeded {len(SEED_PRODUCTS)} products into ecommerce database!")
        else:
            print("Ecommerce database already contains products. Skipping seed.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_products()
