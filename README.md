# RecoverAI — Autonomous Razorpay Revenue Recovery System

**RecoverAI** is an AI-powered, policy-guarded revenue recovery system designed specifically for **Razorpay merchants**. When payment failures occur during online customer checkouts, RecoverAI ingests webhooks, validates request signatures via HMAC-SHA256, analyzes failure root causes, evaluates AI recovery strategies against strict deterministic policy guardrails, executes automated retries/re-engagements, and alerts merchants in real-time.

---

## Key Features

1. **Autonomous Webhook Ingestion**: Receives `payment.failed`, `payment.captured`, and `payment.authorized` events via Razorpay Webhooks.
2. **HMAC-SHA256 Security Verification**: Cryptographically validates every incoming webhook payload using `RAZORPAY_WEBHOOK_SECRET` to prevent tampering and unauthorized injection.
3. **Hybrid AI & Diagnostic Analyzer**: Combines deterministic error categorization (`bank_server_down`, `card_expired`, `insufficient_funds`, `customer_cancelled`) with LLM-assisted strategy recommendation.
4. **Deterministic Guardrail Policy Engine**: Enforces strict financial limits (e.g. max ₹10,000 auto-recovery), retry caps (max 3 retries), customer cancellation blocks, and security risk rules.
5. **Recovery Service Execution**: Simulates and executes authorized recovery actions (payment retries, payment method updates, subscription mandate recoveries).
6. **Multi-Channel Notification System**: Automatically dispatches operational alerts to the **Merchant Dashboard** and clean, safe status messages to the **Aura Store Customer UI**.
7. **Real-time Merchant Dashboard**: Provides live metrics (failed revenue, recovered revenue, recovery rate), visual AI pipeline traces, transaction ledger search/filter, slide-over notification drawer, and notification center.
8. **Live Recovery Stream & Pipeline Visualizer**: Interactive 10-stage sequential execution trace (*Customer ➔ Aura Store ➔ Razorpay ➔ Webhook ➔ RecoverAI ➔ Analyzer ➔ AI Agent ➔ Policy Engine ➔ Recovery Service ➔ Database ➔ Notifications*).
9. **Interactive Demo Controller & Safe Reset**: One-click **"Run Recovery Demo"** button and scenario triggers (*Bank Failure*, *Card Expired*, *Auth Failure*, *Cancelled*) with safe merchant reset.
10. **"Why Did This Payment Fail?" Explanation Panel**: Human-readable failure diagnosis panel translating technical error codes into plain language explanations and policy justifications.
11. **Customer Payment Journey Inspector**: Interactive customer profile modal showing order history, payment attempts, failed failures, recovered revenue, and chronological event timeline.
12. **Realistic E-Commerce Demo Application (Aura Store)**: Includes a full customer-facing store (`ecommerce/`) for placing real Razorpay Test Mode orders (`rzp_test_...`).

---

## High-Level System Architecture

```
Customer (Aura Store Frontend :5174)
   │
   ▼
[1] Order & Razorpay Test Checkout (POST /api/payments/create-razorpay-order)
   │
   ▼
[2] Razorpay Webhook Event (POST /webhooks/razorpay :8000)
   │
   ▼
[3] HMAC-SHA256 Signature Verification
   │
   ▼
[4] Recovery Analyzer (Error Diagnostics & Potential Recovery Flag)
   │
   ▼
[5] AI Recovery Agent (Contextual Evaluation & Strategy Recommendation)
   │
   ▼
[6] Deterministic Policy Engine (Business Rules & Guardrail Checks)
   │ ──► [Approved] ────► Recovery Service Execution ──► Database
   │ ──► [Human Review] ──► Routed to Merchant Review Queue
   │ ──► [Blocked] ────► Halted (No Unsafe Actions)
   │
   ▼
[7] Notification System (Merchant Alerts + Customer Safe Status)
   │
   ▼
[8] RecoverAI Merchant Dashboard (:5173)
```

---

## Project Directory Structure

