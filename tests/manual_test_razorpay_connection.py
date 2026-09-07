import os
import sys

# Ensure workspace root and backend directories are in sys.path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
backend_dir = os.path.join(root_dir, "backend")
for path in [root_dir, backend_dir]:
    if path not in sys.path:
        sys.path.insert(0, path)

# Auto-load .env file from workspace root if present
env_file = os.path.join(root_dir, ".env")
if os.path.exists(env_file):
    with open(env_file, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                key = k.strip()
                val = v.strip().strip("'\"")
                if val:
                    os.environ[key] = val

from app.services.razorpay_service import RazorpayService


def run_razorpay_connectivity_check():
    """
    Safe manual connectivity check for Razorpay Test Mode.
    Executes a read-only list request without creating payments or charging money.
    """
    print("=" * 60)
    print("=== RAZORPAY TEST MODE CONNECTIVITY CHECK ===")
    print("=" * 60)

    key_id = os.environ.get("RAZORPAY_KEY_ID")
    key_secret = os.environ.get("RAZORPAY_KEY_SECRET")

    # Step 1: Credentials Presence Verification
    print("\n[Step 1] Checking Environment Credentials...")
    if not key_id or not key_secret:
        print("❌ FAILED: Razorpay credentials are missing from environment variables.")
        print("\nHow to Configure Credentials:")
        print("1. Copy '.env.example' to '.env' in the workspace root:")
        print("   cp .env.example .env")
        print("2. Add your Razorpay Test Mode API keys to '.env':")
        print("   RAZORPAY_KEY_ID=rzp_test_your_key_id")
        print("   RAZORPAY_KEY_SECRET=your_test_key_secret")
        print("3. Re-run this test script.\n")
        return

    # Print Key ID prefix safely; NEVER print the secret key
    print(f"✓ Found RAZORPAY_KEY_ID: {key_id[:10]}... ({len(key_id)} chars)")
    print(f"✓ Found RAZORPAY_KEY_SECRET: [PROTECTED - {len(key_secret)} chars]")

    # Step 2: Initialize Razorpay Service & Client
    print("\n[Step 2] Initializing Razorpay Service & SDK Client...")
    try:
        service = RazorpayService()
        config = service.validate_configuration()
        print(f"✓ Configuration Validated: Mode = {config['mode'].upper()}, Key ID = {config['key_id']}")
        client = service.get_client()
        print("✓ Razorpay SDK Client Initialized Successfully.")
    except Exception as err:
        print(f"❌ FAILED to initialize Razorpay client: {err}")
        return

    # Step 3: Harmless Read-Only Test Request
    print("\n[Step 3] Executing Harmless Read-Only Test API Request...")
    try:
        # Read-only query: list latest 1 payment item
        response = client.payment.all({"count": 1})
        print("✓ Read-Only API Request Succeeded! Test Mode Authentication Verified.")
        print("\nSafe Response Summary:")
        entity = response.get("entity", "items_list")
        items = response.get("items", [])
        print(f"- Response Entity : {entity}")
        print(f"- Payments Count  : {len(items)}")
        print("=" * 60)
        print("RESULT: SUCCESS - Razorpay Test Mode connection is active & valid!")
        print("=" * 60 + "\n")
    except Exception as err:
        print(f"❌ FAILED API Authentication Request: {err}")
        print("\nPlease verify that your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are valid Test Mode keys.\n")


if __name__ == "__main__":
    run_razorpay_connectivity_check()
