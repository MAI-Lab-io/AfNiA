from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import RedirectResponse

from .auth import require_admin
from .contributors import (
    set_status,
    verify_approval_token,
)
from .registrations import (
    get_registration,
    list_registrations,
    list_registrations_by_status,
    approve_registration,
    reject_registration,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])


# =========================================================
# Contributor approval routes
# =========================================================

@router.post("/contributors/{email}/approve")
def approve_contributor(email: str, _=Depends(require_admin)):
    set_status(email, "approved")
    return {"status": "approved", "email": email}


@router.post("/contributors/{email}/reject")
def reject_contributor(email: str, _=Depends(require_admin)):
    set_status(email, "rejected")
    return {"status": "rejected", "email": email}


@router.get("/contributors/decision")
def contributor_decision(token: str):
    """
    Email-click endpoint for contributor approval decisions.
    Redirects to frontend after action.
    """
    try:
        data = verify_approval_token(token)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    email = data["email"]
    action = data["action"]

    if action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="Invalid action")

    set_status(email, "approved" if action == "approve" else "rejected")

    return RedirectResponse(
        url=f"/admin?email={email}&status={action}",
        status_code=302,
    )


# =========================================================
# Dataset submission admin review routes
# =========================================================

@router.get("/submissions")
def admin_list_submissions(
    status: str | None = None,
    _=Depends(require_admin),
):
    """
    List all dataset submissions, optionally filtered by status.
    Example:
      GET /api/admin/submissions
      GET /api/admin/submissions?status=pending_review
    """
    try:
        if status:
            submissions = list_registrations_by_status(status)
        else:
            submissions = list_registrations()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "ok": True,
        "count": len(submissions),
        "submissions": submissions,
    }


@router.get("/submissions/{reg_id}")
def admin_get_submission(
    reg_id: str,
    _=Depends(require_admin),
):
    """
    Get a single dataset submission by registration ID.
    """
    try:
        submission = get_registration(reg_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Submission not found")

    return {
        "ok": True,
        "submission": submission,
    }


@router.post("/submissions/{reg_id}/approve")
def admin_approve_submission(
    reg_id: str,
    payload: dict = Body(default={}),
    _=Depends(require_admin),
):
    """
    Approve a dataset submission so contributor can upload dataset files.
    Optional body:
      { "admin_note": "Looks good" }
    """
    admin_note = (payload or {}).get("admin_note")

    try:
        updated = approve_registration(reg_id, admin_note=admin_note)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Submission not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "ok": True,
        "message": "Submission approved",
        "submission": updated,
    }


@router.post("/submissions/{reg_id}/reject")
def admin_reject_submission(
    reg_id: str,
    payload: dict = Body(...),
    _=Depends(require_admin),
):
    """
    Reject a dataset submission.
    Body:
      { "admin_note": "Missing signed ethics approval" }
    """
    admin_note = (payload or {}).get("admin_note", "").strip()

    if not admin_note:
        raise HTTPException(
            status_code=400,
            detail="admin_note is required when rejecting a submission",
        )

    try:
        updated = reject_registration(reg_id, admin_note=admin_note)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Submission not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "ok": True,
        "message": "Submission rejected",
        "submission": updated,
    }
