import pytest
import hmac
import hashlib
import time
import os
import sys
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch

SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))
os.environ.setdefault("INTERNAL_SECRET", "test-internal-secret")

from dependencies import verify_signature
from config import settings
from fastapi import Depends

# Create a dummy FastAPI app to test the dependency
app = FastAPI()

@app.post("/test-endpoint", dependencies=[Depends(verify_signature)])
async def dummy_endpoint(request: Request):
    return {"message": "success"}

client = TestClient(app)

def generate_valid_signature(timestamp: int, payload: str) -> str:
    return hmac.new(
        settings.INTERNAL_SECRET.encode('utf-8'),
        f"{timestamp}.{payload}".encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

@pytest.fixture(autouse=True)
def mock_redis():
    with patch('dependencies.redis_client.get', new_callable=AsyncMock) as mock_get, \
         patch('dependencies.redis_client.set', new_callable=AsyncMock) as mock_set:
        mock_set.return_value = True  # Simulate nonce does not exist (SET NX succeeds)
        yield mock_get, mock_set

def test_missing_headers():
    response = client.post("/test-endpoint", json={"foo": "bar"})
    assert response.status_code == 403
    assert response.json()["detail"] == "Missing authentication headers"

def test_invalid_signature():
    timestamp = int(time.time() * 1000)
    response = client.post(
        "/test-endpoint",
        json={"foo": "bar"},
        headers={
            "X-Timestamp": str(timestamp),
            "X-Internal-Signature": "invalid_signature_hex"
        }
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Invalid signature"

def test_expired_timestamp():
    # 60 seconds in the past
    timestamp = int(time.time() * 1000) - 60000 
    payload = '{"foo": "bar"}'
    signature = generate_valid_signature(timestamp, payload)

    response = client.post(
        "/test-endpoint",
        content=payload,
        headers={
            "X-Timestamp": str(timestamp),
            "X-Internal-Signature": signature
        }
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Request expired"

def test_valid_request():
    timestamp = int(time.time() * 1000)
    payload = '{"foo": "bar"}'
    signature = generate_valid_signature(timestamp, payload)

    response = client.post(
        "/test-endpoint",
        content=payload,
        headers={
            "X-Timestamp": str(timestamp),
            "X-Internal-Signature": signature
        }
    )
    assert response.status_code == 200
    assert response.json()["message"] == "success"

def test_replay_attack(mock_redis):
    _, mock_set = mock_redis
    # Simulate that Redis says this nonce already exists (SET NX fails)
    mock_set.return_value = None 

    timestamp = int(time.time() * 1000)
    payload = '{"foo": "bar"}'
    signature = generate_valid_signature(timestamp, payload)

    response = client.post(
        "/test-endpoint",
        content=payload,
        headers={
            "X-Timestamp": str(timestamp),
            "X-Internal-Signature": signature
        }
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Replay attack detected"
