# app/anonymize_dicom.py
from __future__ import annotations

from pathlib import Path
from typing import Dict, Callable, Any
import hashlib
import os
import shutil

import pydicom
from pydicom.uid import generate_uid


# Conservative PHI-ish tags to blank/remove (not exhaustive).
PHI_TAGS = [
    (0x0010, 0x0010),  # PatientName
    (0x0010, 0x0020),  # PatientID
    (0x0010, 0x0030),  # PatientBirthDate
    (0x0010, 0x0040),  # PatientSex
    (0x0010, 0x1000),  # OtherPatientIDs
    (0x0010, 0x1001),  # OtherPatientNames
    (0x0010, 0x2160),  # EthnicGroup
    (0x0010, 0x4000),  # PatientComments

    (0x0008, 0x0080),  # InstitutionName
    (0x0008, 0x0081),  # InstitutionAddress
    (0x0008, 0x0090),  # ReferringPhysicianName
    (0x0008, 0x0092),  # ReferringPhysicianAddress
    (0x0008, 0x0094),  # ReferringPhysicianTelephoneNumbers

    (0x0008, 0x0050),  # AccessionNumber
    (0x0008, 0x1048),  # PhysiciansOfRecord
    (0x0008, 0x1060),  # NameOfPhysiciansReadingStudy

    (0x0010, 0x1040),  # PatientAddress
    (0x0010, 0x2154),  # PatientTelephoneNumbers

    # Dates/times (often considered PHI; keep only if you need temporal info)
    (0x0008, 0x0020),  # StudyDate
    (0x0008, 0x0030),  # StudyTime
    (0x0008, 0x0021),  # SeriesDate
    (0x0008, 0x0031),  # SeriesTime
    (0x0008, 0x0022),  # AcquisitionDate
    (0x0008, 0x0032),  # AcquisitionTime
    (0x0008, 0x0023),  # ContentDate
    (0x0008, 0x0033),  # ContentTime
]

# Tags you want to preserve even if in PHI_TAGS (rare); keep minimal.
KEEP_TAGS = {
    (0x0008, 0x0060),  # Modality
    (0x0020, 0x0013),  # InstanceNumber
}


def _hash_id(s: str, salt: str) -> str:
    h = hashlib.sha256((salt + s).encode("utf-8")).hexdigest()
    return "sub-" + h[:12]


def _try_read_dicom(path: Path):
    """
    Try strict read first; fallback to force=True.
    Returns dataset or None.
    """
    try:
        return pydicom.dcmread(str(path), force=False, stop_before_pixels=False)
    except Exception:
        try:
            return pydicom.dcmread(str(path), force=True, stop_before_pixels=False)
        except Exception:
            return None


def anonymize_dicom_tree(
    input_dir: Path,
    out_dir: Path,
    log_write: Callable[[str], None] | None = None,
) -> dict:
    """
    Walk input_dir, anonymize DICOM files into out_dir preserving relative paths.
    Also copies non-DICOM files as-is (so the anonymized tree stays complete).

    Returns a stats dict.
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    salt = os.getenv("ANON_SALT", "dev-salt-change-me")

    def log(msg: str):
        if log_write:
            log_write(msg)

    uid_map: Dict[str, str] = {}

    def remap_uid(uid: str) -> str:
        if not uid:
            return uid
        if uid not in uid_map:
            uid_map[uid] = generate_uid()
        return uid_map[uid]

    stats: Dict[str, Any] = {
        "files_total": 0,
        "dicom_found": 0,
        "dicom_anonymized": 0,
        "non_dicom_copied": 0,
        "errors": 0,
    }

    for p in input_dir.rglob("*"):
        if not p.is_file():
            continue

        rel = p.relative_to(input_dir)
        out_path = out_dir / rel
        out_path.parent.mkdir(parents=True, exist_ok=True)

        stats["files_total"] += 1

        ds = _try_read_dicom(p)
        if ds is None:
            # Not DICOM → copy as-is
            try:
                shutil.copy2(p, out_path)
                stats["non_dicom_copied"] += 1
            except Exception:
                stats["errors"] += 1
            continue

        stats["dicom_found"] += 1

        try:
            # --- Replace patient identity with stable pseudonym (per upload salt) ---
            pid = str(getattr(ds, "PatientID", "") or getattr(ds, "PatientName", "") or "")
            pseudo = _hash_id(pid if pid else p.name, salt)

            ds.PatientName = pseudo
            ds.PatientID = pseudo
            ds.PatientBirthDate = ""
            ds.PatientSex = ""  # tweak if you want to keep

            # --- Blank PHI tags ---
            for tag in PHI_TAGS:
                if tag in ds and tag not in KEEP_TAGS:
                    try:
                        ds[tag].value = ""
                    except Exception:
                        try:
                            del ds[tag]
                        except Exception:
                            pass

            # --- Remove private tags ---
            try:
                ds.remove_private_tags()
            except Exception:
                pass

            # --- Remap UIDs consistently ---
            if "StudyInstanceUID" in ds:
                ds.StudyInstanceUID = remap_uid(str(ds.StudyInstanceUID))
            if "SeriesInstanceUID" in ds:
                ds.SeriesInstanceUID = remap_uid(str(ds.SeriesInstanceUID))
            if "SOPInstanceUID" in ds:
                ds.SOPInstanceUID = remap_uid(str(ds.SOPInstanceUID))
            if "FrameOfReferenceUID" in ds:
                ds.FrameOfReferenceUID = remap_uid(str(ds.FrameOfReferenceUID))

            # --- Mark as de-identified ---
            ds.PatientIdentityRemoved = "YES"
            ds.DeidentificationMethod = "AfNIA de-id (pydicom scrub + UID remap)"

            ds.save_as(str(out_path), write_like_original=False)
            stats["dicom_anonymized"] += 1

        except Exception as e:
            stats["errors"] += 1
            log(f"[anondicom] failed {rel}: {e}")

    log(
        "[anondicom] done "
        f"dicom_anonymized={stats['dicom_anonymized']} "
        f"non_dicom_copied={stats['non_dicom_copied']} errors={stats['errors']}"
    )
    return stats

