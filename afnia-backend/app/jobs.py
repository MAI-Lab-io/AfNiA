import json
import threading
import traceback
import uuid
import zipfile
import subprocess
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Callable, Optional

from .config import JOBS_DIR
from .utils import write_json, read_json
from .converter import convert_to_bids
from .preflight import preflight_filter
from .anonymize_dicom import anonymize_dicom_tree
from .anonymize_nifti import anonymize_nifti_tree
from .deface import deface_bids
from .registrations import set_registration_status, get_registration


def now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


def job_dir(job_id: str) -> Path:
    return JOBS_DIR / job_id


def status_path(job_id: str) -> Path:
    return job_dir(job_id) / "status.json"


def logs_path(job_id: str) -> Path:
    return job_dir(job_id) / "logs.txt"


def append_log(job_id: str, line: str) -> None:
    p = logs_path(job_id)
    p.parent.mkdir(parents=True, exist_ok=True)
    with p.open("a", encoding="utf-8") as f:
        f.write(line.rstrip() + "\n")


def create_job(input_type: str, owner_email: str, registration_id: Optional[str] = None) -> str:
    job_id = str(uuid.uuid4())
    jd = job_dir(job_id)
    jd.mkdir(parents=True, exist_ok=True)

    write_json(
        status_path(job_id),
        {
            "job_id": job_id,
            "owner_email": owner_email.strip().lower(),
            "registration_id": registration_id,
            "input_type": input_type,
            "status": "queued",
            "progress": 0,
            "created_at": now_iso(),
            "updated_at": now_iso(),
            "error": None,
            "output": None,
            "preflight": None,
            "anonymize": None,
            "deface": None,
            "validation": None,
        },
    )
    append_log(
        job_id,
        f"[job] created job {job_id} owner={owner_email} registration_id={registration_id}",
    )
    return job_id


def update_job(job_id: str, patch: Dict[str, Any]) -> None:
    s = read_json(status_path(job_id))
    s.update(patch)
    s["updated_at"] = now_iso()
    write_json(status_path(job_id), s)


def extract_zip(zip_path: Path, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path, "r") as z:
        z.extractall(out_dir)


def _try_run(cmd: list[str], timeout_sec: int = 600) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout_sec)


def run_bids_validator(bids_dir: Path, log_write: Callable[[str], None]) -> dict:
    candidates = [
        ["bids-validator", str(bids_dir), "--json"],
        ["npx", "bids-validator", str(bids_dir), "--json"],
    ]

    for cmd in candidates:
        try:
            log_write(f"[validator] running: {' '.join(cmd)}")
            proc = _try_run(cmd, timeout_sec=1200)

            out = (proc.stdout or "").strip()
            err = (proc.stderr or "").strip()

            report: dict
            if out:
                try:
                    report = json.loads(out)
                except Exception:
                    report = {"raw_stdout": out}
            else:
                report = {"raw_stdout": ""}

            if err:
                report["stderr"] = err

            report["returncode"] = proc.returncode
            report["command"] = cmd

            return {"ran": True, "report": report}

        except FileNotFoundError:
            continue
        except subprocess.TimeoutExpired:
            return {"ran": False, "skipped_reason": "bids-validator timeout"}
        except Exception as e:
            return {"ran": False, "skipped_reason": f"validator error: {e}"}

    return {"ran": False, "skipped_reason": "bids-validator not installed (and npx not available)"}


def _safe_update_registration_status(
    registration_id: Optional[str],
    status: str,
    log_write: Callable[[str], None],
) -> None:
    if not registration_id:
        return

    try:
        set_registration_status(registration_id, status)
        log_write(f"[registration] status updated -> {status}")
    except Exception as e:
        log_write(f"[registration] failed to update status to {status}: {e}")


