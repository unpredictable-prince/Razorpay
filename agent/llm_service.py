import json
import os
import urllib.request
from typing import Any, Dict, Optional


class BaseLLMProvider:
    """Abstract interface for LLM providers to ensure pluggable LLM backends."""

    def generate_recommendation(self, prompt: str) -> str:
        raise NotImplementedError("LLM providers must implement generate_recommendation.")


import ssl


import time


class GeminiLLMProvider(BaseLLMProvider):
    """
    Google Gemini API provider implementation.
    Reads API key exclusively from environment variables.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("LLM_API_KEY")

    def generate_recommendation(self, prompt: str) -> str:
        if not self.api_key:
            raise ValueError(
                "LLM API key not found. Please set GEMINI_API_KEY or LLM_API_KEY in environment variables."
            )

        models_to_try = ["models/gemini-flash-latest", "models/gemini-2.5-flash", "models/gemini-pro-latest"]
        last_err = None

        for model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/{model}:generateContent?key={self.api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
            }

            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )

            ssl_context = ssl.create_default_context()
            for attempt in range(2):
                try:
                    with urllib.request.urlopen(req, context=ssl_context) as response:
                        res_data = json.loads(response.read().decode("utf-8"))
                        return res_data["candidates"][0]["content"]["parts"][0]["text"]
                except Exception as err:
                    if "429" in str(err) or "Too Many Requests" in str(err):
                        time.sleep(4)
                        continue

                    if "CERTIFICATE_VERIFY_FAILED" in str(err):
                        unverified = ssl._create_unverified_context()
                        try:
                            with urllib.request.urlopen(req, context=unverified) as response:
                                res_data = json.loads(response.read().decode("utf-8"))
                                return res_data["candidates"][0]["content"]["parts"][0]["text"]
                        except Exception as err2:
                            last_err = err2
                    else:
                        last_err = err

        raise RuntimeError(f"Gemini API call failed: {last_err}")





class LLMService:
    """
    LLM Service layer. Formats prompts, calls the LLM provider,
    parses JSON responses, and validates structured output schemas.
    """

    def __init__(self, provider: Optional[BaseLLMProvider] = None):
        self.provider = provider or GeminiLLMProvider()

    def build_prompt(self, transaction: Dict[str, Any]) -> str:
        return f"""You are an AI Revenue Recovery System for Razorpay merchants.
Analyze the failed transaction below and return a valid JSON object matching the required schema.

Transaction Data:
- Payment ID: {transaction.get("payment_id")}
- Amount: {transaction.get("amount")} {transaction.get("currency", "INR")}
- Status: {transaction.get("status")}
- Failure Reason: {transaction.get("failure_reason")}
- Retry Count: {transaction.get("retry_count", 0)}

Required JSON Schema:
{{
  "decision": "recoverable" | "not_recoverable" | "human_review",
  "reason": "String explaining the recovery decision",
  "recommended_action": "Action string (e.g. retry_later, update_payment_method, customer_reengagement, human_review, subscription_recovery)",
  "confidence": 0.95,
  "requires_human_review": boolean
}}

Output raw JSON only. Do not include markdown code fence formatting or surrounding conversational text."""

    def analyze_transaction(self, transaction: Dict[str, Any]) -> Dict[str, Any]:
        """
        Formats transaction data, calls provider, and returns validated JSON output.
        """
        prompt = self.build_prompt(transaction)
        raw_output = self.provider.generate_recommendation(prompt)

        # Clean markdown code blocks if returned
        cleaned = raw_output.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]

        try:
            parsed = json.loads(cleaned.strip())
        except Exception as err:
            raise ValueError(f"Failed to parse LLM response as JSON: {err}. Raw output: {raw_output}")

        # Validate required schema keys
        required_keys = ["decision", "reason", "recommended_action", "confidence", "requires_human_review"]
        for key in required_keys:
            if key not in parsed:
                raise ValueError(f"Missing required field '{key}' in LLM response.")

        # Ensure decision value is valid
        valid_decisions = {"recoverable", "not_recoverable", "human_review"}
        if parsed["decision"] not in valid_decisions:
            parsed["decision"] = "human_review"
            parsed["requires_human_review"] = True

        return parsed
