"""BYOK (Bring Your Own Key) resolution and AI generation rate limiting."""

import datetime
import logging

from fastapi import HTTPException
from langchain_groq import ChatGroq

from config import settings
from dependencies import redis_client
from services.transit_crypto import decrypt_transit

logger = logging.getLogger("services.byok")

FREE_TIER_LIMIT = 5
PRO_TIER_LIMIT = 20

CC_FREE_TIER_LIMIT = 1
CC_PRO_TIER_LIMIT = 5

LUA_RATE_LIMIT = """
local count = redis.call('INCR', KEYS[1])
local ttl = redis.call('TTL', KEYS[1])
if count == 1 or ttl == -1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
    ttl = tonumber(ARGV[1])
end
return {count, ttl}
"""

LUA_CHECK_LIMIT = """
local count = tonumber(redis.call('GET', KEYS[1]) or '0')
local ttl = redis.call('TTL', KEYS[1])
return {count, ttl}
"""


async def resolve_ai_client(
    developer_id: str | None,
    plan: str | None,
    encrypted_byok: dict | None,
    feature: str = "query-builder",
    increment: bool = True,
    model: str = "qwen/qwen3.6-27b",
) -> ChatGroq:
    """Resolve the appropriate AI client based on BYOK and plan.

    Resolution order:
        1. BYOK key present → decrypt, use developer's key, no rate limit
        2. Pro plan, no BYOK → platform key, 20 sessions/month limit
        3. Free plan, no BYOK → platform key, 5 sessions/month limit

    Args:
        developer_id: The developer's MongoDB ObjectId string.
        plan: The developer's plan ('free' or 'pro').
        encrypted_byok: Transit-encrypted BYOK payload from Node, or None.
        feature: The feature being used ("query-builder" or "collection-creator").
        increment: Whether to increment the usage count.

    Returns:
        An initialized ChatGroq client.

    Raises:
        HTTPException: 401 if BYOK key is invalid, 403 if rate limited, 500 if no platform key.
    """
    logger.info("Resolving AI client | feature=%s, dev_id=%s, plan=%s, has_byok=%s, increment=%s", feature, developer_id, plan, bool(encrypted_byok and encrypted_byok.get("groqKey")), increment)

    # ── 1. Try BYOK ──
    if encrypted_byok and encrypted_byok.get("groqKey"):
        logger.info("🔑 Attempting to decrypt BYOK Groq key for developer_id=%s...", developer_id)
        try:
            decrypted_key = decrypt_transit(encrypted_byok["groqKey"])
            logger.info("✅ BYOK Groq key decrypted successfully. Initializing ChatGroq client (model=%s)...", model)
            return ChatGroq(
                api_key=decrypted_key,
                model_name=model,
                temperature=0,
            )
        except Exception as e:
            logger.warning("❌ BYOK decryption/init failed for developer_id=%s: %s", developer_id, e)
            if isinstance(e, ValueError) and "INTERNAL_PAYLOAD_KEY" in str(e):
                raise HTTPException(status_code=500, detail=str(e)) from e
            raise HTTPException(status_code=401, detail="Invalid BYOK Groq key provided") from e

    # ── 2. Platform key guard ──
    if not settings.GROQ_API_KEY:
        logger.error("❌ Platform AI key (GROQ_API_KEY) is not configured in settings")
        raise HTTPException(
            status_code=500, detail="Platform AI key not configured"
        )

    # ── 3. Platform key atomic rate limit ──
    if not developer_id:
        logger.warning("❌ developer_id missing for platform key rate limiting")
        raise HTTPException(
            status_code=400,
            detail="developer_id is required for platform key rate limiting"
        )

    if feature == "collection-creator":
        limit = CC_PRO_TIER_LIMIT if plan == "pro" else CC_FREE_TIER_LIMIT
        key_prefix = "ai:cc:count"
    else:
        limit = PRO_TIER_LIMIT if plan == "pro" else FREE_TIER_LIMIT
        key_prefix = "ai:gen:count"

    month = datetime.datetime.now(datetime.UTC).strftime("%Y-%m")
    key = f"{key_prefix}:{developer_id}:{month}"

    logger.info("🏢 Using Platform Groq key. Checking Redis rate limit at '%s' (limit=%d/month, increment=%s)...", key, limit, increment)

    if increment:
        count, ttl = await redis_client.eval(LUA_RATE_LIMIT, 1, key, 32 * 86400)
    else:
        count, ttl = await redis_client.eval(LUA_CHECK_LIMIT, 1, key)
        # If we are just checking, we still enforce the limit but don't increment.
        # Actually, if count >= limit, we should block.
        # Wait, if count == limit and we check, it's allowed.
        # If count > limit, it's blocked.
        # So we just use count.

    logger.info("📊 Monthly usage for developer_id=%s: %d/%d (TTL: %ds remaining in window)", developer_id, count, limit, ttl)

    if count > limit:
        tier_name = "Pro" if plan == "pro" else "Free"
        feature_name = "Schema Designs" if feature == "collection-creator" else "AI usages"
        upgrade_msg = (
            "Add your own Groq key in Settings to get unlimited usage."
            if plan == "pro"
            else "Upgrade to Pro or add your own Groq key in Settings."
        )
        logger.warning("🚫 Rate limit exceeded for developer_id=%s: %d > %d allowed in %s tier", developer_id, count, limit, tier_name)
        raise HTTPException(
            status_code=403,
            detail=f"{tier_name} tier limit reached ({limit} {feature_name}/month). {upgrade_msg}",
        )

    # ── 4. Return platform client ──
    logger.info("✅ Rate limit check passed for developer_id=%s. Initializing Platform ChatGroq client (model=%s)...", developer_id, model)
    return ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model_name=model,
        temperature=0,
    )

