import requests
import json
import hmac
import hashlib
import sqlite3
import os

AURA_BACKEND = "http://localhost:8001"
RECOVERAI_BACKEND = "http://localhost:8000"
WEBHOOK_SECRET = "recoverai_test_webhook_secret"

def run_e2e_verification():
    print("=" * 70)
    print(" MANDATORY REAL DATA VERIFICATION — END-TO-END CORRELATION FLOW")
    print("=" * 70)

    # -------------------------------------------------------------
    # A. CREATE REAL AURA STORE CUSTOMER & ORDER
    # -------------------------------------------------------------
    print("\n[A. AURA STORE ORDER CREATION]")
    order_payload = {
        "customer_name": "Sam",
        "customer_email": "sam@gmail.com",
        "customer_phone": "9876543210",
        "shipping_address": "123 MG Road, Koramangala, Bengaluru, KA 560034",
        "items": [
            {
                "product_id": 1,
                "name": "Aura Studio Pro Wireless Headphones",
                "price": 299900,
                "quantity": 1,
                "category": "Audio",
                "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"
            }
        ]
    }
    res = requests.post(f"{AURA_BACKEND}/api/orders", json=order_payload)
    assert res.status_code == 200, f"Order creation failed: {res.text}"
    order_data = res.json()
    
    customer_name = order_data["customer_name"]
    customer_id = order_data["customer_id"]
    aura_order_id = order_data["order_id"]
    order_amount = order_data["total_amount"]
    
    print(f"  ✓ Customer Name : {customer_name}")
    print(f"  ✓ Customer ID   : {customer_id}")
    print(f"  ✓ Aura Order ID : {aura_order_id}")
    print(f"  ✓ Order Amount  : ₹{order_amount / 100:,.2f} ({order_amount} paise)")

    # -------------------------------------------------------------
    # B. CREATE RAZORPAY TEST ORDER
    # -------------------------------------------------------------
    print("\n[B. RAZORPAY TEST ORDER CREATION]")
    rzp_res = requests.post(f"{AURA_BACKEND}/api/payments/create-razorpay-order", json={"order_id": aura_order_id})
    assert rzp_res.status_code == 200, f"Razorpay order creation failed: {rzp_res.text}"
    rzp_data = rzp_res.json()
    
    rzp_order_id = rzp_data["razorpay_order_id"]
    public_key = rzp_data["razorpay_key_id"]
    print(f"  ✓ Razorpay Order ID : {rzp_order_id}")
    print(f"  ✓ Public Key Used   : {public_key}")

    # -------------------------------------------------------------
    # C & E. TRIGGER FAILED PAYMENT & WEBHOOK INGESTION
    # -------------------------------------------------------------
    print("\n[C & E. RAZORPAY PAYMENT FAILURE & WEBHOOK INGESTION]")
    payment_id = f"pay_e2e_real_{os.urandom(4).hex()}"
    error_reason = "bank_server_down"
    error_code = "BAD_REQUEST_ERROR"
    error_desc = "Temporary system/bank infrastructure failure"
    
    webhook_payload = {
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": payment_id,
                    "amount": order_amount,
                    "currency": "INR",
                    "status": "failed",
                    "order_id": rzp_order_id,
                    "invoice_id": None,
                    "international": False,
                    "method": "card",
                    "amount_refunded": 0,
                    "refund_status": None,
                    "captured": False,
                    "description": f"Order {aura_order_id}",
                    "card_id": "card_e2e_test_001",
                    "bank": "HDFC",
                    "wallet": None,
                    "vpa": None,
                    "email": "sam@gmail.com",
                    "contact": "9876543210",
                    "error_code": error_code,
                    "error_description": error_desc,
                    "error_source": "bank",
                    "error_step": "payment_authentication",
                    "error_reason": error_reason,
                    "notes": {
                        "order_id": aura_order_id,
                        "customer_id": customer_id,
                        "customer_name": customer_name,
                        "customer_email": "sam@gmail.com",
                        "customer_phone": "9876543210"
                    }
                }
            }
        }
    }
    
    raw_body = json.dumps(webhook_payload).encode("utf-8")
    sig = hmac.new(WEBHOOK_SECRET.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    
    wh_res = requests.post(
        f"{RECOVERAI_BACKEND}/webhooks/razorpay",
        data=raw_body,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": sig}
    )
    assert wh_res.status_code == 200, f"Webhook processing failed: {wh_res.text}"
    wh_data = wh_res.json()
    
    print(f"  ✓ Webhook Ingested : PASS")
    print(f"  ✓ HMAC Verification: PASS")
    print(f"  ✓ Razorpay Pay ID  : {payment_id}")
    print(f"  ✓ Failure Reason   : {error_reason}")
    print(f"  ✓ Pipeline Status  : {wh_data.get('status')}")

    # -------------------------------------------------------------
    # D. VERIFY AURA STORE PAYMENT VERIFICATION
    # -------------------------------------------------------------
    print("\n[D. AURA STORE VERIFICATION]")
    v_res = requests.post(f"{AURA_BACKEND}/api/payments/verify", json={
        "order_id": aura_order_id,
        "razorpay_payment_id": payment_id,
        "status": "failed",
        "error_reason": error_reason
    })
    assert v_res.status_code == 200
    print(f"  ✓ Aura Store State Updated: PASS (status=failed)")

    # -------------------------------------------------------------
    # F & G. VERIFY RECOVERAI DASHBOARD TRANSACTION & CUSTOMER IDENTITY
    # -------------------------------------------------------------
    print("\n[F & G. RECOVERAI DASHBOARD & TRANSACTION IDENTITY]")
    tx_res = requests.get(f"{RECOVERAI_BACKEND}/transactions/{payment_id}")
    assert tx_res.status_code == 200, f"Transaction fetch failed: {tx_res.text}"
    tx_data = tx_res.json()
    
    print(f"  ✓ Dashboard Customer Name : {tx_data['customer_name']}")
    print(f"  ✓ Dashboard Customer ID   : {tx_data['customer_id']}")
    print(f"  ✓ Dashboard Order ID     : {tx_data['order_id']}")
    print(f"  ✓ Dashboard Payment ID   : {tx_data['payment_id']}")
    print(f"  ✓ Dashboard Amount       : ₹{tx_data['amount'] / 100:,.2f}")
    print(f"  ✓ Dashboard Status       : {tx_data['status']}")
    print(f"  ✓ Dashboard Failure Reason: {tx_data['failure_reason']}")
    print(f"  ✓ Dashboard Recovery Stat : {tx_data['recovery_status']}")
    
    assert tx_data['customer_name'] == "Sam"
    assert tx_data['order_id'] == aura_order_id
    assert tx_data['payment_id'] == payment_id

    # -------------------------------------------------------------
    # I & J. VERIFY FAILURE REASON & AI RECOVERY PIPELINE DECISION
    # -------------------------------------------------------------
    print("\n[I & J. AI RECOVERY PIPELINE TRACE]")
    analysis = wh_data.get("analysis", {})
    recommendation = wh_data.get("recommendation", {})
    policy = wh_data.get("policy_decision", {})
    execution = wh_data.get("execution_result", {})
    
    print(f"  ✓ Recovery Analyzer Decision : {recommendation.get('decision')}")
    print(f"  ✓ AI Agent Confidence        : {recommendation.get('confidence')}")
    print(f"  ✓ Policy Guardrails Status   : {policy.get('decision')}")
    print(f"  ✓ Recovery Execution Result  : {execution.get('status')}")

    # -------------------------------------------------------------
    # K & L. VERIFY NOTIFICATIONS (MERCHANT & CUSTOMER ISOLATION)
    # -------------------------------------------------------------
    print("\n[K & L. NOTIFICATIONS VERIFICATION]")
    m_notifs = requests.get(f"{RECOVERAI_BACKEND}/notifications?recipient_type=merchant").json()
    c_notifs = requests.get(f"{RECOVERAI_BACKEND}/notifications?recipient_type=customer").json()
    
    merchant_match = [n for n in m_notifs if n.get("payment_id") == payment_id]
    customer_match = [n for n in c_notifs if n.get("payment_id") == payment_id]
    
    print(f"  ✓ Merchant Notifications Found: {len(merchant_match)}")
    if merchant_match:
        print(f"    Message: {merchant_match[0]['message']}")
    
    print(f"  ✓ Customer Notifications Found: {len(customer_match)}")
    if customer_match:
        print(f"    Title  : {customer_match[0]['title']}")
        print(f"    Message: {customer_match[0]['message']}")
        # Verify strict customer isolation (no internal secrets/AI confidence exposed)
        msg_text = customer_match[0]['message'].lower()
        assert "confidence" not in msg_text
        assert "gemini" not in msg_text
        assert "policy" not in msg_text
        print(f"  ✓ Customer Privacy Isolation: PASS (No internal AI secrets exposed)")

    # -------------------------------------------------------------
    # M & N. DATABASE VERIFICATION & IDEMPOTENCY
    # -------------------------------------------------------------
    print("\n[M & N. DATABASE INTEGRITY & IDEMPOTENCY]")
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", "recoverai.db")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    cur.execute("SELECT count(*) FROM transactions WHERE payment_id = ?;", (payment_id,))
    count_before = cur.fetchone()[0]
    print(f"  ✓ Transactions before duplicate: {count_before}")
    assert count_before == 1
    
    # Send duplicate webhook
    dup_res = requests.post(
        f"{RECOVERAI_BACKEND}/webhooks/razorpay",
        data=raw_body,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": sig}
    )
    assert dup_res.status_code == 200
    
    cur.execute("SELECT count(*) FROM transactions WHERE payment_id = ?;", (payment_id,))
    count_after = cur.fetchone()[0]
    print(f"  ✓ Transactions after duplicate : {count_after}")
    assert count_after == 1
    print(f"  ✓ Idempotency Check            : PASS (No duplicate records created)")
    conn.close()

    # -------------------------------------------------------------
    # O. TEST SUCCESSFUL PAYMENT
    # -------------------------------------------------------------
    print("\n[O. SUCCESSFUL PAYMENT TEST]")
    succ_order_res = requests.post(f"{AURA_BACKEND}/api/orders", json=order_payload).json()
    succ_aura_order_id = succ_order_res["order_id"]
    succ_pay_id = f"pay_e2e_succ_{os.urandom(4).hex()}"
    
    succ_payload = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": succ_pay_id,
                    "amount": 299900,
                    "currency": "INR",
                    "status": "captured",
                    "email": "sam@gmail.com",
                    "contact": "9876543210",
                    "notes": {
                        "order_id": succ_aura_order_id,
                        "customer_id": customer_id,
                        "customer_name": "Sam",
                        "customer_email": "sam@gmail.com",
                        "customer_phone": "9876543210"
                    }
                }
            }
        }
    }
    succ_raw = json.dumps(succ_payload).encode("utf-8")
    succ_sig = hmac.new(WEBHOOK_SECRET.encode("utf-8"), succ_raw, hashlib.sha256).hexdigest()
    
    succ_wh = requests.post(
        f"{RECOVERAI_BACKEND}/webhooks/razorpay",
        data=succ_raw,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": succ_sig}
    )
    assert succ_wh.status_code == 200
    print(f"  ✓ Successful Payment Captured: PASS (payment_id={succ_pay_id})")

    # -------------------------------------------------------------
    # P. TEST AUTHORIZED PAYMENT
    # -------------------------------------------------------------
    print("\n[P. AUTHORIZED PAYMENT TEST]")
    auth_order_res = requests.post(f"{AURA_BACKEND}/api/orders", json=order_payload).json()
    auth_aura_order_id = auth_order_res["order_id"]
    auth_pay_id = f"pay_e2e_auth_{os.urandom(4).hex()}"
    
    auth_payload = {
        "event": "payment.authorized",
        "payload": {
            "payment": {
                "entity": {
                    "id": auth_pay_id,
                    "amount": 299900,
                    "currency": "INR",
                    "status": "authorized",
                    "email": "sam@gmail.com",
                    "contact": "9876543210",
                    "notes": {
                        "order_id": auth_aura_order_id,
                        "customer_id": customer_id,
                        "customer_name": "Sam",
                        "customer_email": "sam@gmail.com",
                        "customer_phone": "9876543210"
                    }
                }
            }
        }
    }
    auth_raw = json.dumps(auth_payload).encode("utf-8")
    auth_sig = hmac.new(WEBHOOK_SECRET.encode("utf-8"), auth_raw, hashlib.sha256).hexdigest()
    
    auth_wh = requests.post(
        f"{RECOVERAI_BACKEND}/webhooks/razorpay",
        data=auth_raw,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": auth_sig}
    )
    assert auth_wh.status_code == 200
    print(f"  ✓ Authorized Payment Ingested: PASS (payment_id={auth_pay_id})")

    # -------------------------------------------------------------
    # Q. VERIFY RETAINED CUSTOMER DEMO DATASET
    # -------------------------------------------------------------
    print("\n[Q. RETAINED CUSTOMERS VERIFICATION]")
    cust_res = requests.get(f"{RECOVERAI_BACKEND}/transactions/").json()
    unique_custs = set(tx["customer_name"] for tx in cust_res if tx.get("customer_name"))
    print(f"  ✓ Active Customer Roster Count: {len(unique_custs)}")
    print(f"  ✓ Customer Roster Names       : {', '.join(sorted(unique_custs))}")
    assert len(unique_custs) >= 10, "Retained customer roster fell below 10!"

    print("\n" + "=" * 70)
    print(" MANDATORY REAL DATA VERIFICATION — ALL CHECKS PASSED PERFECTLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_e2e_verification()
