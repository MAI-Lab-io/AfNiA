# app/deface.py
from __future__ import annotations

import os
import shutil
import subprocess
from pathlib import Path
from typing import Callable, Dict, Any, List


def _which(cmd: str) -> str | None:
    return shutil.which(cmd)


def _run(cmd: List[str], timeout_sec: int = 1800) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout_sec)


def deface_bids(
    bids_dir: Path,
    log_write: Callable[[str], None],
) -> Dict[str, Any]:
    """
    Deface BIDS anatomical images in-place (T1w by default).
    Uses `pydeface` CLI if available.
    Safe behavior:
      - If pydeface isn't installed, returns {"ran": False, "skipped_reason": "..."}
      - If no anat images found, returns ran=True with 0 files
    """
    enabled = os.getenv("DEFACE_ENABLED", "1").strip().lower() in ("1", "true", "yes", "on")
    if not enabled:
        return {"ran": False, "skipped_reason": "DEFACE_ENABLED is off"}

    # Which modalities to deface (comma-separated)
    # Example: "T1w,T2w"
    modalities = os.getenv("DEFACE_MODALITIES", "T1w").strip()
    want = {m.strip() for m in modalities.split(",") if m.strip()}
    if not want:
        want = {"T1w"}

    pydeface = _which("pydeface")
    if not pydeface:
        return {"ran": False, "skipped_reason": "pydeface CLI not found (install pydeface and its deps)"}

    # Find candidate anat NIfTI files
    # We target nii.gz; if you may output .nii also, add "*.nii".
    candidates: List[Path] = []
    anat_dirs = list(bids_dir.glob("sub-*/anat"))
    for anat in anat_dirs:
        if not anat.is_dir():
            continue
        for f in anat.glob("*.nii.gz"):
            name = f.name
            # Match BIDS suffix like *_T1w.nii.gz, *_T2w.nii.gz
            if any(f"_{m}." in name for m in want):
                candidates.append(f)

    log_write(f"[deface] enabled modalities={sorted(want)}")
    log_write(f"[deface] found {len(candidates)} anat files to deface")

    if not candidates:
        return {"ran": True, "files_found": 0, "files_defaced": 0, "files_failed": 0}

    # Backup originals (optional but recommended for debugging; keep only in job dir, not published)
    backup_root = bids_dir.parent / "deface_backup"
    backup_root.mkdir(parents=True, exist_ok=True)

    files_defaced = 0
    files_failed = 0
    failures: List[Dict[str, str]] = []

    for nii in candidates:
        try:
            rel = nii.relative_to(bids_dir)
            backup_path = backup_root / rel
            backup_path.parent.mkdir(parents=True, exist_ok=True)

            # backup original
            shutil.copy2(nii, backup_path)

            # deface to temp output then replace
            out_tmp = nii.with_suffix("").with_suffix("").with_name(nii.stem.replace(".nii", "") + "_defaced.nii.gz")

            cmd = [
                pydeface,
                "--infile",
                str(nii),
                "--outfile",
                str(out_tmp),
                "--force",  # overwrite outfile if exists
            ]

            log_write(f"[deface] running: {' '.join(cmd)}")
            proc = _run(cmd, timeout_sec=1800)

            if proc.returncode != 0 or not out_tmp.exists():
                files_failed += 1
                failures.append(
                    {
                        "file": str(rel),
                        "returncode": str(proc.returncode),
                        "stderr": (proc.stderr or "").strip()[:2000],
                    }
                )
                log_write(f"[deface] FAILED: {rel} (rc={proc.returncode})")
                continue

            # Replace original with defaced output
            shutil.move(str(out_tmp), str(nii))
            files_defaced += 1
            log_write(f"[deface] OK: {rel}")

        except Exception as e:
            files_failed += 1
            failures.append({"file": str(nii), "error": str(e)})
            log_write(f"[deface] FAILED exception: {nii} err={e}")

    result: Dict[str, Any] = {
        "ran": True,
        "files_found": len(candidates),
        "files_defaced": files_defaced,
        "files_failed": files_failed,
        "backup_dir": str(backup_root),
    }
    if failures:
        result["failures"] = failures

    return result
