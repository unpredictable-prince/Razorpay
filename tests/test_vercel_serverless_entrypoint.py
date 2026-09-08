import os
import pytest
from fastapi.testclient import TestClient
from api.index import app


def test_vercel_serverless_health():
    """Verify the unified serverless /health and /api/health endpoints."""
    with TestClient(app) as client:
        res = client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] in ("ok", "degraded")
        assert "database" in data
        assert "database_type" in data

        res_api = client.get("/api/health")
        assert res_api.status_code == 200


def test_vercel_serverless_products():
    """Verify /api/products returns catalog products through unified serverless router."""
    with TestClient(app) as client:
        res = client.get("/api/products")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        assert len(data) >= 10


def test_vercel_serverless_transactions():
    """Verify /transactions returns transactions through unified serverless router."""
    with TestClient(app) as client:
        res = client.get("/transactions")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)

        res_stats = client.get("/transactions/stats")
        assert res_stats.status_code == 200
        stats = res_stats.json()
        assert "total_transactions" in stats
