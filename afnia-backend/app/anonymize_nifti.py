# app/anonymize_nifti.py
from __future__ import annotations

from pathlib import Path
from typing import Callable, Any, Dict
import json
import re
import shutil


DROP_KEYS = {
    "PatientName", "PatientID", "PatientBirthDate", "PatientSex",
    "InstitutionName", "InstitutionAddress",
    "ReferringPhysicianName", "OperatorsName",
    "AccessionNumber",
    "StudyDate", "SeriesDate", "AcquisitionDate",
}

# Files we should copy for NIfTI datasets
COPY_EXTS = {
    ".nii", ".nii.gz",  # NIfTI
    ".bval", ".bvec",   # diffusion sidecars
    ".tsv",             # events/participants sometimes
    ".txt",             # misc sidecars
}


def sanitize_json_sidecar(src: Path) -> dict:
    data = json.loads(src.read_text(encoding="utf-8"))

    def scrub(obj):
        if isinstance(obj, dict):
            out = {}
            for k, v in obj.items():
                if k in DROP_KEYS:
                    continue
                out[k] = scrub(v)
            return out
        if isinstance(obj, list):
            return [scrub(x) for x in obj]
        if isinstance(obj, str):
            obj = re.sub(r"\b[\w\.-]+@[\w\.-]+\.\w+\b", "[redacted-email]", obj)
            obj = re.sub(r"\b\d{7,}\b", "[redacted-number]", obj)
            return obj
        return obj

    return scrub(data)


def anonymize_nifti_tree(
    input_dir: Path,
    out_dir: Path,
    log_write: Callable[[str], None] | None = None,
) -> dict:
    """
    Copies NIfTI + common sidecars into out_dir preserving structure.
    Sanitizes *.json sidecars (drops PHI keys + light regex scrubs).

    Returns a stats dict.
    """
    out_dir.mkdir(parents=True, exist_ok=True)

    def log(msg: str):
        if log_write:
            log_write(msg)

    stats: Dict[str, Any] = {
        "json_cleaned": 0,
        "files_copied": 0,
        "errors": 0,
    }

    for p in input_dir.rglob("*"):
        if not p.is_file():
            continue

        rel = p.relative_to(input_dir)
        out_path = out_dir / rel
        out_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            if p.name.lower().endswith(".json"):
                clean = sanitize_json_sidecar(p)
                out_path.write_text(json.dumps(clean, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
                stats["json_cleaned"] += 1
            else:
                # Copy NIfTI & other relevant sidecars; ignore random binaries here
                # (DICOM path is handled by anonymize_dicom_tree)
                name = p.name.lower()
                if name.endswith(".nii.gz"):
                    shutil.copy2(p, out_path)
                    stats["files_copied"] += 1
                else:
                    if p.suffix.lower() in COPY_EXTS:
                        shutil.copy2(p, out_path)
                        stats["files_copied"] += 1

        except Exception as e:
            stats["errors"] += 1
            log(f"[anonnifti] failed {rel}: {e}")

    log(
        "[anonnifti] done "
        f"json_cleaned={stats['json_cleaned']} files_copied={stats['files_copied']} errors={stats['errors']}"
    )
    return stats


