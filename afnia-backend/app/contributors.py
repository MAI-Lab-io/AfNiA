from __future__ import annotations

import os
import time
from pathlib import Path
from typing import Any, Dict, Literal

import jwt

from .config import CONTRIBUTORS_DIR
from .utils import read_json, write_json, safe_email


ContributorStatus = Literal["none", "pending", "approved", "rejected"]
ApprovalAction = Literal["approve", "reject"]


def contributor_path(email: str) -> Path:
    return CONTRIBUTORS_DIR / f"{safe_email(email)}.json"


def get_contributor(email: str) -> Dict[str, Any]:
    p = contributor_path(email)
    if not p.exists():
        raise FileNotFoundError("contributor not found")
    return read_json(p)


def is_approved(email: str) -> bool:
    try:
        c = get_contributor(email)
        return c.get("status") == "approved"
    except FileNotFoundError:
        return False


def create_application(email: str, profile: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates/updates a contributor application to 'pending'.

    Notes:
    - Normalizes email to lowercase.
    - If the user is already approved, we keep them approved by default.
      (Change behavior below if you prefer to re-open applications.)
    """
    email_norm = email.strip().lower()
    p = contributor_path(email_norm)

    if p.exists():
        existing = read_json(p)
        if existing.get("status") == "approved":
            # Keep approved users approved; just update profile if you want
            existing["profile"] = profile
            write_json(p, existing)
            return existing

    data = {
        "email": email_norm,
        "status": "pending",
        "profile": profile,
        "updated_at": int(time.time()),
        "created_at": int(time.time()),
    }

    if p.exists():
        # preserve created_at when updating existing file
        existing = read_json(p)
        data["created_at"] = existing.get("created_at", data["created_at"])

    write_json(p, data)
    return data


def set_status(email: str, status: ContributorStatus) -> Dict[str, Any]:
    email_norm = email.strip().lower()
    p = contributor_path(email_norm)

    if not p.exists():
        raise FileNotFoundError("contributor not found")

    data = read_json(p)
    data["status"] = status
    data["updated_at"] = int(time.time())
    write_json(p, data)
    return data


# -------------------------------------------------------------------
# Admin approval tokens (approve/reject via emailed links)
# -------------------------------------------------------------------

ADMIN_APPROVAL_TTL = int(os.getenv("ADMIN_APPROVAL_TTL_SECONDS", str(60 * 60 * 24)))  # default 24h
ADMIN_APPROVAL_SECRET = os.getenv("ADMIN_APPROVAL_SECRET")

# If you want to allow dev without env var, uncomment the next 2 lines:
# if not ADMIN_APPROVAL_SECRET:
#     ADMIN_APPROVAL_SECRET = "dev-secret"


def _require_admin_secret() -> str:
    if not ADMIN_APPROVAL_SECRET:
        raise RuntimeError(
            "ADMIN_APPROVAL_SECRET is not set. Add it to your backend .env (a long random secret)."
        )
    # type narrowing for mypy-like tools
    return str(ADMIN_APPROVAL_SECRET)


def generate_approval_token(email: str, action: ApprovalAction) -> str:
    """
    action: 'approve' or 'reject'
    """
    if action not in ("approve", "reject"):
        raise ValueError("action must be 'approve' or 'reject'")

    email_norm = email.strip().lower()
    secret = _require_admin_secret()

    payload = {
        "email": email_norm,
        "action": action,
        "exp": int(time.time()) + ADMIN_APPROVAL_TTL,
        "iat": int(time.time()),
        "iss": "afnia-admin",
        "typ": "contributor-decision",
    }
    token = jwt.encode(payload, secret, algorithm="HS256")
    # PyJWT sometimes returns bytes in older versions; normalize to str
    return token.decode("utf-8") if isinstance(token, bytes) else token


def verify_approval_token(token: str) -> Dict[str, str]:
    secret = _require_admin_secret()

    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        action = payload.get("action")
        email = payload.get("email")

        if action not in ("approve", "reject"):
            raise ValueError("Invalid approval action")
        if not email or "@" not in str(email):
            raise ValueError("Invalid email in token")

        return {"email": str(email).strip().lower(), "action": str(action)}
    except jwt.ExpiredSignatureError:
        raise ValueError("Approval link expired")
    except Exception as e:
        raise ValueError(f"Invalid approval link: {e}")

