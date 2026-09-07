# RecoverAI — 3–5 Minute Presentation & Live Demo Guide

This document provides a step-by-step presentation script and live demonstration guide for evaluating **RecoverAI**.

---

## Demo Summary & Narrative

1. **Problem Statement (30 seconds)**:
   * "In e-commerce, up to 15% of payment attempts fail due to temporary bank outages, card issues, or network hiccups. Merchants lose revenue and customers leave frustrated."

2. **The RecoverAI Solution (30 seconds)**:
   * "RecoverAI is an autonomous revenue recovery engine for Razorpay merchants. It ingests failed payment webhooks, verifies HMAC signatures, uses AI to analyze failure causes, and executes authorized recoveries — protected by a deterministic Business Guardrail Policy Engine."

3. **Live End-to-End Workflow (3 minutes)**:

---

## Step-by-Step Live Demo Flow

### Step 1: Open Customer Store (Aura Store)
* **URL**: `http://localhost:5174`
* **Action**: Browse tech products (e.g. *Aura Wireless Headphones* ₹2,999).
* **Action**: Click "Add to Cart", open Cart drawer, and click "Proceed to Checkout".

### Step 2: Customer Checkout & Razorpay Test Payment
* **Action**: Enter customer details (*Rahul Sharma*, `rahul.sharma@example.com`, `+919876543210`).
* **Action**: Click "Proceed to Razorpay Payment".
* **Observation**: Razorpay Checkout modal appears with `RAZORPAY_KEY_ID` in Test Mode (`rzp_test_...`).
* **Action**: Select payment failure scenario (e.g., test failure or simulate payment event).

### Step 3: Webhook Delivery & HMAC Signature Verification
* **Behind the scenes**: Razorpay delivers a signed `payment.failed` webhook event to RecoverAI (`http://localhost:8000/webhooks/razorpay`).
* **Observation**: RecoverAI backend validates `X-Razorpay-Signature` via HMAC-SHA256. Invalid signatures are blocked with `HTTP 400`.

### Step 4: AI Analyzer & Policy Engine Execution
* **Analyzer**: Diagnostic rules identify error category (`bank_server_down`) and mark `potentially_recoverable: True`.
* **AI Agent**: Recommends `retry_payment` strategy.
* **Policy Engine**: Evaluates financial threshold (amount < ₹10,000 limit) and retry count (< 3 retries). Approves automated recovery (`decision: "approved"`).

### Step 5: Recovery Execution & Database Persistence
* **Recovery Service**: Executes retry action, updates transaction status to `captured` in `recoverai.db`, and marks `recovery_status: "executed"`.

### Step 6: Real-Time Merchant Dashboard & Notifications
* **URL**: `http://localhost:5173`
* **Observation**:
  1. The **RecoverAI Merchant Dashboard** updates metrics (Recovered Revenue, Recovery Rate).
  2. The **Notification Bell** flashes a red unread count badge.
  3. Clicking the Bell opens the **Notification Drawer** showing:
     * *"Automatic Recovery Executed — Payment 'pay_...' failed (bank_server_down). Automated recovery executed successfully."*
  4. Clicking the notification opens the **Transaction Inspection Modal** with full visual AI pipeline trace.

### Step 7: Customer Safe Status Notification
* **URL**: `http://localhost:5174`
* **Observation**: Customer Aura Store notification bell shows a clean, friendly message:
  * *"Your payment could not be completed because of a temporary issue. Please try again."*
  * **Privacy Guarantee**: Customer UI hides internal AI confidence, policy engine guardrails, and merchant metrics.

### Step 8: Demo Mode Controller & Live Recovery Pipeline Inspection
* **URL**: `http://localhost:5173`
* **Action**: Click **"Run Demo (Bank Failure)"** on the Demo Controller toolbar.
* **Observation**:
  1. The **Live Recovery Stream** tab shows the 10-stage visual sequential pipeline highlight (*Customer ➔ Aura Store ➔ Razorpay ➔ Webhook ➔ RecoverAI ➔ Analyzer ➔ AI Agent ➔ Policy Engine ➔ Recovery Service ➔ Database ➔ Notifications*).
  2. Opening the **Transaction Inspection Modal** displays the **"Why Did This Payment Fail?"** panel with human-readable error explanation and policy justification.
  3. Clicking the customer ID opens the **Customer Payment Journey Inspector** showing Sam's full order history, failed attempts, and timeline.
  4. Clicking **"Reset Demo"** safely removes test records without corrupting DB schemas or source code.

---

## Local Verification Commands

To verify all scenarios automatically during evaluation:

```bash
# 1. Run All Automated Pytest Tests (79 tests)
backend/.venv/bin/pytest

# 2. Run Phase 13 Master Verification
backend/.venv/bin/python tests/verify_phase13_e2e.py
```
