import json
from pathlib import Path
from typing import Any


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def safe_email(email: str) -> str:
    """
    Make an email safe to use as a filename.
    """
    return email.strip().lower().replace("/", "_").replace("\\", "_")


def atomic_write_json(path: Path, data: Any) -> None:
    """
    Safer write: write to temp then replace.
    Useful for metadata/status files.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, indent=2), encoding="utf-8")
    tmp.replace(path)

