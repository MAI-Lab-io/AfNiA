from __future__ import annotations
from pathlib import Path
from typing import Callable, Dict, Any
import pydicom

CHECK_TAGS = [
    "PatientName",
    "PatientID",
    "PatientBirthDate",
    "PatientAddress",
    "PatientTelephoneNumbers",
    "InstitutionName",
    "InstitutionAddress",
    "ReferringPhysicianName",
    "AccessionNumber",
]

def verify_anonymized_dicom_tree(
    anon_dir: Path,
    log_write: Callable[[str], None] | None = None,
    max_files: int = 200,
) -> Dict[str, Any]:
    def log(s: str):
        if log_write:
            log_write(s)

    checked = 0
    violations = []

    for p in anon_dir.rglob("*"):
        if not p.is_file():
            continue
        if checked >= max_files:
            break
        try:
            ds = pydicom.dcmread(str(p), stop_before_pixels=True, force=True)
        except Exception:
            continue

        # Skip non-DICOM-ish files
        if not getattr(ds, "SOPClassUID", None):
            continue

        checked += 1
        for tag in CHECK_TAGS:
            if hasattr(ds, tag):
                v = getattr(ds, tag)
                if v not in (None, "", []):
                    violations.append(
                        {
                            "file": str(p.relative_to(anon_dir)),
                            "tag": tag,
                            "value": str(v)[:120],
                        }
                    )

    ok = len(violations) == 0
    log(f"[anonverify] checked={checked} ok={ok} violations={len(violations)}")
    return {"ok": ok, "checked": checked, "violations": violations[:25]}
