from __future__ import annotations

import os
import json
import time
import base64
from typing import Optional, Dict, Any, Set

import requests
import jwt  # PyJWT
from fastapi import Depends, Header, HTTPException


SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

JWKS_URL = None
if SUPABASE_URL:
    JWKS_URL = f"{SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"


# Comma-separated list:
# ADMIN_EMAILS=admin@afnia.org,haskemailab@gmail.com
ADMIN_EMAILS_RAW = os.getenv("ADMIN_EMAILS", "")
ADMIN_EMAILS: Set[str] = {
    e.strip().lower()
    for e in ADMIN_EMAILS_RAW.split(",")
    if e.strip()
}


_jwks_cache: Optional[Dict[str, Any]] = None
_jwks_cache_ts: float = 0.0
_JWKS_TTL_SECONDS = 60 * 10  # 10 minutes


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _is_admin_email(email: Optional[str]) -> bool:
    if not email:
        return False
    return _normalize_email(email) in ADMIN_EMAILS


def _load_jwks(force_refresh: bool = False) -> Dict[str, Any]:
    global _jwks_cache, _jwks_cache_ts

    if not JWKS_URL:
        raise HTTPException(status_code=500, detail="SUPABASE_URL not configured")

    now_ts = time.time()
    if (
        not force_refresh
        and _jwks_cache is not None
        and (now_ts - _jwks_cache_ts) < _JWKS_TTL_SECONDS
    ):
        return _jwks_cache

    headers = {}
    if SUPABASE_ANON_KEY:
        headers["apikey"] = SUPABASE_ANON_KEY

    try:
        r = requests.get(JWKS_URL, headers=headers, timeout=10)
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch JWKS: {str(e)}")

    if r.status_code != 200:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch JWKS: {r.status_code} {r.text}",
        )

    jwks = r.json()
    _jwks_cache = jwks
    _jwks_cache_ts = now_ts
    return jwks


def _get_unverified_header(token: str) -> Dict[str, Any]:
    try:
        return jwt.get_unverified_header(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token header")


def _decode_segment(seg: str) -> dict:
    # Debug helper
    pad = "=" * (-len(seg) % 4)
    return json.loads(base64.urlsafe_b64decode(seg + pad).decode("utf-8"))


def _select_signing_key(token: str) -> Dict[str, Any]:
    jwks = _load_jwks()
    keys = jwks.get("keys", [])

    if not keys:
        raise HTTPException(
            status_code=500,
            detail=(
                "JWKS returned no keys. In Supabase Dashboard → Settings → JWT Keys: "
                "enable or migrate to JWT signing keys."
            ),
        )

    header = _get_unverified_header(token)
    kid = header.get("kid")
    if not kid:
        raise HTTPException(status_code=401, detail="Token missing kid")

    key = next((k for k in keys if k.get("kid") == kid), None)

    if key is None:
        # refresh once in case keys rotated
        jwks = _load_jwks(force_refresh=True)
        keys = jwks.get("keys", [])
        key = next((k for k in keys if k.get("kid") == kid), None)

    if key is None:
        raise HTTPException(status_code=401, detail="Unknown signing key (kid)")

    return key


def _decode_token(token: str) -> Dict[str, Any]:
    key = _select_signing_key(token)
    alg = key.get("alg", "ES256")

    try:
        if alg == "ES256":
            public_key = jwt.algorithms.ECAlgorithm.from_jwk(json.dumps(key))
        elif alg == "RS256":
            public_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key))
        else:
            raise HTTPException(
                status_code=401,
                detail=f"Unsupported signing algorithm: {alg}",
            )

        payload = jwt.decode(
            token,
            public_key,
            algorithms=[alg],
            options={"verify_aud": False},
        )
        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


def get_current_user(
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
) -> Dict[str, Any]:
    """
    Expects:
        Authorization: Bearer <access_token>

    Returns:
        {
            "email": "...",
            "sub": "...",
            "is_admin": True|False,
            "raw": {...jwt payload...}
        }
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")

    payload = _decode_token(token)

    email = payload.get("email")
    sub = payload.get("sub")

    if not email:
        raise HTTPException(status_code=401, detail="Token missing email")

    email = _normalize_email(str(email))

    return {
        "email": email,
        "sub": str(sub) if sub else "",
        "is_admin": _is_admin_email(email),
        "raw": payload,
    }


def get_optional_current_user(
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
) -> Optional[Dict[str, Any]]:
    """
    Same as get_current_user, but returns None if no Authorization header is provided.
    Useful for semi-public endpoints.
    """
    if not authorization:
        return None
    return get_current_user(authorization)


def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Admin guard: only allow users whose email is in ADMIN_EMAILS.
    """
    if not ADMIN_EMAILS:
        raise HTTPException(status_code=500, detail="ADMIN_EMAILS not configured")

    if not user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")

    return user
