import hmac
import hashlib
import json
import os
import sys
import requests

# Ensure backend directory is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Load environment variables
env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if os.path.exists(env_file):
    with open(env_file, "r", encoding="utf-8-sig") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ[k.strip()] = v.strip().strip("'\"")

SECRET = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "dummy_webhook_secret")
LOCAL_URL = "http://127.0.0.1:8000/webhooks/razorpay"
PUBLIC_URL = "https://alliance-rely-ability-folks.trycloudflare.com/webhooks/razorpay"


def compute_signature(payload_bytes: bytes, secret: str = SECRET) -> str:
    return hmac.new(secret.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()


def send_webhook(url: str, payload_dict: dict, custom_signature: str = None, headers: dict = None):
    raw_bytes = json.dumps(payload_dict).encode("utf-8")
    sig = custom_signature if custom_signature is not None else compute_signature(raw_bytes)
    
    req_headers = {"Content-Type": "application/json"}
    if sig != "OMIT":
        req_headers["X-Razorpay-Signature"] = sig
    if headers:
        req_headers.update(headers)
        
    res = requests.post(url, data=raw_bytes, headers=req_headers)
    return res


def make_payload(payment_prefix: str, event: str = "payment.failed", status: str = "failed", failure_reason: str = "bank_server_down", amount: int = 250000):
    import time
    ts = int(time.time() * 1000) % 1000000
    payment_id = f"{payment_prefix}_{ts}"
    return {
        "entity": "event",
        "account_id": "acc_PHASE8_001",
        "event": event,
        "contains": ["payment"],
        "payload": {
            "payment": {
                "entity": {
                    "id": payment_id,
                    "entity": "payment",
                    "amount": amount,
                    "currency": "INR",
                    "status": status,
                    "email": "customer_p8@example.com",
                    "contact": "+919876543210",
                    "notes": {"customer_id": "cust_p8_101"},
                    "error_code": "BAD_REQUEST_ERROR" if status == "failed" else None,
                    "error_description": failure_reason if status == "failed" else None,
                    "error_reason": failure_reason if status == "failed" else None,
                    "created_at": 1787774400
                }
            }
        },
        "created_at": 1787774400
    }



def run_phase8_verification():
    print("=" * 60)
    print("     PHASE 8 END-TO-END & SCENARIO VERIFICATION")
    print("=" * 60)
    
    results = {}
    
    # ----------------------------------------------------
    # Phase 8A: Complete End-to-End Test (Public HTTPS)
    # ----------------------------------------------------
    print("\n[8A] Testing End-to-End Flow over Public Cloudflare HTTPS Tunnel...")
    payload_e2e = make_payload("pay_P8_E2E_RUN_001", failure_reason="bank_server_down")
    
    try:
        res_e2e = send_webhook(PUBLIC_URL, payload_e2e)
        print(f"  Public HTTPS Response Code: {res_e2e.status_code}")
        body_e2e = res_e2e.json()
        print(f"  Pipeline Executed: {body_e2e.get('pipeline_executed')}")
        print(f"  AI Decision: {body_e2e.get('recommendation', {}).get('decision')}")
        print(f"  Policy Decision: {body_e2e.get('policy_decision', {}).get('decision')}")
        print(f"  Execution Status: {body_e2e.get('execution_result', {}).get('status')}")
        
        results["e2e_pipeline"] = res_e2e.status_code == 200 and body_e2e.get("pipeline_executed") is True
    except Exception as e:
        print(f"  Public HTTPS test failed: {e}")
        results["e2e_pipeline"] = False

    # ----------------------------------------------------
    # Phase 8B: Multiple Recovery Scenarios
    # ----------------------------------------------------
    print("\n[8B] Testing Multiple Recovery Scenarios...")
    
    # Scenario 1: Recoverable Temporary Failure (bank_server_down)
    print("  Scenario 1: Recoverable Temporary Failure (bank_server_down)...")
    payload_sc1 = make_payload("pay_P8_SC1_RECOVERABLE", failure_reason="bank_server_down")
    
    res_sc1 = send_webhook(LOCAL_URL, payload_sc1)
    b1 = res_sc1.json()
    sc1_pass = (
        b1.get("analysis", {}).get("potentially_recoverable") is True and
        b1.get("recommendation", {}).get("decision") == "attempt_recovery" and
        b1.get("policy_decision", {}).get("allowed") is True and
        b1.get("execution_result", {}).get("status") == "executed"
    )
    print(f"    Scenario 1 Result: {'PASS' if sc1_pass else 'FAIL'}")
    results["recoverable_failure"] = sc1_pass
    
    # Scenario 2: Non-Recoverable Failure (customer_cancelled)
    print("  Scenario 2: Non-Recoverable Failure (customer_cancelled)...")
    payload_sc2 = make_payload("pay_P8_SC2_NON_RECOVERABLE", failure_reason="customer_cancelled")
    
    res_sc2 = send_webhook(LOCAL_URL, payload_sc2)
    b2 = res_sc2.json()
    sc2_pass = (
        b2.get("analysis", {}).get("potentially_recoverable") is False and
        b2.get("policy_decision", {}).get("allowed") is False
    )
    print(f"    Scenario 2 Result: {'PASS' if sc2_pass else 'FAIL'} (Allowed={b2.get('policy_decision', {}).get('allowed')})")
    results["non_recoverable_failure"] = sc2_pass
    
    # Scenario 3: Human Review Required (authentication_failed)
    print("  Scenario 3: Human Review Required (authentication_failed)...")
    payload_sc3 = make_payload("pay_P8_SC3_HUMAN", failure_reason="authentication_failed")
    
    res_sc3 = send_webhook(LOCAL_URL, payload_sc3)
    b3 = res_sc3.json()
    sc3_pass = (
        b3.get("recommendation", {}).get("requires_human_review") is True or
        b3.get("recommendation", {}).get("decision") in ("escalate_to_human", "flag_human_review") or
        b3.get("analysis", {}).get("recommended_action") == "human_review"
    )
    print(f"    Scenario 3 Result: {'PASS' if sc3_pass else 'FAIL'} (HumanReview={b3.get('recommendation', {}).get('requires_human_review')})")
    results["human_review"] = sc3_pass

    # Scenario 4: Successful Payment (payment.captured)
    print("  Scenario 4: Successful Payment (payment.captured)...")
    payload_sc4 = make_payload("pay_P8_SC4_CAPTURED", event="payment.captured", status="captured", failure_reason=None, amount=49900)
    res_sc4 = send_webhook(LOCAL_URL, payload_sc4)
    b4 = res_sc4.json()
    sc4_pass = res_sc4.status_code == 200 and b4.get("event") == "payment.captured"
    print(f"    Scenario 4 Result: {'PASS' if sc4_pass else 'FAIL'}")
    results["payment_captured"] = sc4_pass

    # Scenario 5: Authorized Payment (payment.authorized)
    print("  Scenario 5: Authorized Payment (payment.authorized)...")
    payload_sc5 = make_payload("pay_P8_SC5_AUTH", event="payment.authorized", status="authorized", failure_reason=None, amount=49900)
    
    res_sc5 = send_webhook(LOCAL_URL, payload_sc5)
    b5 = res_sc5.json()
    sc5_pass = res_sc5.status_code == 200 and b5.get("event") == "payment.authorized"
    print(f"    Scenario 5 Result: {'PASS' if sc5_pass else 'FAIL'}")
    results["payment_authorized"] = sc5_pass

    # ----------------------------------------------------
    # Phase 8C: Idempotency Test
    # ----------------------------------------------------
    print("\n[8C] Testing Webhook Idempotency...")
    payload_idem = make_payload("pay_P8_IDEM_TEST_001", failure_reason="bank_server_down")
    
    res_id1 = send_webhook(LOCAL_URL, payload_idem)
    res_id2 = send_webhook(LOCAL_URL, payload_idem)
    
    b_id1 = res_id1.json()
    b_id2 = res_id2.json()
    
    idem_pass = (
        res_id1.status_code == 200 and
        res_id2.status_code == 200 and
        b_id1.get("status") == "accepted" and
        b_id2.get("status") == "accepted"
    )
    print(f"  First Request HTTP Status: {res_id1.status_code}")
    print(f"  Second Request HTTP Status: {res_id2.status_code} (Idempotent Response)")
    print(f"  Idempotency Result: {'PASS' if idem_pass else 'FAIL'}")
    results["idempotency"] = idem_pass

    # ----------------------------------------------------
    # Phase 8D: Signature Security Test
    # ----------------------------------------------------
    print("\n[8D] Testing Signature Security Enforcement...")
    payload_sec = make_payload("pay_P8_SEC_TEST_001")
    
    # 1. Valid Signature
    res_sig_valid = send_webhook(LOCAL_URL, payload_sec)
    valid_pass = res_sig_valid.status_code == 200
    print(f"  Valid Signature Status: {res_sig_valid.status_code} -> {'PASS' if valid_pass else 'FAIL'}")
    results["valid_signature"] = valid_pass
    
    # 2. Invalid Signature
    res_sig_invalid = send_webhook(LOCAL_URL, payload_sec, custom_signature="invalid_signature_hash_12345")
    invalid_pass = res_sig_invalid.status_code in (400, 401)
    print(f"  Invalid Signature Status: {res_sig_invalid.status_code} -> {'PASS' if invalid_pass else 'FAIL'}")
    results["invalid_signature"] = invalid_pass

    # 3. Missing Signature
    res_sig_missing = send_webhook(LOCAL_URL, payload_sec, custom_signature="OMIT")
    missing_pass = res_sig_missing.status_code in (400, 401)
    print(f"  Missing Signature Status: {res_sig_missing.status_code} -> {'PASS' if missing_pass else 'FAIL'}")
    results["missing_signature"] = missing_pass

    # 4. Modified Payload with Old Signature
    raw_orig = json.dumps(payload_sec).encode("utf-8")
    orig_sig = compute_signature(raw_orig)
    tampered_payload = make_payload("pay_P8_SEC_TEST_001", amount=99999900)
    
    res_sig_tampered = send_webhook(LOCAL_URL, tampered_payload, custom_signature=orig_sig)
    tampered_pass = res_sig_tampered.status_code in (400, 401)
    print(f"  Modified Payload Status: {res_sig_tampered.status_code} -> {'PASS' if tampered_pass else 'FAIL'}")
    results["modified_payload"] = tampered_pass

    print("\n" + "=" * 60)
    print("  VERIFICATION SUMMARY:")
    for k, v in results.items():
        print(f"    {k:<25}: {'PASS' if v else 'FAIL'}")
    print("=" * 60)
    
    return all(results.values())


if __name__ == "__main__":
    success = run_phase8_verification()
    sys.exit(0 if success else 1)
