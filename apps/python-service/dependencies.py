import hmac
import hashlib
import time
import redis.asyncio as redis
from fastapi import Request, HTTPException, Depends
from config import settings

# Initialize Redis connection
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

async def verify_signature(request: Request):
    signature = request.headers.get("X-Internal-Signature")
    timestamp_str = request.headers.get("X-Timestamp")

    if not signature or not timestamp_str:
        raise HTTPException(status_code=403, detail="Missing authentication headers")

    try:
        timestamp = int(timestamp_str)
    except ValueError as e:
        raise HTTPException(status_code=403, detail="Invalid timestamp format") from e

    # Replay attack protection — 30s window
    current_time_ms = int(time.time() * 1000)
    if abs(current_time_ms - timestamp) > 30000:
        raise HTTPException(status_code=403, detail="Request expired")

    # Read body to verify signature
    body_bytes = await request.body()
    payload = body_bytes.decode('utf-8')

    expected_mac = hmac.new(
        settings.INTERNAL_SECRET.encode('utf-8'),
        f"{timestamp}.{payload}".encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_mac, signature):
        raise HTTPException(status_code=403, detail="Invalid signature")
        
    # Redis Nonce check for exact replay attack prevention (Atomic SET NX)
    nonce_key = f"internal:nonce:{timestamp}:{signature}"
    success = await redis_client.set(nonce_key, "1", ex=30, nx=True)
    if not success:
        raise HTTPException(status_code=403, detail="Replay attack detected")
