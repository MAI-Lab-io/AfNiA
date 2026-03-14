from __future__ import annotations

from pathlib import Path
import shutil
import os
import json
import uuid

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse, JSONResponse
from pydantic import BaseModel, Field
from urllib.parse import urlencode
from typing import List, Optional
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ENV_PATH)

from .mailer import send_admin_application_email
from .auth import get_current_user
from .contributors import (
    is_approved,
    get_contributor,
    create_application,
    set_status,
    generate_approval_token,
    verify_approval_token,
)
from .jobs import create_job, start_job, job_dir, status_path, logs_path
from .utils import read_json, write_json
from .datasets import (
    list_datasets,
    get_dataset,
    publish_dataset_from_job,
    find_dataset_by_registration,
)
from .registrations import (
    create_registration,
    get_registration,
    list_registrations_by_owner,
    can_upload_files,
)
from .profiles import get_profile, upsert_profile

app = FastAPI(title="AfNIA Backend")

from .admin import router as admin_router
app.include_router(admin_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


AFNIA_DATA_DIR = Path("afnia_data")
REG_UPLOADS_DIR = AFNIA_DATA_DIR / "registration_uploads"
REG_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


@app.get("/api/health")
def health():
    return {"ok": True}


def get_contributor_status(email: str) -> str:
    try:
        c = get_contributor(email)
        return c.get("status", "none")
    except FileNotFoundError:
        return "none"


def require_approved_contributor(email: str) -> None:
    if not is_approved(email):
        st = get_contributor_status(email)
        raise HTTPException(
            status_code=403,
            detail=f"Not approved to upload (status={st})",
        )


def save_registration_support_file(
    reg_id: str,
    kind: str,
    upload: UploadFile,
) -> str:
    ext = Path(upload.filename or "").suffix.lower()
    reg_dir = REG_UPLOADS_DIR / reg_id
    reg_dir.mkdir(parents=True, exist_ok=True)

    safe_name = f"{kind}{ext if ext else ''}"
    out_path = reg_dir / safe_name

    with out_path.open("wb") as f:
        while True:
            chunk = upload.file.read(1024 * 1024)
            if not chunk:
                break
            f.write(chunk)

    return str(out_path)


# -----------------------------
# Auth + contributor workflow
# -----------------------------
@app.get("/api/me")
def me(user: dict = Depends(get_current_user)):
    email = user["email"]
    return {
        "signed_in": True,
        "user": {"email": email, "is_admin": user.get("is_admin", False)},
        "contributor_status": get_contributor_status(email),
    }


class ContributeApplyRequest(BaseModel):
    institution: str = Field(..., min_length=2)
    country: str = Field(..., min_length=2)
    message: str = Field(..., min_length=10)


@app.post("/api/contributor/apply")
def apply_to_contribute(req: ContributeApplyRequest, user: dict = Depends(get_current_user)):
    email = user["email"]

    profile = {
        "institution": req.institution,
        "country": req.country,
        "message": req.message,
    }

    data = create_application(email, profile)

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    backend_url = os.getenv("BACKEND_URL", "http://127.0.0.1:8001").rstrip("/")

    approve_token = generate_approval_token(email, "approve")
    reject_token = generate_approval_token(email, "reject")

    redirect_url = f"{frontend_url}/contribute"

    approve_link = f"{backend_url}/api/admin/contributors/decision?" + urlencode(
        {"token": approve_token, "redirect": redirect_url}
    )
    reject_link = f"{backend_url}/api/admin/contributors/decision?" + urlencode(
        {"token": reject_token, "redirect": redirect_url}
    )

    admin_email = os.getenv("ADMIN_EMAIL")
    if not admin_email:
        raise HTTPException(status_code=500, detail="ADMIN_EMAIL not configured")

    send_admin_application_email(
        to_email=admin_email,
        applicant_email=email,
        institution=req.institution,
        country=req.country,
        message=req.message,
        approve_link=approve_link,
        reject_link=reject_link,
    )

    return {"ok": True, "contributor_status": data["status"]}


@app.post("/api/admin/contributors/{email}/approve")
def admin_approve(email: str):
    email = email.strip().lower()
    return set_status(email, "approved")


@app.post("/api/admin/contributors/{email}/reject")
def admin_reject(email: str):
    email = email.strip().lower()
    return set_status(email, "rejected")


@app.get("/api/contributor/me")
def contributor_me(user: dict = Depends(get_current_user)):
    email = user["email"]
    try:
        return get_contributor(email)
    except FileNotFoundError:
        return {"email": email, "status": "none", "profile": {}}


@app.get("/api/admin/contributors/decision")
def admin_decision(
    token: str = Query(...),
    redirect: str = Query(None),
):
    try:
        data = verify_approval_token(token)
        email = data["email"]
        action = data["action"]
    except ValueError as e:
        return JSONResponse(status_code=400, content={"ok": False, "error": str(e)})

    new_status = "approved" if action == "approve" else "rejected"
    set_status(email, new_status)

    if redirect:
        return RedirectResponse(
            url=f"{redirect}?adminDecision={new_status}&email={email}",
            status_code=302,
        )

    return {"ok": True, "email": email, "status": new_status}


# -----------------------------
# Profile
# -----------------------------
class ProfileRequest(BaseModel):
    fullName: Optional[str] = ""
    institution: str = Field(..., min_length=2)
    country: str = Field(..., min_length=2)
    department: Optional[str] = ""
    role: Optional[str] = ""
    orcid: Optional[str] = ""


@app.get("/api/profile/me")
def profile_me(user: dict = Depends(get_current_user)):
    email = user["email"]
    try:
        return {"ok": True, "profile": get_profile(email)}
    except FileNotFoundError:
        return {"ok": True, "profile": None}


@app.post("/api/profile/me")
def profile_update(req: ProfileRequest, user: dict = Depends(get_current_user)):
    email = user["email"]
    prof = upsert_profile(email, req.model_dump())
    return {"ok": True, "profile": prof}


# -----------------------------
# Dataset registration (Step 1)
# -----------------------------
@app.post("/api/datasets/register")
async def register_dataset(
    title: str = Form(...),
    description: str = Form(""),
    modality: str = Form(""),
    accessType: str = Form("Open"),
    input_type: str = Form("mixed"),
    doi: str = Form(""),
    species: str = Form(""),
    studyType: str = Form(""),
    domainStudied: str = Form(""),
    numberOfTrials: str = Form(""),
    studyDesign: str = Form(""),
    papersPublished: str = Form(""),
    participantCount: str = Form(""),
    diagnosis: str = Form(""),
    ethicsApproved: str = Form(""),
    grantFunderName: str = Form(""),
    grantIdentifier: str = Form(""),
    ethics_document: UploadFile = File(...),
    diagnostic_metadata: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    email = user["email"]

    try:
        prof = get_profile(email)
    except FileNotFoundError:
        raise HTTPException(status_code=400, detail="Please complete your Profile first.")

    reg_id = str(uuid.uuid4())

    ethics_path = save_registration_support_file(reg_id, "ethics_document", ethics_document)
    diagnostic_path = save_registration_support_file(
        reg_id,
        "diagnostic_metadata",
        diagnostic_metadata,
    )

    modality_list = [m.strip() for m in modality.split(",") if m.strip()]

    payload = {
        "title": title,
        "description": description,
        "modality": modality_list,
        "accessType": accessType,
        "input_type": input_type,
        "doi": doi,
        "species": species,
        "studyType": studyType,
        "domainStudied": domainStudied,
        "numberOfTrials": numberOfTrials,
        "studyDesign": studyDesign,
        "papersPublished": papersPublished,
        "participantCount": participantCount,
        "diagnosis": diagnosis,
        "ethicsApproved": ethicsApproved,
        "grantFunderName": grantFunderName,
        "grantIdentifier": grantIdentifier,
        "profile": {
            "institution": prof.get("institution", ""),
            "country": prof.get("country", ""),
            "fullName": prof.get("fullName", ""),
            "orcid": prof.get("orcid", ""),
            "department": prof.get("department", ""),
            "role": prof.get("role", ""),
        },
    }

    reg = create_registration(
        owner_email=email,
        payload=payload,
        ethics_document_path=ethics_path,
        diagnostic_metadata_path=diagnostic_path,
        status="pending_review",
    )

    backend_url = os.getenv("BACKEND_URL", "http://127.0.0.1:8001").rstrip("/")
    admin_email = os.getenv("ADMIN_EMAIL")
    if not admin_email:
        raise HTTPException(status_code=500, detail="ADMIN_EMAIL not configured")

    approve_link = f"{backend_url}/api/admin/submissions/{reg['reg_id']}/approve"
    reject_link = f"{backend_url}/api/admin/submissions/{reg['reg_id']}/reject"

    send_admin_application_email(
        to_email=admin_email,
        applicant_email=email,
        institution=payload["profile"]["institution"],
        country=payload["profile"]["country"],
        message=(
            "DATASET REGISTRATION REVIEW\n\n"
            f"Title: {title}\n"
            f"Input type: {input_type}\n"
            f"Access: {accessType}\n"
            f"Diagnosis: {diagnosis}\n"
            f"Participants: {participantCount}\n"
            f"DOI: {doi}\n\n"
            f"{description}\n"
        ),
        approve_link=approve_link,
        reject_link=reject_link,
    )

    return {"ok": True, "registration": reg}


@app.get("/api/registrations/{reg_id}")
def registration_detail(reg_id: str, user: dict = Depends(get_current_user)):
    email = user["email"]

    try:
        reg = get_registration(reg_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="registration not found")

    if reg.get("owner_email") != email:
        raise HTTPException(status_code=403, detail="Not allowed")

    return reg


@app.get("/api/registrations/me")
def my_registrations(user: dict = Depends(get_current_user)):
    email = user["email"].strip().lower()
    regs = list_registrations_by_owner(email)
    return {"ok": True, "registrations": regs}


@app.get("/api/my/datasets")
def my_datasets(user: dict = Depends(get_current_user)):
    email = user["email"].strip().lower()
    regs = list_registrations_by_owner(email)

    datasets = []
    for reg in regs:
        payload = reg.get("payload", {})
        published = find_dataset_by_registration(reg["reg_id"])

        datasets.append(
            {
                "id": reg["reg_id"],
                "title": payload.get("title", "Untitled Dataset"),
                "status": reg.get("status", "draft"),
                "accessType": payload.get("accessType", "Open"),
                "participantCount": int(payload.get("participantCount") or 0),
                "modality": payload.get("modality", []),
                "diagnosis": payload.get("diagnosis", ""),
                "createdAt": reg.get("created_at"),
                "doi": (published or {}).get("extra", {}).get("doi")
                or payload.get("doi", ""),
                "viewCount": (published or {}).get("view_count", 0),
                "downloadCount": (published or {}).get("download_count", 0),
                "citationCount": (published or {}).get("citation_count", 0),
                "admin_note": reg.get("admin_note"),
                "dataset_id": (published or {}).get("dataset_id"),
                "published": bool(published),
            }
        )

    return {"ok": True, "datasets": datasets}


# -----------------------------
# Upload + Jobs (Step 2)
# -----------------------------
@app.post("/api/upload")
async def upload_dataset(
    registration_id: str = Form(...),
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    email = user["email"]

    require_approved_contributor(email)

    try:
        reg = get_registration(registration_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Registration not found")

    if reg.get("owner_email") != email:
        raise HTTPException(status_code=403, detail="Not allowed")

    if not can_upload_files(registration_id):
        raise HTTPException(
            status_code=403,
            detail=f"Admin approval required before upload (status={reg.get('status')})",
        )

    input_type = (reg.get("payload", {}).get("input_type") or "mixed").strip().lower()
    if input_type not in ("dicom", "nifti", "mixed", "bids"):
        input_type = "mixed"

    job_id = create_job(
        input_type=input_type,
        owner_email=email,
        registration_id=registration_id,
    )
    jd = job_dir(job_id)

    upload_path = jd / "upload.zip"
    with upload_path.open("wb") as f:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            f.write(chunk)

    start_job(job_id)
    return {"job_id": job_id}


@app.get("/api/jobs/{job_id}")
def get_job_status(job_id: str, user: dict = Depends(get_current_user)):
    p = status_path(job_id)
    if not p.exists():
        raise HTTPException(status_code=404, detail="job not found")

    data = read_json(p)

    if data.get("owner_email") != user["email"]:
        raise HTTPException(status_code=403, detail="Not allowed")

    lp = logs_path(job_id)
    if lp.exists():
        lines = lp.read_text(encoding="utf-8").splitlines()
        data["logs_tail"] = lines[-200:]
    else:
        data["logs_tail"] = []

    return data


@app.get("/api/jobs/{job_id}/download")
def download_job_bids(job_id: str, user: dict = Depends(get_current_user)):
    p = status_path(job_id)
    if not p.exists():
        raise HTTPException(status_code=404, detail="job not found")

    data = read_json(p)

    if data.get("owner_email") != user["email"]:
        raise HTTPException(status_code=403, detail="Not allowed")

    if data.get("status") != "succeeded":
        raise HTTPException(status_code=400, detail="job not succeeded yet")

    bids_dir = Path(data["output"]["bids_dir"])
    if not bids_dir.exists():
        raise HTTPException(status_code=404, detail="bids output missing")

    jd = job_dir(job_id)
    zip_path = jd / "bids.zip"
    if zip_path.exists():
        zip_path.unlink()

    shutil.make_archive(str(zip_path.with_suffix("")), "zip", bids_dir)

    return FileResponse(
        path=str(zip_path),
        media_type="application/zip",
        filename=f"{job_id}_bids.zip",
    )


# ---------------------------
# Published datasets API
# ---------------------------
class PublishRequest(BaseModel):
    title: str
    authors: List[str]
    institution: Optional[str] = ""
    country: Optional[str] = ""
    description: Optional[str] = ""
    modality: List[str] = []
    accessType: str = "Open"
    agreed: bool = True
    defaceConfirmed: bool = False
    doi: Optional[str] = ""
    species: Optional[str] = ""
    studyType: Optional[str] = ""
    domainStudied: Optional[str] = ""
    numberOfTrials: Optional[str] = ""
    studyDesign: Optional[str] = ""
    papersPublished: Optional[str] = ""
    dxStatuses: Optional[List[str]] = None
    grantFunderName: Optional[str] = ""
    grantIdentifier: Optional[str] = ""


@app.post("/api/jobs/{job_id}/publish")
def publish_job(job_id: str, req: PublishRequest, user: dict = Depends(get_current_user)):
    require_approved_contributor(user["email"])

    if not req.agreed:
        raise HTTPException(status_code=400, detail="You must agree to the terms to publish.")

    p = status_path(job_id)
    if not p.exists():
        raise HTTPException(status_code=404, detail="job not found")

    job = read_json(p)

    if job.get("owner_email") != user["email"]:
        raise HTTPException(status_code=403, detail="Not allowed")

    if job.get("status") != "succeeded":
        raise HTTPException(status_code=400, detail="job not succeeded yet")

    job_bids_dir = Path(job["output"]["bids_dir"])
    if not job_bids_dir.exists():
        raise HTTPException(status_code=404, detail="job bids output missing")

    deface_ran = bool((job.get("deface") or {}).get("ran"))
    if not (req.defaceConfirmed or deface_ran):
        raise HTTPException(
            status_code=400,
            detail="Defacing not confirmed and deface did not run. Please confirm or enable defacing.",
        )

    registration_id = job.get("registration_id")

    meta = {
        "title": req.title,
        "authors": req.authors,
        "institution": req.institution or "",
        "country": req.country or "",
        "description": req.description or "",
        "modality": req.modality or [],
        "accessType": req.accessType or "Open",
        "uploader_email": user["email"],
        "registration_id": registration_id,
        "published": True,
        "extra": {
            "doi": req.doi or "",
            "species": req.species or "",
            "studyType": req.studyType or "",
            "domainStudied": req.domainStudied or "",
            "numberOfTrials": req.numberOfTrials or "",
            "studyDesign": req.studyDesign or "",
            "papersPublished": req.papersPublished or "",
            "dxStatuses": req.dxStatuses or [],
            "grantFunderName": req.grantFunderName or "",
            "grantIdentifier": req.grantIdentifier or "",
            "defaceConfirmed": bool(req.defaceConfirmed),
            "defaceRan": bool(deface_ran),
        },
    }

    return publish_dataset_from_job(job_id=job_id, job_bids_dir=job_bids_dir, meta=meta)


@app.get("/api/datasets")
def datasets_list():
    return list_datasets(published_only=True)


@app.get("/api/datasets/{dataset_id}")
def dataset_detail(dataset_id: str):
    try:
        return get_dataset(dataset_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="dataset not found")


@app.get("/api/datasets/{dataset_id}/download")
def download_dataset(dataset_id: str):
    try:
        meta = get_dataset(dataset_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="dataset not found")

    ds_id = meta["dataset_id"]
    ds_dir = Path("afnia_data") / "datasets" / ds_id / "bids"
    if not ds_dir.exists():
        raise HTTPException(status_code=404, detail="dataset bids folder missing")

    zip_path = Path("afnia_data") / "datasets" / ds_id / "dataset.zip"
    if zip_path.exists():
        zip_path.unlink()

    shutil.make_archive(str(zip_path.with_suffix("")), "zip", ds_dir)

    return FileResponse(
        path=str(zip_path),
        media_type="application/zip",
        filename=f"{ds_id}.zip",
    )