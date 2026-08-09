import hmac
import hashlib
import logging
import time
import redis.asyncio as redis
from fastapi import Request, HTTPException, Depends
from config import settings

logger = logging.getLogger("dependencies.auth")

# Initialize Redis connection
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

async def verify_signature(request: Request):
    signature = request.headers.get("X-Internal-Signature")
    timestamp_str = request.headers.get("X-Timestamp")

    if not signature or not timestamp_str:
        logger.warning("Auth failure: Missing X-Internal-Signature or X-Timestamp headers from %s", request.client.host if request.client else "unknown")
        raise HTTPException(status_code=403, detail="Missing authentication headers")

    try:
        timestamp = int(timestamp_str)
    except ValueError as e:
        logger.warning("Auth failure: Invalid timestamp format '%s'", timestamp_str)
        raise HTTPException(status_code=403, detail="Invalid timestamp format") from e

    # Replay attack protection — 30s window
    current_time_ms = int(time.time() * 1000)
    time_delta = abs(current_time_ms - timestamp)
    if time_delta > 30000:
        logger.warning("Auth failure: Request timestamp %s expired (delta=%dms > 30000ms)", timestamp, time_delta)
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
        logger.warning("Auth failure: HMAC signature mismatch for request timestamp %s", timestamp)
        raise HTTPException(status_code=403, detail="Invalid signature")
        
    # Redis Nonce check for exact replay attack prevention (Atomic SET NX)
    nonce_key = f"internal:nonce:{timestamp}:{signature}"
    success = await redis_client.set(nonce_key, "1", ex=30, nx=True)
    if not success:
        logger.warning("Auth failure: Replay attack detected for nonce key: %s", nonce_key)
        raise HTTPException(status_code=403, detail="Replay attack detected")

    logger.info("✅ Internal HMAC signature verified successfully (timestamp=%s)", timestamp)
