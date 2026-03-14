import json
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from .config import DATASETS_DIR
from .registrations import set_registration_status


def now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


def ensure_dirs() -> None:
    DATASETS_DIR.mkdir(parents=True, exist_ok=True)


def next_dataset_id() -> str:
    """
    ds-000001, ds-000002, ...
    """
    ensure_dirs()
    existing = []
    for p in DATASETS_DIR.iterdir():
        if p.is_dir() and p.name.startswith("ds-"):
            existing.append(p.name)

    if not existing:
        return "ds-000001"

    nums = []
    for name in existing:
        try:
            nums.append(int(name.split("-")[1]))
        except Exception:
            continue

    n = max(nums) + 1 if nums else 1
    return f"ds-{n:06d}"


def dataset_dir(dataset_id: str) -> Path:
    return DATASETS_DIR / dataset_id


def meta_path(dataset_id: str) -> Path:
    return dataset_dir(dataset_id) / "meta.json"


def bids_dir(dataset_id: str) -> Path:
    return dataset_dir(dataset_id) / "bids"


def write_json(path: Path, data: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def read_json(path: Path) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def list_datasets(published_only: bool = True) -> List[Dict[str, Any]]:
    ensure_dirs()
    out: List[Dict[str, Any]] = []

    for d in sorted(DATASETS_DIR.iterdir()):
        if not d.is_dir():
            continue

        mp = d / "meta.json"
        if not mp.exists():
            continue

        try:
            meta = read_json(mp)
        except Exception:
            continue

        if published_only and meta.get("status", "published") != "published":
            continue

        out.append(meta)

    out.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return out


def get_dataset(dataset_id: str) -> Dict[str, Any]:
    mp = meta_path(dataset_id)
    if not mp.exists():
        raise FileNotFoundError("meta.json not found")
    return read_json(mp)


def update_dataset(dataset_id: str, patch: Dict[str, Any]) -> Dict[str, Any]:
    data = get_dataset(dataset_id)
    data.update(patch)
    data["updated_at"] = now_iso()
    write_json(meta_path(dataset_id), data)
    return data


def increment_dataset_counter(dataset_id: str, field: str) -> Dict[str, Any]:
    allowed = {"view_count", "download_count", "citation_count"}
    if field not in allowed:
        raise ValueError(f"Invalid counter field: {field}")

    data = get_dataset(dataset_id)
    current = int(data.get(field, 0) or 0)
    data[field] = current + 1
    data["updated_at"] = now_iso()
    write_json(meta_path(dataset_id), data)
    return data


def increment_view_count(dataset_id: str) -> Dict[str, Any]:
    return increment_dataset_counter(dataset_id, "view_count")


def increment_download_count(dataset_id: str) -> Dict[str, Any]:
    return increment_dataset_counter(dataset_id, "download_count")


def increment_citation_count(dataset_id: str) -> Dict[str, Any]:
    return increment_dataset_counter(dataset_id, "citation_count")


def publish_dataset_from_job(
    job_id: str,
    job_bids_dir: Path,
    meta: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Copies job output bids -> datasets/ds-xxxxxx/bids and writes meta.json
    """

    ensure_dirs()
    ds_id = next_dataset_id()
    ds_root = dataset_dir(ds_id)
    ds_bids = bids_dir(ds_id)

    ds_root.mkdir(parents=True, exist_ok=True)

    if ds_bids.exists():
        shutil.rmtree(ds_bids)

    shutil.copytree(job_bids_dir, ds_bids)

    registration_id = meta.get("registration_id")

    meta_out = {
        "dataset_id": ds_id,
        "job_id": job_id,
        "registration_id": registration_id,
        "status": "published",
        "title": meta.get("title", "").strip(),
        "institution": meta.get("institution", "").strip(),
        "country": meta.get("country", "").strip(),
        "modality": meta.get("modality", []),
        "accessType": meta.get("accessType", "Open"),
        "authors": meta.get("authors", []),
        "description": meta.get("description", "").strip(),
        "uploader_email": meta.get("uploader_email", "").strip().lower(),
        "created_at": now_iso(),
        "updated_at": now_iso(),
        "view_count": 0,
        "download_count": 0,
        "citation_count": 0,
        "extra": meta.get("extra", {}),
        "download_url": f"/api/datasets/{ds_id}/download",
        "detail_url": f"/api/datasets/{ds_id}",
    }

    write_json(meta_path(ds_id), meta_out)

    # If linked to a registration, move that registration to published
    if registration_id:
        try:
            set_registration_status(registration_id, "published")
        except Exception:
            # do not fail dataset publishing if registration update fails
            pass

    return meta_out


def find_dataset_by_registration(registration_id: str) -> Optional[Dict[str, Any]]:
    for ds in list_datasets(published_only=False):
        if ds.get("registration_id") == registration_id:
            return ds
    return None


def list_datasets_by_uploader(email: str, published_only: bool = False) -> List[Dict[str, Any]]:
    email = email.strip().lower()
    return [
        ds
        for ds in list_datasets(published_only=published_only)
        if ds.get("uploader_email", "").strip().lower() == email
    ]