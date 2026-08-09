"""Decrypt payloads encrypted by Node's encryptForTransit() using AES-256-GCM."""

import logging
from Crypto.Cipher import AES
from config import settings

logger = logging.getLogger("services.transit_crypto")


def decrypt_transit(encrypted_obj: dict) -> str:
    """Decrypt a transit-encrypted value.

    Args:
        encrypted_obj: Dict with keys 'iv', 'encryptedData', 'authTag' (all hex strings).

    Returns:
        The decrypted plaintext string.

    Raises:
        ValueError: If INTERNAL_PAYLOAD_KEY is not configured.
        Exception: If decryption or verification fails.
    """
    if not settings.INTERNAL_PAYLOAD_KEY:
        logger.error("Transit decryption failed: INTERNAL_PAYLOAD_KEY is not configured in settings")
        raise ValueError("INTERNAL_PAYLOAD_KEY is not configured")

    logger.debug("Decrypting transit payload (iv_len=%d, ciphertext_len=%d)", len(encrypted_obj.get("iv", "")), len(encrypted_obj.get("encryptedData", "")))
    try:
        key = bytes.fromhex(settings.INTERNAL_PAYLOAD_KEY)
        iv = bytes.fromhex(encrypted_obj["iv"])
        tag = bytes.fromhex(encrypted_obj["authTag"])
        ciphertext = bytes.fromhex(encrypted_obj["encryptedData"])

        cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
        plaintext = cipher.decrypt_and_verify(ciphertext, tag)
        logger.debug("✅ Transit decryption successful (plaintext_length=%d)", len(plaintext))
        return plaintext.decode("utf-8")
    except Exception as e:
        logger.error("❌ Transit decryption failed: %s", e)
        raise

