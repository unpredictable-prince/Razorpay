import datetime
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
    with open(env_file, "r", encoding="utf-8-sig") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                key = k.strip()
                val = v.strip().strip("'\"")
                if val:
                    os.environ[key] = val

from app.services.razorpay_service import RazorpayService


def run_manual_payment_lookup(payment_id: str):
    """
    Safely fetches payment details from Razorpay Test Mode and displays a safe summary.
    Excludes credentials, secrets, card numbers, CVV, and customer PII.
    """
    print("=" * 60)
    print("=== RAZORPAY TEST PAYMENT VERIFICATION ===")
    print("=" * 60)
    print(f"Target Payment ID: {payment_id}\n")

    key_id = os.environ.get("RAZORPAY_KEY_ID")
    key_secret = os.environ.get("RAZORPAY_KEY_SECRET")

    print("[Step 1] Checking Environment Credentials...")
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

    print(f"✓ Found RAZORPAY_KEY_ID: {key_id[:10]}... ({len(key_id)} chars)")
    print(f"✓ Found RAZORPAY_KEY_SECRET: [PROTECTED - {len(key_secret)} chars]")

    print("\n[Step 2] Initializing Razorpay Service & SDK Client...")
    try:
        service = RazorpayService(key_id=key_id, key_secret=key_secret)
        config = service.validate_configuration()
        print(f"✓ Configuration Validated (Mode: {config['mode'].upper()}, Key ID: {config['key_id']})")
    except Exception as err:
        print(f"❌ Configuration Error: {err}")
        print("\nPlease check your .env file or environment variables for RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.")
        return

    result = service.get_payment(payment_id)

    if not result.get("found", True) or "error" in result:
        print("\n❌ PAYMENT LOOKUP FAILED:")
        print(f"   {result.get('error', 'Payment not found.')}\n")
        print("Possible Causes:")
        print("- Payment ID does not exist in your Razorpay Test Mode account.")
        print("- Payment ID belongs to a different environment or Razorpay account.")
        return

    # Format timestamp safely
    created_at_str = "N/A"
    raw_created = result.get("created_at")
    if raw_created:
        try:
            created_at_str = datetime.datetime.fromtimestamp(raw_created, datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
        except Exception:
            created_at_str = str(raw_created)

    amount_paise = result.get("amount", 0)
    amount_inr = amount_paise / 100.0

    print("\n" + "=" * 60)
    print("=== SAFE PAYMENT SUMMARY (NO SECRETS / PII) ===")
    print("=" * 60)
    print(f"Payment ID       : {result.get('payment_id')}")
    print(f"Status           : {result.get('status')}")
    print(f"Amount           : ₹{amount_inr:,.2f} ({amount_paise} paise)")
    print(f"Currency         : {result.get('currency', 'INR')}")
    print(f"Captured         : {result.get('captured')}")
    print(f"Payment Method   : {result.get('method') or 'N/A'}")
    print(f"Order ID         : {result.get('order_id') or 'N/A'}")
    print(f"Created At       : {created_at_str}")
    if result.get("error_reason") or result.get("error_code"):
        print(f"Error Code       : {result.get('error_code') or 'N/A'}")
        print(f"Error Reason     : {result.get('error_reason') or 'N/A'}")
        print(f"Error Description: {result.get('error_description') or 'N/A'}")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("\nUsage: backend/.venv/bin/python tests/manual_test_razorpay_payment.py <PAYMENT_ID>\n")
        print("Example: backend/.venv/bin/python tests/manual_test_razorpay_payment.py pay_test_1234567890\n")
        sys.exit(1)

    target_id = sys.argv[1].strip()
    run_manual_payment_lookup(target_id)
