import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { apiGet, apiPostForm } from "../lib/api";

type User = {
  id: string;
  email?: string | null;
  isAdmin?: boolean;
} | null;

type Profile = {
  fullName?: string;
  institution: string;
  country: string;
  department?: string;
  role?: string;
  orcid?: string;
};

type RegistrationStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "uploading"
  | "processing"
  | "published"
  | "archived";

type Registration = {
  reg_id: string;
  status: RegistrationStatus;
  payload?: any;
  admin_note?: string | null;
  created_at?: string;
};

type JobStatus = {
  job_id: string;
  status: "queued" | "running" | "succeeded" | "failed";
  progress: number;
  error?: string | null;
  logs_tail?: string[];
};

interface UploadPageProps {
  onNavigate: (page: string) => void;
  onOpenAuth: () => void;
  user: User;
}

const LS_REG_KEY = "afnia_last_registration_id";

export function UploadPage({ onNavigate, onOpenAuth, user }: UploadPageProps) {
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [registration, setRegistration] = useState<Registration | null>(null);
  const [regSaving, setRegSaving] = useState(false);
  const [regRefreshing, setRegRefreshing] = useState(false);

  const [datasetZip, setDatasetZip] = useState<File | null>(null);
  const [ethicsFile, setEthicsFile] = useState<File | null>(null);
  const [diagnosticFile, setDiagnosticFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [job, setJob] = useState<JobStatus | null>(null);
  const [polling, setPolling] = useState(false);

  const [regForm, setRegForm] = useState({
    title: "",
    description: "",
    modality: "",
    accessType: "Open",
    input_type: "mixed",
    doi: "",
    studyType: "",
    participantCount: "",
    diagnosis: "",
    ethicsApproved: "yes",
    institution: "",
    country: "",
  });

  const canUpload = useMemo(
    () => registration?.status === "approved",
    [registration?.status]
  );

  const set =
    (k: keyof typeof regForm) =>
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) =>
      setRegForm((p) => ({ ...p, [k]: e.target.value }));

  async function loadProfile() {
    setProfileLoading(true);
    setError(null);

    try {
      const res = await apiGet<{ ok: boolean; profile: Profile | null }>(
        "/api/profile/me"
      );
      setProfile(res.profile || null);

      if (res.profile) {
        setRegForm((prev) => ({
          ...prev,
          institution: res.profile?.institution || "",
          country: res.profile?.country || "",
        }));
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load profile");
    } finally {
      setProfileLoading(false);
    }
  }

  async function refreshRegistration(reg_id: string) {
    setRegRefreshing(true);
    setError(null);

    try {
      const reg = await apiGet<Registration>(`/api/registrations/${reg_id}`);
      setRegistration(reg);
    } catch (e: any) {
      setError(e?.message || "Could not refresh registration");
    } finally {
      setRegRefreshing(false);
    }
  }

  async function submitStepOne() {
    setError(null);

    if (!profile) {
      setError("Please complete your profile first.");
      return;
    }

    if (!regForm.title.trim()) {
      setError("Dataset title is required.");
      return;
    }

    if (!ethicsFile) {
      setError("Please upload the ethics document.");
      return;
    }

    if (!diagnosticFile) {
      setError("Please upload the diagnostic metadata file.");
      return;
    }

    setRegSaving(true);

    try {
      const form = new FormData();
      Object.entries(regForm).forEach(([key, value]) => {
        form.append(key, value ?? "");
      });

      form.append("ethics_document", ethicsFile);
      form.append("diagnostic_metadata", diagnosticFile);
      form.append("status", "pending_review");

      const res = await apiPostForm<{ ok: boolean; registration: Registration }>(
        "/api/datasets/register",
        form
      );

      setRegistration(res.registration);
      localStorage.setItem(LS_REG_KEY, res.registration.reg_id);
    } catch (e: any) {
      setError(e?.message || "Failed to submit dataset information");
    } finally {
      setRegSaving(false);
    }
  }

  async function uploadDatasetZip() {
    if (!registration?.reg_id) {
      setError("Please complete Step 1 first.");
      return;
    }

    if (registration.status !== "approved") {
      setError("Admin approval is required before dataset file upload.");
      return;
    }

    if (!datasetZip) {
      setError("Please choose the dataset ZIP file.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("registration_id", registration.reg_id);
      form.append("file", datasetZip);

      const res = await apiPostForm<{ job_id: string }>("/api/upload", form);
      await startPolling(res.job_id);
    } catch (e: any) {
      setError(e?.message || "Dataset upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function startPolling(job_id: string) {
    setPolling(true);
    setJob(null);

    const poll = async () => {
      try {
        const st = await apiGet<JobStatus>(`/api/jobs/${job_id}`);
        setJob(st);

        if (st.status === "succeeded" || st.status === "failed") {
          setPolling(false);
          return;
        }

        setTimeout(poll, 1500);
      } catch (e: any) {
        setError(e?.message || "Polling failed");
        setPolling(false);
      }
    };

    poll();
  }

  useEffect(() => {
    setRegistration(null);
    setDatasetZip(null);
    setEthicsFile(null);
    setDiagnosticFile(null);
    setJob(null);
    setPolling(false);
    setError(null);

    if (!user) return;

    loadProfile();

    const last = localStorage.getItem(LS_REG_KEY);
    if (last) {
      refreshRegistration(last);
    }
  }, [user?.id]);

  function renderStatusBadge(status?: RegistrationStatus) {
    if (!status) return null;

    const styles: Record<RegistrationStatus, string> = {
      draft: "bg-gray-100 text-gray-700",
      pending_review: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      uploading: "bg-blue-100 text-blue-700",
      processing: "bg-indigo-100 text-indigo-700",
      published: "bg-emerald-100 text-emerald-700",
      archived: "bg-gray-200 text-gray-700",
    };

    return <Badge className={styles[status]}>{status.replace("_", " ")}</Badge>;
  }

  if (!user) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h2 className="text-2xl font-semibold mb-4">Sign in required</h2>
        <Button onClick={onOpenAuth}>Sign in</Button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Upload Dataset</h1>
          <p className="text-muted-foreground">
            Step 1 must be reviewed and approved by an admin before Step 2 is unlocked.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded border text-red-600 bg-white mb-6">
            {error}
          </div>
        )}

        <Card className="p-6 mb-6 rounded-2xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Contributor Profile</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your institution profile is attached to this submission.
              </p>
              {profileLoading ? (
                <p className="mt-2 text-sm">Loading profile...</p>
              ) : profile ? (
                <p className="mt-2 text-sm">
                  <b>{profile.institution}</b>, {profile.country}
                </p>
              ) : (
                <p className="mt-2 text-sm text-red-600">
                  Profile not completed yet.
                </p>
              )}
            </div>

            <Button variant="outline" onClick={() => onNavigate("profile")}>
              Edit Profile
            </Button>
          </div>
        </Card>

        <Card className="p-6 mb-6 rounded-2xl">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-semibold">
                Step 1 — Dataset Information & Supporting Documents
              </h2>
              <p className="text-sm text-muted-foreground">
                Submit metadata, ethics approval, and diagnostic information for admin review.
              </p>
            </div>

            {registration?.status && renderStatusBadge(registration.status)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Dataset title *</label>
              <input
                className="w-full border rounded p-2"
                value={regForm.title}
                onChange={set("title")}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Access type</label>
              <select
                className="w-full border rounded p-2"
                value={regForm.accessType}
                onChange={set("accessType")}
              >
                <option value="Open">Open</option>
                <option value="Restricted">Restricted</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Input type</label>
              <select
                className="w-full border rounded p-2"
                value={regForm.input_type}
                onChange={set("input_type")}
              >
                <option value="mixed">Mixed</option>
                <option value="dicom">DICOM</option>
                <option value="nifti">NIfTI</option>
                <option value="bids">BIDS</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Participants count</label>
              <input
                className="w-full border rounded p-2"
                value={regForm.participantCount}
                onChange={set("participantCount")}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Study type</label>
              <input
                className="w-full border rounded p-2"
                value={regForm.studyType}
                onChange={set("studyType")}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Diagnosis</label>
              <input
                className="w-full border rounded p-2"
                value={regForm.diagnosis}
                onChange={set("diagnosis")}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Modality</label>
              <input
                className="w-full border rounded p-2"
                placeholder="e.g. MRI, CT, PET"
                value={regForm.modality}
                onChange={set("modality")}
              />
            </div>

            <div>
              <label className="text-sm font-medium">DOI (optional)</label>
              <input
                className="w-full border rounded p-2"
                value={regForm.doi}
                onChange={set("doi")}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Ethics approved?</label>
              <select
                className="w-full border rounded p-2"
                value={regForm.ethicsApproved}
                onChange={set("ethicsApproved")}
              >
                <option value="yes">Yes</option>
                <option value="pending">Pending</option>
                <option value="no">No</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Institution</label>
              <input
                className="w-full border rounded p-2 bg-gray-50"
                value={regForm.institution}
                readOnly
              />
            </div>

            <div>
              <label className="text-sm font-medium">Country</label>
              <input
                className="w-full border rounded p-2 bg-gray-50"
                value={regForm.country}
                readOnly
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="w-full border rounded p-2"
                rows={5}
                value={regForm.description}
                onChange={set("description")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <label className="text-sm font-medium">
                Ethics document * (PDF or DOCX)
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setEthicsFile(e.target.files?.[0] || null)}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Diagnostic metadata * (CSV / TSV / XLSX)
              </label>
              <input
                type="file"
                accept=".csv,.tsv,.xlsx"
                onChange={(e) => setDiagnosticFile(e.target.files?.[0] || null)}
                className="w-full"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3 items-center flex-wrap">
            <Button onClick={submitStepOne} disabled={regSaving}>
              {regSaving ? "Submitting..." : "Submit for Admin Review"}
            </Button>

            {registration?.reg_id && (
              <Button
                variant="outline"
                onClick={() => refreshRegistration(registration.reg_id)}
                disabled={regRefreshing}
              >
                {regRefreshing ? "Refreshing..." : "Refresh Status"}
              </Button>
            )}

            {registration?.reg_id && (
              <span className="text-sm text-muted-foreground">
                Submission ID: <b>{registration.reg_id}</b>
              </span>
            )}
          </div>

          {registration?.status === "pending_review" && (
            <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
              Your submission is awaiting admin approval. Dataset file upload is locked until approval is granted.
            </div>
          )}

          {registration?.status === "approved" && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              Approved. You can now proceed to Step 2 and upload your dataset files.
            </div>
          )}

          {registration?.status === "rejected" && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              This submission was rejected.
              {registration.admin_note ? (
                <div className="mt-2">
                  <b>Admin note:</b> {registration.admin_note}
                </div>
              ) : null}
            </div>
          )}
        </Card>

        <Card className="p-6 mb-6 rounded-2xl">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">
              Step 2 — Upload Dataset Files
            </h2>
            <p className="text-sm text-muted-foreground">
              This step unlocks only after admin approval.
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <input
              type="file"
              accept=".zip"
              onChange={(e) => setDatasetZip(e.target.files?.[0] || null)}
              disabled={!canUpload}
            />

            <Button onClick={uploadDatasetZip} disabled={!canUpload || uploading}>
              {uploading ? "Uploading..." : "Upload Dataset ZIP"}
            </Button>
          </div>

          {!registration?.reg_id ? (
            <p className="text-sm text-muted-foreground mt-3">
              Complete Step 1 first.
            </p>
          ) : registration.status === "pending_review" ? (
            <p className="text-sm text-yellow-700 mt-3">
              Waiting for admin approval before file upload is allowed.
            </p>
          ) : registration.status === "rejected" ? (
            <p className="text-sm text-red-600 mt-3">
              Your submission was rejected. Update Step 1 and resubmit.
            </p>
          ) : registration.status === "approved" ? (
            <p className="text-sm text-green-700 mt-3">
              Approval received. You can upload your dataset ZIP.
            </p>
          ) : null}
        </Card>

        <Card className="p-6 rounded-2xl">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">Step 3 — Processing</h2>
            <p className="text-sm text-muted-foreground">
              Follow upload and preprocessing progress here.
            </p>
          </div>

          {job ? (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>
                  Status: <b>{job.status}</b>
                </span>
                <span>
                  Progress: <b>{job.progress}%</b>
                </span>
              </div>

              <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
                <div
                  className="h-2 bg-purple-600"
                  style={{ width: `${job.progress}%` }}
                />
              </div>

              {job.error && (
                <div className="text-red-600 mt-3 text-sm">{job.error}</div>
              )}

              {job.logs_tail?.length ? (
                <pre className="mt-4 text-xs bg-gray-50 border rounded p-3 max-h-64 overflow-auto">
                  {job.logs_tail.join("\n")}
                </pre>
              ) : null}

              {polling && (
                <p className="text-sm text-muted-foreground mt-3">Processing…</p>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No active processing job yet.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}