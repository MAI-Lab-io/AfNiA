from __future__ import annotations
from pathlib import Path
from typing import Dict, Any
from .config import DATA_DIR  # if you have it; else use Path("afnia_data")

PROFILES_DIR = Path("afnia_data") / "profiles"
PROFILES_DIR.mkdir(parents=True, exist_ok=True)

def profile_path(email: str) -> Path:
    safe = email.strip().lower().replace("/", "_")
    return PROFILES_DIR / f"{safe}.json"

def get_profile(email: str) -> Dict[str, Any]:
    p = profile_path(email)
    if not p.exists():
        raise FileNotFoundError(email)
    import json
    return json.loads(p.read_text(encoding="utf-8"))

def upsert_profile(email: str, data: Dict[str, Any]) -> Dict[str, Any]:
    p = profile_path(email)
    import json
    p.write_text(json.dumps({"email": email.strip().lower(), **data}, indent=2) + "\n", encoding="utf-8")
    return get_profile(email)