```
.
├── backend/                  # RecoverAI FastAPI Backend (Port 8000)
│   ├── app/
│   │   ├── main.py           # FastAPI application entry point
│   │   ├── database.py       # SQLAlchemy SQLite connection & session
│   │   ├── models.py         # Transaction & Notification models
│   │   ├── schemas.py        # Pydantic schemas
│   │   └── routes/           # Transactions, Webhooks, Notifications routers
│   ├── database/             # SQLite seed script
│   └── recoverai.db          # RecoverAI SQLite database
├── agent/                    # AI & Policy Engine Pipeline
│   ├── recovery_agent.py     # AI Recovery Agent module
│   ├── policy_engine.py      # Deterministic Policy Engine guardrails
│   ├── llm_service.py        # Optional Gemini LLM integration
│   └── tools/                # Agent diagnostic tools
├── frontend/                 # RecoverAI Merchant Dashboard (React + Vite, Port 5173)
│   ├── src/
│   │   ├── components/       # Metrics, Ledger, AI Pipeline Modal, Notifications
│   │   └── App.jsx           # Main Dashboard Container
├── ecommerce/                # Aura Store E-Commerce Application
│   ├── backend/              # Aura Store FastAPI Backend (Port 8001, ecommerce.db)
│   └── frontend/             # Aura Store Customer Frontend (React + Vite, Port 5174)
├── tests/                    # Complete Automated Test Suite (75+ tests)
├── docs/                     # Technical Architecture & Demo Documentation
├── .env.example              # Environment variables template
├── README.md                 # Project Overview & Quick Start Guide
└── requirements.txt          # Python dependencies
```

---

## Quick Start Setup & Startup Commands

### 1. Environment Configuration

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

*Note: For testing, default test mode secrets are pre-configured in the test runner.*

### 2. Service Ports Overview

| Component | Technology | Port | Command |
| :--- | :--- | :--- | :--- |
| **RecoverAI Backend** | FastAPI / Uvicorn | `8000` | `cd backend && .venv/bin/uvicorn app.main:app --port 8000` |
| **Merchant Dashboard** | React / Vite | `5173` | `cd frontend && npm run dev` |
| **Aura Store Backend** | FastAPI / Uvicorn | `8001` | `cd ecommerce/backend && ../../backend/.venv/bin/uvicorn app.main:app --port 8001` |
| **Aura Store Frontend** | React / Vite | `5174` | `cd ecommerce/frontend && npm run dev` |

---

## Running Automated Tests

Run the complete test suite (75+ pytest tests covering webhooks, security, policy engine, AI agent, database persistence, notifications, and integration flows):

```bash
# Run Pytest suite
backend/.venv/bin/pytest

# Run Phase 11 Final Integration Master Test
backend/.venv/bin/python tests/verify_phase11_final_integration.py
```

---

## Production Build Verification

Verify that both frontend bundles compile with zero build errors:

```bash
# Build Merchant Dashboard
cd frontend && npm run build

# Build Aura Store Customer Website
cd ecommerce/frontend && npm run build
```

---

## Security & Safety Guardrails

1. **Cryptographic Webhook Security**: Every incoming webhook is authenticated via HMAC-SHA256 using `RAZORPAY_WEBHOOK_SECRET`. Invalid or missing signatures trigger immediate HTTP 400 rejection.
2. **Deterministic Policy Guardrail**: The AI Agent only *recommends* actions. The **Policy Engine** has absolute veto authority and enforces hard rules:
   * **Max Amount Threshold**: Transactions over ₹10,000 require manual human review.
   * **Max Retry Cap**: Maximum 3 retries allowed per transaction.
   * **Customer Cancellation**: Explicitly cancelled payments are blocked from automated retries.
3. **Customer Privacy Isolation**: Customer notifications strictly conceal internal AI confidence scores, policy rules, webhook secrets, and merchant analytics.

---

## License & Credits

Built for the **Razorpay Internship Project**. Powered by FastAPI, React, SQLite, SQLAlchemy, Vite, and Razorpay Test Mode APIs.
