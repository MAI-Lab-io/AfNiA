from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Dict, List, Tuple

def is_probably_dicom(path: Path) -> Tuple[bool, str]:
    # Fast check: DICOM magic at byte 128 (DICM)
    try:
        with path.open("rb") as f:
            head = f.read(132)
        if len(head) >= 132 and head[128:132] == b"DICM":
            return True, "ok"
    except Exception as e:
        return False, f"read error: {e}"
    # DICOMs can also lack DICM; we’ll do a pydicom parse attempt
    try:
        import pydicom
        ds = pydicom.dcmread(str(path), stop_before_pixels=True, force=True)
        # Heuristic: must have at least a couple common tags
        if hasattr(ds, "SOPClassUID") or hasattr(ds, "StudyInstanceUID"):
            return True, "ok"
        return False, "not a dicom (missing key tags)"
    except Exception as e:
        return False, f"pydicom error: {e}"

def is_probably_nifti(path: Path) -> Tuple[bool, str]:
    name = path.name.lower()
    if not (name.endswith(".nii") or name.endswith(".nii.gz")):
        return False, "not nifti extension"
    try:
        import nibabel as nib
        nib.load(str(path))  # validates header
        return True, "ok"
    except Exception as e:
        return False, f"nibabel error: {e}"

def preflight_filter(
    input_dir: Path,
    input_type: str,
    log_write: Callable[[str], None],
) -> Dict:
    """
    Scans extracted files, removes bad ones, returns report dict.
    input_type: dicom | nifti | mixed
    """
    removed: List[Dict] = []
    kept: int = 0

    files = [p for p in input_dir.rglob("*") if p.is_file()]

    log_write(f"[preflight] scanning {len(files)} files...")

    for p in files:
        # skip our own manifest
        if p.name == "MANIFEST.txt":
            continue

        # remove empty files
        try:
            if p.stat().st_size == 0:
                removed.append({"path": str(p.relative_to(input_dir)), "reason": "empty file"})
                p.unlink(missing_ok=True)
                continue
        except Exception as e:
            removed.append({"path": str(p.relative_to(input_dir)), "reason": f"stat error: {e}"})
            try:
                p.unlink(missing_ok=True)
            except Exception:
                pass
            continue

        ok = False
        reason = "unknown"

        # Determine allowed checks
        check_dicom = input_type in ("dicom", "mixed")
        check_nifti = input_type in ("nifti", "mixed")

        if check_nifti:
            ok_n, r_n = is_probably_nifti(p)
            if ok_n:
                ok = True
            else:
                reason = r_n

        if (not ok) and check_dicom:
            ok_d, r_d = is_probably_dicom(p)
            if ok_d:
                ok = True
            else:
                reason = r_d

        if ok:
            kept += 1
        else:
            removed.append({"path": str(p.relative_to(input_dir)), "reason": reason})
            try:
                p.unlink(missing_ok=True)
            except Exception as e:
                removed[-1]["reason"] = f"{reason}; unlink error: {e}"

    log_write(f"[preflight] kept={kept}, removed={len(removed)}")
    # keep report small: only return first 200 removed details in status
    return {
        "kept_files": kept,
        "removed_count": len(removed),
        "removed_preview": removed[:200],
    }