def run_job(job_id: str) -> None:
    jd = job_dir(job_id)
    zip_path = jd / "upload.zip"
    input_dir = jd / "input"
    anon_dir = jd / "input_anonymized"
    bids_out = jd / "bids"

    try:
        s = read_json(status_path(job_id))
        input_type = (s.get("input_type") or "").strip().lower()
        registration_id = s.get("registration_id")

        if input_type not in ("dicom", "nifti", "mixed", "bids"):
            input_type = "mixed"

        def log_write(line: str):
            append_log(job_id, line)

        update_job(job_id, {"status": "running", "progress": 5})
        _safe_update_registration_status(registration_id, "processing", log_write)
        log_write("[job] extracting upload.zip")

        if not zip_path.exists():
            raise RuntimeError("upload.zip missing")

        for d in (input_dir, anon_dir, bids_out):
            if d.exists():
                shutil.rmtree(d, ignore_errors=True)

        extract_zip(zip_path, input_dir)

        log_write("[job] writing MANIFEST.txt")
        manifest = input_dir / "MANIFEST.txt"
        items = sorted(
            [str(p.relative_to(input_dir)) for p in input_dir.rglob("*") if p.is_file()]
        )
        manifest.write_text("\n".join(items) + "\n", encoding="utf-8")

        update_job(job_id, {"progress": 12})
        log_write("[job] preflight: removing bad files")

        report = preflight_filter(
            input_dir=input_dir,
            input_type=input_type,
            log_write=log_write,
        )
        write_json(jd / "preflight_report.json", report)
        update_job(job_id, {"preflight": report, "progress": 18})
        log_write(
            f"[job] preflight done: kept={report.get('kept_files')} removed={report.get('removed_count')}"
        )

        update_job(job_id, {"progress": 22})
        log_write("[job] anonymizing input (removing PHI)")

        anon_dir.mkdir(parents=True, exist_ok=True)
        anonymize_report: Dict[str, Any] = {}

        if input_type in ("dicom", "mixed"):
            anonymize_report["dicom"] = anonymize_dicom_tree(
                input_dir,
                anon_dir,
                log_write=log_write,
            )

        if input_type in ("nifti", "mixed"):
            anonymize_report["nifti"] = anonymize_nifti_tree(
                input_dir,
                anon_dir,
                log_write=log_write,
            )

        if input_type == "bids":
            # BIDS already structured; copy input forward before optional defacing/validation
            shutil.copytree(input_dir, anon_dir, dirs_exist_ok=True)
            anonymize_report["bids"] = {
                "ran": False,
                "note": "Input declared as BIDS; no anonymization step applied automatically",
            }

        write_json(jd / "anonymize_report.json", anonymize_report)
        update_job(job_id, {"anonymize": anonymize_report})
        log_write("[job] anonymize done")

        update_job(job_id, {"progress": 25})
        log_write("[job] starting conversion to BIDS (using anonymized input)")

        if input_type == "bids":
            shutil.copytree(anon_dir, bids_out, dirs_exist_ok=True)
            log_write("[job] input already BIDS; copied to output")
        else:
            convert_to_bids(
                input_type=input_type,
                input_dir=anon_dir,
                bids_out=bids_out,
                log_write=log_write,
            )

        update_job(job_id, {"progress": 82})
        log_write("[job] defacing anatomical images (optional)")
        deface_report = deface_bids(bids_out, log_write=log_write)
        write_json(jd / "deface_report.json", deface_report)
        update_job(job_id, {"deface": deface_report})

        update_job(job_id, {"progress": 85})
        log_write("[job] running BIDS validator")
        validation = run_bids_validator(bids_out, log_write=log_write)
        update_job(job_id, {"validation": validation})

        update_job(
            job_id,
            {
                "status": "succeeded",
                "progress": 100,
                "output": {"bids_dir": str(bids_out)},
            },
        )
        log_write("[job] succeeded")

        # Keep registration in processing until explicit publish step,
        # or change this to "published" later when you automate publishing.
        if registration_id:
            try:
                current_reg = get_registration(registration_id)
                if current_reg.get("status") == "processing":
                    log_write("[registration] processing complete; awaiting publish step")
            except Exception as e:
                log_write(f"[registration] unable to re-read registration: {e}")

    except Exception as e:
        tb = traceback.format_exc()
        append_log(job_id, "[job] FAILED")
        append_log(job_id, tb)
        update_job(job_id, {"status": "failed", "error": str(e), "progress": 100})

        try:
            s = read_json(status_path(job_id))
            registration_id = s.get("registration_id")
        except Exception:
            registration_id = None

        if registration_id:
            try:
                set_registration_status(registration_id, "failed")
                append_log(job_id, "[registration] status updated -> failed")
            except Exception as reg_err:
                append_log(job_id, f"[registration] failed to update status -> failed: {reg_err}")


def start_job(job_id: str) -> None:
    t = threading.Thread(target=run_job, args=(job_id,), daemon=True)
    t.start()