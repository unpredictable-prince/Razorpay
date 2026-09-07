from unittest.mock import MagicMock, patch
import pytest
from app.services.razorpay_service import RazorpayService


def test_razorpay_missing_credentials(monkeypatch):
    monkeypatch.delenv("RAZORPAY_KEY_ID", raising=False)
    monkeypatch.delenv("RAZORPAY_KEY_SECRET", raising=False)

    service = RazorpayService(key_id=None, key_secret=None)
    with pytest.raises(ValueError, match="Missing required Razorpay credentials: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET"):
        service.validate_configuration()


def test_razorpay_missing_secret_only(monkeypatch):
    monkeypatch.setenv("RAZORPAY_KEY_ID", "rzp_test_123456")
    monkeypatch.delenv("RAZORPAY_KEY_SECRET", raising=False)

    service = RazorpayService()
    with pytest.raises(ValueError, match="Missing required Razorpay credentials: RAZORPAY_KEY_SECRET"):
        service.validate_configuration()


def test_razorpay_prohibit_live_keys():
    service = RazorpayService(key_id="rzp_live_secretkey123", key_secret="dummy_secret")
    with pytest.raises(ValueError, match="Invalid Key ID format.*TEST MODE keys"):
        service.validate_configuration()


def test_razorpay_valid_test_configuration():
    service = RazorpayService(key_id="rzp_test_samplekey123", key_secret="sample_secret_key")
    config = service.validate_configuration()

    assert config["configured"] is True
    assert config["key_id"] == "rzp_test_samplekey123"
    assert config["mode"] == "test"
    # Ensure secret is NOT included in configuration report dictionary
    assert "key_secret" not in config
    assert "sample_secret_key" not in str(config)


@patch("razorpay.Client")
def test_fetch_payment_mocked(mock_client_class):
    mock_instance = MagicMock()
    mock_instance.payment.fetch.return_value = {
        "id": "pay_test_001",
        "entity": "payment",
        "amount": 200000,
        "currency": "INR",
        "status": "failed",
        "error_code": "BAD_REQUEST_ERROR",
        "error_description": "Bank server is down",
        "error_reason": "bank_server_down",
    }
    mock_client_class.return_value = mock_instance

    service = RazorpayService(key_id="rzp_test_validkey", key_secret="validsecret")
    payment = service.fetch_payment("pay_test_001")

    assert payment["id"] == "pay_test_001"
    assert payment["status"] == "failed"
    assert payment["amount"] == 200000
    mock_instance.payment.fetch.assert_called_once_with("pay_test_001")


@patch("razorpay.Client")
def test_verify_payment_status_mocked(mock_client_class):
    mock_instance = MagicMock()
    mock_instance.payment.fetch.return_value = {
        "id": "pay_test_002",
        "status": "failed",
        "amount": 50000,
        "currency": "INR",
        "error_code": "GATEWAY_ERROR",
        "error_description": "Payment declined by issuing bank",
        "error_reason": "payment_declined",
    }
    mock_client_class.return_value = mock_instance

    service = RazorpayService(key_id="rzp_test_validkey", key_secret="validsecret")
    verification = service.verify_payment_status("pay_test_002")

    assert verification["payment_id"] == "pay_test_002"
    assert verification["status"] == "failed"
    assert verification["amount"] == 50000
    assert verification["error_reason"] == "payment_declined"


@patch("razorpay.Client")
def test_get_payment_success_mocked(mock_client_class):
    mock_instance = MagicMock()
    mock_instance.payment.fetch.return_value = {
        "id": "pay_test_003",
        "amount": 149900,
        "currency": "INR",
        "status": "captured",
        "order_id": "order_test_999",
        "method": "card",
        "captured": True,
        "created_at": 1700000000,
    }
    mock_client_class.return_value = mock_instance

    service = RazorpayService(key_id="rzp_test_validkey", key_secret="validsecret")
    res = service.get_payment("pay_test_003")

    assert res["found"] is True
    assert res["payment_id"] == "pay_test_003"
    assert res["amount"] == 149900
    assert res["status"] == "captured"
    assert res["order_id"] == "order_test_999"
    assert res["method"] == "card"
    assert res["captured"] is True
    assert res["created_at"] == 1700000000


@patch("razorpay.Client")
def test_get_payment_not_found_mocked(mock_client_class):
    mock_instance = MagicMock()
    mock_instance.payment.fetch.side_effect = Exception("BAD_REQUEST_ERROR: Payment ID not found")
    mock_client_class.return_value = mock_instance

    service = RazorpayService(key_id="rzp_test_validkey", key_secret="validsecret")
    res = service.get_payment("pay_invalid_999")

    assert res["found"] is False
    assert res["payment_id"] == "pay_invalid_999"
    assert "not found or request failed" in res["error"]

