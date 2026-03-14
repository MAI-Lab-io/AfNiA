from __future__ import annotations

import json
import re
import shutil
import subprocess
from pathlib import Path
from typing import Callable, Dict, List, Optional, Tuple

BIDS_VERSION = "1.9.0"

PHI_KEYS_TO_REMOVE = {
    "InstitutionName",
    "InstitutionAddress",
    "InstitutionalDepartmentName",
    "StationName",
    "DeviceSerialNumber",
    "ReferringPhysicianName",
    "PerformingPhysicianName",
    "OperatorsName",
    "PatientName",
    "PatientID",
    "PatientBirthDate",
    "AccessionNumber",
    "StudyID",
    "StudyDate",
    "StudyTime",
    "SeriesDate",
    "SeriesTime",
    "AcquisitionDate",
    "AcquisitionTime",
}

# -----------------------
# Small utilities
# -----------------------

def _safe_mkdir(p: Path) -> None:
    p.mkdir(parents=True, exist_ok=True)

def _write_json(path: Path, data: dict) -> None:
    _safe_mkdir(path.parent)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")

def _read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))

def _append_log(log_write: Callable[[str], None], msg: str) -> None:
    log_write(msg.rstrip())

def _run_cmd(cmd: List[str], log_write: Callable[[str], None]) -> None:
    _append_log(log_write, "[cmd] " + " ".join(cmd))
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    assert proc.stdout is not None
    for line in proc.stdout:
        _append_log(log_write, line)
    rc = proc.wait()
    if rc != 0:
        raise RuntimeError(f"Command failed ({rc}): {' '.join(cmd)}")

def _slugify(s: str) -> str:
    s = s.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "", s)
    return s

def _scrub_json_sidecar(path: Path) -> None:
    if not path.exists():
        return
    try:
        data = _read_json(path)
    except Exception:
        return
    changed = False
    for k in list(data.keys()):
        if k in PHI_KEYS_TO_REMOVE:
            data.pop(k, None)
            changed = True
    if changed:
        _write_json(path, data)

def _detect_subject_dirs(input_dir: Path) -> List[Tuple[str, Path]]:
    """
    Supports:
      - multi-subject zip: input/sub-001/, input/sub-002/...
      - single-subject zip: input/* -> treated as sub-001
    """
    subs: List[Tuple[str, Path]] = []
    for p in input_dir.iterdir():
        if p.is_dir() and re.match(r"^sub[-_]\w+", p.name):
            subs.append((p.name.replace("sub_", "sub-"), p))
    if subs:
        subs.sort(key=lambda x: x[0])
        return subs
    return [("sub-001", input_dir)]

def _ensure_bids_root(bids_root: Path, dataset_name: str = "AfNIA Upload") -> None:
    _safe_mkdir(bids_root)
    dd = bids_root / "dataset_description.json"
    if not dd.exists():
        _write_json(
            dd,
            {
                "Name": dataset_name,
                "BIDSVersion": BIDS_VERSION,
                "DatasetType": "raw",
                "GeneratedBy": [{"Name": "AfNIA Converter", "Version": "0.1.0"}],
            },
        )
    readme = bids_root / "README"
    if not readme.exists():
        readme.write_text(
            "Converted to BIDS by AfNIA (best-effort). Review before publication.\n",
            encoding="utf-8",
        )

def _update_participants(bids_root: Path, subject_ids: List[str]) -> None:
    p = bids_root / "participants.tsv"
    if not p.exists():
        p.write_text("participant_id\n", encoding="utf-8")
    existing = set(p.read_text(encoding="utf-8").splitlines()[1:])
    with p.open("a", encoding="utf-8") as f:
        for sid in subject_ids:
            if sid not in existing:
                f.write(f"{sid}\n")

# -----------------------
# Heuristic classification
# -----------------------

class _Classified:
    def __init__(
        self,
        datatype: str,   # anat, func, dwi
        suffix: str,     # T1w, T2w, FLAIR, bold, dwi
        task: Optional[str] = None,
        run: Optional[int] = None,
    ):
        self.datatype = datatype
        self.suffix = suffix
        self.task = task
        self.run = run

def _classify_from_json(json_path: Path) -> _Classified:
    data = {}
    try:
        data = _read_json(json_path)
    except Exception:
        pass

    series_desc = str(data.get("SeriesDescription", "") or "")
    protocol = str(data.get("ProtocolName", "") or "")
    seq = str(data.get("ScanningSequence", "") or "")
    body = " ".join([series_desc, protocol, seq]).lower()

    if "diff" in body or "dwi" in body or "ep2d_diff" in body:
        return _Classified("dwi", "dwi")

    if "bold" in body or "fmri" in body or "rest" in body:
        task = "rest" if "rest" in body else None
        return _Classified("func", "bold", task=task)

    if "flair" in body:
        return _Classified("anat", "FLAIR")

    if re.search(r"\bt2\b", body) or "t2w" in body:
        return _Classified("anat", "T2w")

    if "mprage" in body or "spgr" in body or re.search(r"\bt1\b", body) or "t1w" in body:
        return _Classified("anat", "T1w")

    return _Classified("anat", "T1w")

def _classify_from_filename(nifti_path: Path) -> _Classified:
    name = nifti_path.name.lower()
    if "flair" in name:
        return _Classified("anat", "FLAIR")
    if "t2" in name:
        return _Classified("anat", "T2w")
    if "dwi" in name or "diff" in name:
        return _Classified("dwi", "dwi")
    if "bold" in name or "fmri" in name or "rest" in name:
        task = "rest" if "rest" in name else None
        return _Classified("func", "bold", task=task)
    if "t1" in name or "mprage" in name:
        return _Classified("anat", "T1w")
    return _Classified("anat", "T1w")

