# RecoverAI — Technical Architecture Specification

## 1. System Overview & Problem Statement

Merchant revenue loss due to failed payments is a critical problem in digital commerce. In India, e-commerce payment failures occur due to temporary bank downtimes, network timeouts, card expiry, insufficient funds, or customer cancellations.

Standard payment gateways mark these payments as `failed`, leaving merchants to manually follow up or lose revenue entirely.

**RecoverAI** provides an end-to-end, autonomous revenue recovery infrastructure for Razorpay merchants. It combines **real-time webhook ingestion**, **HMAC-SHA256 signature verification**, **rule-based & AI error diagnostics**, **deterministic business guardrails**, and **automated recovery execution** — wrapped in a real-time Merchant Dashboard and clean Customer Notification System.

---

## 2. Core Architectural Components

### 2.1 Webhook & Security Layer (`backend/app/routes/webhooks.py`)
- Receives Razorpay webhook events (`payment.failed`, `payment.captured`, `payment.authorized`).
- Computes HMAC-SHA256 digest of the raw HTTP body using `RAZORPAY_WEBHOOK_SECRET`.
- Compares computed digest against `X-Razorpay-Signature` header using `hmac.compare_digest`.
- Rejects unsigned, tampered, or invalid requests with `HTTP 400 Bad Request`.

### 2.2 Recovery Analyzer (`backend/app/services/recovery_analyzer.py`)
- Evaluates raw failure codes (`bank_server_down`, `card_expired`, `insufficient_funds`, `customer_cancelled`).
- Determines whether the failure is potentially recoverable (`potentially_recoverable: True/False`).
- Assigns a risk level (`low`, `medium`, `high`) and diagnostic reasoning.

### 2.3 AI Recovery Agent (`agent/recovery_agent.py` & `agent/llm_service.py`)
- Evaluates transaction state, customer history, failure reason, and retry count.
- Formulates a recovery strategy (`retry_payment`, `update_payment_method`, `customer_reengagement`, `subscription_recovery`, `human_review`).
- Uses Gemini API when configured, with a deterministic fallback engine when offline.

### 2.4 Deterministic Guardrail Policy Engine (`agent/policy_engine.py`)
- **CRITICAL DESIGN**: The AI Agent does NOT execute actions directly.
- The Policy Engine acts as the ultimate authority and enforces strict business rules:
  1. **Captured Payments**: Guardrail blocks any recovery attempt on already-captured payments (`decision: "blocked"`).
  2. **Financial Threshold**: Transactions > ₹10,000 (1,000,000 paise) require manual human review (`decision: "human_review"`).
  3. **Maximum Retry Cap**: Maximum 3 retries allowed (`decision: "human_review"`).
  4. **Customer Cancellation**: Explicit customer cancellations block automated retries (`decision: "human_review"`).
  5. **Card Expired**: Requires payment method update workflow rather than direct automated retries.

### 2.5 Recovery Service (`backend/app/services/recovery_service.py`)
- Executes authorized actions when `policy_decision.decision == "approved"`.
- Updates transaction status in SQLite (`status: "captured"` if recovered, `recovery_status: "executed"` / `"recovered"`).

### 2.6 Notification & Alert System (`backend/app/routes/notifications.py`)
- Auto-generates notifications upon webhook ingestion and recovery completion.
- **Merchant Notifications**: Full operational details (`payment_id`, `severity`, `title`, `message`, `is_read`).
- **Customer Notifications**: Clean, safe customer status ("Your payment could not be completed because of a temporary issue. Please try again.").

### 2.7 Demo Engine & Customer Journey Inspector (`backend/app/routes/demo.py`)
- **Demo Scenario Simulator** (`POST /demo/simulate`): Dispatches controlled test events (`bank_server_down`, `card_expired`, `authentication_failed`, `customer_cancelled`, `captured`, `authorized`) through the actual backend pipeline (Webhooks ➔ Analyzer ➔ AI Agent ➔ Policy Engine ➔ Recovery Service ➔ Database ➔ Notifications).
- **Safe Demo Reset** (`POST /demo/reset`): Clears demo test records safely without altering schemas, configurations, or source code.
- **Customer Journey API** (`GET /transactions/customer/{customer_id}`): Aggregates complete customer profile, total orders, failed attempts, recovered revenue, and chronological event timeline.

---

## 3. Database Schema Overview (`backend/recoverai.db`)

### 3.1 `transactions` Table
- `id` (INTEGER, Primary Key)
- `payment_id` (VARCHAR, Unique, Indexed)
- `customer_id` (VARCHAR, Indexed)
- `amount` (INTEGER, in paise)
- `currency` (VARCHAR, default "INR")
- `status` (VARCHAR: "failed", "captured", "authorized")
- `failure_reason` (VARCHAR, Nullable)
- `retry_count` (INTEGER, default 0)
- `recovery_status` (VARCHAR: "pending", "executed", "recovered", "human_review", "not_required")
- `created_at` (DATETIME)

### 3.2 `notifications` Table
- `id` (INTEGER, Primary Key)
- `recipient_type` (VARCHAR: "merchant" or "customer")
- `recipient_id` (VARCHAR, Nullable)
- `payment_id` (VARCHAR, Nullable)
- `order_id` (VARCHAR, Nullable)
- `notification_type` (VARCHAR: "payment_failed", "recovery_executed", "human_review_required", "payment_captured", "payment_authorized")
- `title` (VARCHAR)
- `message` (VARCHAR)
- `severity` (VARCHAR: "info", "success", "warning", "error")
- `is_read` (INTEGER: 0 or 1)
- `created_at` (DATETIME)

---

## 4. Security & Privacy Architecture

1. **Secret Isolation**: Secrets (`RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `GEMINI_API_KEY`) remain strictly on the backend server.
2. **Public Key Exposure**: Only public key ID (`RAZORPAY_KEY_ID`, `rzp_test_...`) is provided to frontend checkout.
3. **Customer Data Concealment**: Customers see only clean payment status without internal AI confidence, policy rules, or merchant analytics.
