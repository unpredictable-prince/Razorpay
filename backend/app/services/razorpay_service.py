import os
import sys
from typing import Any, Dict, Optional
import razorpay

# Ensure backend directory is in sys.path for app module imports
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)


class RazorpayService:
    """
    Isolated Razorpay Integration Service (Test Mode Only).

    Handles credential validation, SDK client initialization, and read-only
    payment verification against Razorpay APIs.
    """

    def __init__(self, key_id: Optional[str] = None, key_secret: Optional[str] = None):
        self.key_id = key_id or os.environ.get("RAZORPAY_KEY_ID")
        self.key_secret = key_secret or os.environ.get("RAZORPAY_KEY_SECRET")
        self._client: Optional[razorpay.Client] = None

    def validate_configuration(self) -> Dict[str, Any]:
        """
        Validates that Razorpay credentials exist and adhere to Test Mode formatting.
        Never logs or exposes secret keys.
        """
        if not self.key_id or not self.key_secret:
            missing = []
            if not self.key_id:
                missing.append("RAZORPAY_KEY_ID")
            if not self.key_secret:
                missing.append("RAZORPAY_KEY_SECRET")
            raise ValueError(
                f"Missing required Razorpay credentials: {', '.join(missing)}. "
                "Please configure them in environment variables or .env file."
            )

        # Enforce Test Mode safety check
        if not self.key_id.startswith("rzp_test_"):
            raise ValueError(
                "Invalid Key ID format. RecoverAI currently enforces Razorpay TEST MODE keys "
                "(key_id must start with 'rzp_test_'). Live production keys are prohibited."
            )

        return {
            "configured": True,
            "key_id": self.key_id,
            "mode": "test",
        }

    def get_client(self) -> razorpay.Client:
        """
        Initializes and returns the Razorpay SDK client instance.
        """
        if self._client is None:
            self.validate_configuration()
            self._client = razorpay.Client(auth=(self.key_id, self.key_secret))
        return self._client

    def fetch_payment(self, payment_id: str) -> Dict[str, Any]:
        """
        Fetches full payment details from Razorpay API by payment ID.

        :param payment_id: Razorpay payment identifier (e.g. 'pay_rec_001')
        :return: Dict containing Razorpay payment object details
        """
        client = self.get_client()
        try:
            return client.payment.fetch(payment_id)
        except Exception as err:
            raise RuntimeError(f"Failed to fetch payment '{payment_id}' from Razorpay: {err}")

    def verify_payment_status(self, payment_id: str) -> Dict[str, Any]:
        """
        Retrieves payment status and failure details from Razorpay for recovery verification.

        :param payment_id: Razorpay payment identifier
        :return: Dict containing status verification summary:
                 - payment_id
                 - status
                 - amount
                 - currency
                 - error_code
                 - error_description
                 - error_reason
        """
        payment_data = self.fetch_payment(payment_id)
        return {
            "payment_id": payment_data.get("id", payment_id),
            "status": payment_data.get("status"),
            "amount": payment_data.get("amount", 0),
            "currency": payment_data.get("currency", "INR"),
            "error_code": payment_data.get("error_code"),
            "error_description": payment_data.get("error_description"),
            "error_reason": payment_data.get("error_reason"),
        }

    def get_payment(self, payment_id: str) -> Dict[str, Any]:
        """
        Retrieves payment details from Razorpay Test Mode and returns a safe, structured summary.

        :param payment_id: Razorpay payment identifier
        :return: Dict containing safe payment details or found=False error dictionary
        """
        try:
            payment_data = self.fetch_payment(payment_id)
            return {
                "found": True,
                "payment_id": payment_data.get("id", payment_id),
                "amount": payment_data.get("amount", 0),
                "currency": payment_data.get("currency", "INR"),
                "status": payment_data.get("status"),
                "order_id": payment_data.get("order_id"),
                "method": payment_data.get("method"),
                "captured": payment_data.get("captured", False),
                "error_code": payment_data.get("error_code"),
                "error_description": payment_data.get("error_description"),
                "error_reason": payment_data.get("error_reason"),
                "created_at": payment_data.get("created_at"),
            }
        except Exception as err:
            return {
                "found": False,
                "payment_id": payment_id,
                "error": f"Payment '{payment_id}' not found or request failed: {err}",
            }

