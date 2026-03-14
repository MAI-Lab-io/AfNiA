from __future__ import annotations

from pathlib import Path
from typing import Dict, Any, List, Optional
import json
import uuid
from datetime import datetime

REG_DIR = Path("afnia_data") / "registrations"
REG_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_STATUSES = {
    "draft",
    "pending_review",
    "approved",
    "rejected",
    "uploading",
    "processing",
    "published",
    "archived",
    "failed",
}


def now() -> str:
    return datetime.utcnow().isoformat() + "Z"


def reg_path(reg_id: str) -> Path:
    return REG_DIR / f"{reg_id}.json"


def _write_registration(data: Dict[str, Any]) -> Dict[str, Any]:
    reg_id = data["reg_id"]
    reg_path(reg_id).write_text(
        json.dumps(data, indent=2) + "\n",
        encoding="utf-8",
    )
    return data


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _validate_status(status: str) -> None:
    if status not in ALLOWED_STATUSES:
        raise ValueError(
            f"Invalid registration status '{status}'. "
            f"Allowed: {sorted(ALLOWED_STATUSES)}"
        )


def create_registration(
    owner_email: str,
    payload: Dict[str, Any],
    *,
    ethics_document_path: Optional[str] = None,
    diagnostic_metadata_path: Optional[str] = None,
    status: str = "pending_review",
) -> Dict[str, Any]:
    _validate_status(status)

    reg_id = str(uuid.uuid4())
    ts = now()

    data = {
        "reg_id": reg_id,
        "owner_email": _normalize_email(owner_email),
        "status": status,
        "admin_note": None,
        "created_at": ts,
        "updated_at": ts,
        "ethics_document_path": ethics_document_path,
        "diagnostic_metadata_path": diagnostic_metadata_path,
        "payload": payload,
    }

    return _write_registration(data)


def get_registration(reg_id: str) -> Dict[str, Any]:
    p = reg_path(reg_id)
    if not p.exists():
        raise FileNotFoundError(f"Registration not found: {reg_id}")
    return json.loads(p.read_text(encoding="utf-8"))


def registration_exists(reg_id: str) -> bool:
    return reg_path(reg_id).exists()


def update_registration(
    reg_id: str,
    *,
    payload: Optional[Dict[str, Any]] = None,
    ethics_document_path: Optional[str] = None,
    diagnostic_metadata_path: Optional[str] = None,
    admin_note: Optional[str] = None,
) -> Dict[str, Any]:
    data = get_registration(reg_id)

    if payload is not None:
        data["payload"] = payload

    if ethics_document_path is not None:
        data["ethics_document_path"] = ethics_document_path

    if diagnostic_metadata_path is not None:
        data["diagnostic_metadata_path"] = diagnostic_metadata_path

    if admin_note is not None:
        data["admin_note"] = admin_note

    data["updated_at"] = now()
    return _write_registration(data)


def set_registration_status(
    reg_id: str,
    status: str,
    *,
    admin_note: Optional[str] = None,
) -> Dict[str, Any]:
    _validate_status(status)

    data = get_registration(reg_id)
    data["status"] = status
    data["updated_at"] = now()

    if admin_note is not None:
        data["admin_note"] = admin_note

    return _write_registration(data)


def approve_registration(reg_id: str, admin_note: Optional[str] = None) -> Dict[str, Any]:
    return set_registration_status(
        reg_id,
        "approved",
        admin_note=admin_note,
    )


def reject_registration(reg_id: str, admin_note: str) -> Dict[str, Any]:
    if not admin_note or not admin_note.strip():
        raise ValueError("admin_note is required when rejecting a registration")

    return set_registration_status(
        reg_id,
        "rejected",
        admin_note=admin_note.strip(),
    )


def require_owner(reg_id: str, owner_email: str) -> Dict[str, Any]:
    data = get_registration(reg_id)
    if data["owner_email"] != _normalize_email(owner_email):
        raise PermissionError("You do not own this registration")
    return data


def list_registrations() -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []

    for p in sorted(REG_DIR.glob("*.json")):
        try:
            items.append(json.loads(p.read_text(encoding="utf-8")))
        except Exception:
            continue

    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return items


def list_registrations_by_owner(owner_email: str) -> List[Dict[str, Any]]:
    owner_email = _normalize_email(owner_email)
    return [
        item
        for item in list_registrations()
        if item.get("owner_email") == owner_email
    ]


def list_registrations_by_status(status: str) -> List[Dict[str, Any]]:
    _validate_status(status)
    return [
        item
        for item in list_registrations()
        if item.get("status") == status
    ]


def can_upload_files(reg_id: str) -> bool:
    data = get_registration(reg_id)
    return data.get("status") == "approved"


def delete_registration(reg_id: str, owner_email: str) -> None:
    data = require_owner(reg_id, owner_email)

    # safer rule: only allow delete before publish/processing
    if data["status"] not in {"draft", "pending_review", "rejected"}:
        raise PermissionError(
            "Only draft, pending_review, or rejected registrations can be deleted"
        )

    p = reg_path(reg_id)
    if p.exists():
        p.unlink()