def _bids_filename(sub_id: str, c: _Classified, ext: str) -> str:
    parts = [sub_id]
    if c.task:
        parts.append(f"task-{_slugify(c.task)}")
    if c.run is not None:
        parts.append(f"run-{c.run:02d}")
    parts.append(c.suffix)
    return "_".join(parts) + ext

# -----------------------
# Conversion steps
# -----------------------

def _dicom_to_nifti(dicom_dir: Path, out_dir: Path, log_write: Callable[[str], None]) -> None:
    _safe_mkdir(out_dir)
    # dcm2niix writes .nii.gz + .json sidecars
    cmd = [
        "dcm2niix",
        "-b", "y",
        "-z", "y",
        "-o", str(out_dir),
        "-f", "%p_%s",
        str(dicom_dir),
    ]
    _run_cmd(cmd, log_write)

def _organize_nifti_to_bids(
    sub_id: str,
    nifti_dir: Path,
    bids_root: Path,
    log_write: Callable[[str], None],
) -> None:
    niftis = sorted([p for p in nifti_dir.glob("*.nii*") if p.is_file()])
    if not niftis:
        raise RuntimeError(f"No NIfTI files found in {nifti_dir}")

    run_counter: Dict[Tuple[str, str, Optional[str]], int] = {}

    for nii in niftis:
        # sidecar detection
        if nii.name.endswith(".nii.gz"):
            sidecar = nii.with_suffix("").with_suffix(".json")
            ext = ".nii.gz"
        else:
            sidecar = nii.with_suffix(".json")
            ext = ".nii"

        if sidecar.exists():
            c = _classify_from_json(sidecar)
        else:
            c = _classify_from_filename(nii)

        key = (c.datatype, c.suffix, c.task)
        run_counter[key] = run_counter.get(key, 0) + 1
        if run_counter[key] > 1:
            c.run = run_counter[key]
        else:
            c.run = None

        out_dir = bids_root / sub_id / c.datatype
        _safe_mkdir(out_dir)

        out_name = _bids_filename(sub_id, c, ext)
        out_nii = out_dir / out_name

        _append_log(log_write, f"[bids] {nii.name} -> {out_nii.relative_to(bids_root)}")
        shutil.copy2(nii, out_nii)

        if sidecar.exists():
            if ext == ".nii.gz":
                out_json = out_nii.with_suffix("").with_suffix(".json")
            else:
                out_json = out_nii.with_suffix(".json")
            shutil.copy2(sidecar, out_json)
            _scrub_json_sidecar(out_json)

    _append_log(log_write, f"[bids] subject {sub_id} organized")

# -----------------------
# Public function (called by jobs.py)
# -----------------------

def convert_to_bids(input_type: str, input_dir: Path, bids_out: Path, log_write) -> None:
    """
    Best-effort AfNIA conversion pipeline:
      - input_type=dicom: dcm2niix -> organize into BIDS folders
      - input_type=nifti: collect nifti -> organize into BIDS folders
      - scrub common PHI fields from JSON
      - create dataset_description + participants.tsv
    Supports single-subject or multi-subject zips.
    """
    input_type = input_type.lower().strip()
    if input_type not in ("dicom", "nifti"):
        raise ValueError("input_type must be 'dicom' or 'nifti'")

    _append_log(log_write, f"[converter] input_type={input_type}")
    _append_log(log_write, f"[converter] input_dir={input_dir}")
    _append_log(log_write, f"[converter] bids_out={bids_out}")

    _ensure_bids_root(bids_out, dataset_name="AfNIA Upload")

    subjects = _detect_subject_dirs(input_dir)
    subject_ids = [sid for sid, _ in subjects]
    _update_participants(bids_out, subject_ids)

    # keep raw intermediate outputs in sourcedata for traceability
    sourcedata_root = bids_out / "sourcedata"
    _safe_mkdir(sourcedata_root)

    for sub_id, sub_path in subjects:
        _append_log(log_write, f"[converter] processing {sub_id} from {sub_path}")

        tmp_nifti = sourcedata_root / sub_id / "nifti_tmp"
        if tmp_nifti.exists():
            shutil.rmtree(tmp_nifti)
        _safe_mkdir(tmp_nifti)

        if input_type == "dicom":
            _append_log(log_write, f"[converter] running dcm2niix for {sub_id}")
            _dicom_to_nifti(sub_path, tmp_nifti, log_write)
            _append_log(log_write, f"[converter] organizing NIfTI outputs for {sub_id}")
            _organize_nifti_to_bids(sub_id, tmp_nifti, bids_out, log_write)
        else:
            # NIfTI mode: find niftis anywhere under subject folder and copy them into tmp_nifti
            niftis = list(sub_path.rglob("*.nii")) + list(sub_path.rglob("*.nii.gz"))
            if not niftis:
                raise RuntimeError(f"No NIfTI files found under {sub_path}")

            for nii in niftis:
                shutil.copy2(nii, tmp_nifti / nii.name)
                # copy JSON sidecar if present
                if nii.name.endswith(".nii.gz"):
                    js = nii.with_suffix("").with_suffix(".json")
                else:
                    js = nii.with_suffix(".json")
                if js.exists():
                    shutil.copy2(js, tmp_nifti / js.name)

            _append_log(log_write, f"[converter] organizing NIfTI uploads for {sub_id}")
            _organize_nifti_to_bids(sub_id, tmp_nifti, bids_out, log_write)

    _append_log(log_write, "[converter] done")

