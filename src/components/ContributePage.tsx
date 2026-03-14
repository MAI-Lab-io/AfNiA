// src/components/ContributePage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle,
  Shield,
  HelpCircle,
  Download,
  FolderOpen,
  FileText,
  Users,
  Upload,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { ImageWithFallback } from "./figma/ImageWithFallback";

import { supabase } from "../lib/supabaseClient";
import { zipSync, strToU8 } from "fflate";

type ContributorStatus = "none" | "pending" | "approved" | "rejected";

type JobStatus = {
  job_id: string;
  input_type: "dicom" | "nifti" | "mixed";
  status: "queued" | "running" | "succeeded" | "failed";
  progress: number;
  error?: string | null;
  output?: { bids_dir?: string } | null;
  logs_tail?: string[];
  validation?: any;
  preflight?: any;
};

type AuthState = {
  signedIn: boolean;
  email: string | null;
  accessToken: string | null;
  contributorStatus: ContributorStatus;
};

interface ContributePageProps {
  onNavigate: (page: string) => void;
  onOpenAuth: () => void; // opens your email/password AuthDialog
}

type StepId = 1 | 2 | 3 | 4;

async function refreshMe(accessToken: string) {
  const r = await fetch("/api/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()) as {
    signed_in: boolean;
    user: { email: string };
    contributor_status: ContributorStatus;
  };
}

export function ContributePage({ onNavigate, onOpenAuth }: ContributePageProps) {
  // -------------------------
  // Auth (Supabase) — keep in sync, but DO NOT render sign-in/sign-out UI here.
  // Header handles auth UI.
  // -------------------------
  const [auth, setAuth] = useState<AuthState>({
    signedIn: false,
    email: null,
    accessToken: null,
    contributorStatus: "none",
  });

  // In-app notifications (replaces alert())
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const showSuccess = (text: string) => setNotice({ type: "success", text });
  const showError = (text: string) => setNotice({ type: "error", text });

  // keep auth in sync with Supabase session + backend /api/me
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token ?? null;
      const email = data.session?.user?.email ?? null;

      if (!token || !email) {
        if (!cancelled) {
          setAuth({
            signedIn: false,
            email: null,
            accessToken: null,
            contributorStatus: "none",
          });
        }
        return;
      }

      try {
        const me = await refreshMe(token);
        if (!cancelled) {
          setAuth({
            signedIn: true,
            email,
            accessToken: token,
            contributorStatus: me.contributor_status,
          });
        }
      } catch {
        if (!cancelled) {
          setAuth({
            signedIn: true,
            email,
            accessToken: token,
            contributorStatus: "none",
          });
        }
      }
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const token = session?.access_token ?? null;
      const email = session?.user?.email ?? null;

      if (!token || !email) {
        setAuth({
          signedIn: false,
          email: null,
          accessToken: null,
          contributorStatus: "none",
        });
        return;
      }

      try {
        const me = await refreshMe(token);
        setAuth({
          signedIn: true,
          email,
          accessToken: token,
          contributorStatus: me.contributor_status,
        });
      } catch {
        setAuth({
          signedIn: true,
          email,
          accessToken: token,
          contributorStatus: "none",
        });
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // -------------------------
  // Upload wizard state (only shown if approved)
  // -------------------------
  const [step, setStep] = useState<StepId>(1);
  const [inputType, setInputType] = useState<"dicom" | "nifti">("dicom");

  const [folderFiles, setFolderFiles] = useState<File[]>([]);
  const [folderName, setFolderName] = useState<string>("");

  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<JobStatus | null>(null);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<number | null>(null);

  // Metadata
  const [datasetTitle, setDatasetTitle] = useState("");
  const [institution, setInstitution] = useState("");
  const [country, setCountry] = useState("");
  const [authors, setAuthors] = useState("");
  const [description, setDescription] = useState("");

  // Terms
  const [agreed, setAgreed] = useState(false);

  // Application form
  const [applyInstitution, setApplyInstitution] = useState("");
  const [applyCountry, setApplyCountry] = useState("");
  const [applyMessage, setApplyMessage] = useState("");
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  const fetchJob = async (id: string) => {
    if (!auth.accessToken) throw new Error("Not signed in");

    const res = await fetch(`/api/jobs/${id}`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    });
    if (!res.ok) throw new Error(await res.text());

    const data = (await res.json()) as JobStatus;
    setJob(data);
    return data;
  };

  const startPolling = (id: string) => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }

    setPolling(true);
    fetchJob(id).catch(() => {});

    pollRef.current = window.setInterval(async () => {
      try {
        const data = await fetchJob(id);
        if (data.status === "succeeded" || data.status === "failed") {
          if (pollRef.current) {
            window.clearInterval(pollRef.current);
            pollRef.current = null;
          }
          setPolling(false);
          setStep(2);
        }
      } catch {
        // keep polling
      }
    }, 1500);
  };

  const onPickFolder = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setFolderFiles(files);

    const rel = (files[0] as any)?.webkitRelativePath || "";
    const top = rel.split("/")[0] || "";
    setFolderName(top || "selected-folder");
  };

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setFolderFiles(files);
    setFolderName("selected-files");
  };

  const buildZip = async (files: File[], zipName: string): Promise<File> => {
    const entries: Record<string, Uint8Array> = {};

    for (const f of files) {
      const relPath = (f as any).webkitRelativePath || f.name;
      const buf = new Uint8Array(await f.arrayBuffer());
      entries[relPath] = buf;
    }

    const manifest = files
      .map((f) => (f as any).webkitRelativePath || f.name)
      .sort()
      .join("\n");
    entries["MANIFEST.txt"] = strToU8(manifest + "\n");

    const zipped = zipSync(entries, { level: 6 });
    return new File([zipped], zipName, { type: "application/zip" });
  };

  const handleUpload = async () => {
    setNotice(null);

    if (!auth.signedIn || !auth.accessToken) {
      showError("Please sign in first.");
      onOpenAuth();
      return;
    }
    if (auth.contributorStatus !== "approved") {
      showError("You are not approved to upload yet. Please apply to contribute first.");
      return;
    }
    if (folderFiles.length === 0) {
      showError("Please select a folder or files first.");
      return;
    }

    setUploading(true);
    try {
      const zipFile = await buildZip(folderFiles, `${folderName || "upload"}.zip`);

      const fd = new FormData();
      fd.append("file", zipFile);
      fd.append("input_type", inputType);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });

      if (!res.ok) throw new Error(await res.text());

      const body = await res.json();
      const newJobId = body.job_id as string;

      setJobId(newJobId);
      setJob(null);
      startPolling(newJobId);
      setStep(2);

      showSuccess("Upload started. We’re converting & validating your dataset now.");
    } catch (e: any) {
      showError(e?.message ?? "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const downloadBidsZip = async () => {
    setNotice(null);

    if (!jobId || !auth.accessToken) return;

    try {
      const r = await fetch(`/api/jobs/${jobId}/download`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      if (!r.ok) throw new Error(await r.text());

      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${jobId}_bids.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      showSuccess("Download started.");
    } catch (e: any) {
      showError(e?.message ?? "Download failed.");
    }
  };

  const handlePublish = async () => {
    setNotice(null);

    if (!jobId) return;
    if (!agreed) {
      showError("Please accept the terms before publishing.");
      return;
    }
    if (!auth.accessToken) {
      showError("Please sign in first.");
      onOpenAuth();
      return;
    }

    try {
      const res = await fetch(`/api/jobs/${jobId}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({
          title: datasetTitle,
          institution,
          country,
          authors: authors
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          description,
          agreed,
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      showSuccess("Published! It will now show up in Explore Datasets.");
      onNavigate("explore");
    } catch (e: any) {
      showError(e?.message ?? "Publish failed.");
    }
  };

  const handleApplyToContribute = async () => {
    setNotice(null);

    if (!auth.accessToken) {
      showError("Please sign in first.");
      onOpenAuth();
      return;
    }

    const inst = applyInstitution.trim();
    const ctry = applyCountry.trim();
    const msg = applyMessage.trim();

    if (inst.length < 2) return showError("Institution name is too short.");
    if (ctry.length < 2) return showError("Country is too short.");
    if (msg.length < 10) return showError("Message should be at least 10 characters.");

    setApplying(true);
    try {
      const r = await fetch("/api/contributor/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({ institution: inst, country: ctry, message: msg }),
      });

      if (!r.ok) throw new Error(await r.text());

      // refresh contributor status from backend
      const me = await refreshMe(auth.accessToken);
      setAuth((prev) => ({ ...prev, contributorStatus: me.contributor_status }));

      showSuccess(
        "Application submitted successfully. Your status is now pending review. AfNIA admin will review and approve you."
      );

      setApplyInstitution("");
      setApplyCountry("");
      setApplyMessage("");
    } catch (e: any) {
      showError(e?.message ?? "Application failed.");
    } finally {
      setApplying(false);
    }
  };

  const progressPct = Math.min(Math.max(job?.progress ?? 0, 0), 100);

  const canGoToMetadata = job?.status === "succeeded";
  const canGoToTerms = canGoToMetadata && datasetTitle.trim().length > 0 && authors.trim().length > 0;

  const stepsUi = useMemo(
    () => [
      { id: 1 as StepId, label: "Select Files" },
      { id: 2 as StepId, label: "Validation" },
      { id: 3 as StepId, label: "Metadata" },
      { id: 4 as StepId, label: "Accept Terms" },
    ],
    []
  );

  const showUploadWizard = auth.signedIn && auth.contributorStatus === "approved";

  // Small “status hint” (NO sign-out/sign-in UI here)
  const statusHint =
    !auth.signedIn
      ? "Sign in from the header to submit an application or upload."
      : auth.contributorStatus === "approved"
      ? "You’re approved — you can upload below."
      : auth.contributorStatus === "pending"
      ? "Your application is pending review."
      : auth.contributorStatus === "rejected"
      ? "Your application was rejected. Contact support if this is unexpected."
      : "You haven’t applied yet — submit an application below.";

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-6">
          <h1 className="mb-3" style={{ fontSize: "2.5rem", fontWeight: 700 }}>
            Contribute Data to AfNIA
          </h1>
          <p className="text-muted-foreground" style={{ fontSize: "1.125rem" }}>
            Join our network of research institutions and clinics advancing African neuroscience. Your data
            contributions help build a more representative and equitable future for brain research.
          </p>
        </div>

        {/* In-app notice banner */}
        <div className="max-w-4xl mx-auto">
          {notice && (
            <div
              className={`mb-6 rounded-lg border p-4 text-sm ${
                notice.type === "success"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>{notice.text}</div>
                <button
                  type="button"
                  className="text-xs underline opacity-80 hover:opacity-100"
                  onClick={() => setNotice(null)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        {/* How it Works */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center mb-8" style={{ fontSize: "2rem", fontWeight: 700 }}>
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[
              {
                icon: <FileText className="w-6 h-6 text-primary" />,
                step: "Step 1",
                title: "Register Your Institution",
                text: "Provide basic information about your clinic or research center and obtain institutional approval.",
              },
              {
                icon: <Shield className="w-6 h-6 text-primary" />,
                step: "Step 2",
                title: "Ensure Ethics Compliance",
                text: "Confirm all data is anonymized and meets ethical standards with proper participant consent.",
              },
              {
                icon: <Upload className="w-6 h-6 text-primary" />,
                step: "Step 3",
                title: "Upload Dataset",
                text: "Use our secure platform to upload neuroimaging data with detailed metadata.",
              },
              {
                icon: <CheckCircle className="w-6 h-6 text-primary" />,
                step: "Step 4",
                title: "Review & Publish",
                text: "Our team reviews your submission for quality and compliance before making it available.",
              },
            ].map((c) => (
              <Card key={c.title} className="p-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  {c.icon}
                </div>
                <div className="text-primary font-medium mb-1">{c.step}</div>
                <div className="font-semibold mb-2">{c.title}</div>
                <div className="text-sm text-muted-foreground">{c.text}</div>
              </Card>
            ))}
          </div>
        </div>

        {/* Ethical standards */}
        <div className="mb-16 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-8 md:p-12 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="w-12 h-12 bg-primary text-white rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="mb-4" style={{ fontSize: "2rem", fontWeight: 700 }}>
                Ethical Standards & Anonymization
              </h2>
              <p className="text-muted-foreground mb-6">
                AfNIA is committed to the highest ethical standards in data sharing. We ensure:
              </p>
              <ul className="space-y-3">
                {[
                  "Complete anonymization of all participant data",
                  "Institutional ethics board approval for all datasets",
                  "Informed consent from all participants",
                  "Compliance with international data protection regulations",
                  "Secure data transmission and storage protocols",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg overflow-hidden shadow-xl">
              <ImageWithFallback
                src="/ethical.png"
                alt="Ethics and anonymization"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Apply / Become a Partner */}
        <div className="max-w-3xl mx-auto">
          <Card className="p-8">
            <h2 className="mb-2" style={{ fontSize: "1.75rem", fontWeight: 700 }}>
              Become a Partner
            </h2>
            <p className="text-muted-foreground mb-6">
              Interested in annotating data? Submit an application.
            </p>

            {!auth.signedIn && (
              <div className="mb-5 rounded-lg border bg-muted/30 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-muted-foreground">
                    You must sign in to submit an application.
                  </div>
                  <Button onClick={onOpenAuth} className="h-9">
                    Sign in
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Institution Name *</Label>
                <Input
                  value={applyInstitution}
                  onChange={(e) => setApplyInstitution(e.target.value)}
                  placeholder="Your institution"
                  disabled={!auth.signedIn}
                />
              </div>
              <div>
                <Label>Country *</Label>
                <Input
                  value={applyCountry}
                  onChange={(e) => setApplyCountry(e.target.value)}
                  placeholder="Country"
                  disabled={!auth.signedIn}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Message *</Label>
                <Textarea
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  rows={4}
                  placeholder="Describe the dataset you'd like to contribute, modalities, participant count, ethics approval, etc."
                  disabled={!auth.signedIn}
                />
              </div>
            </div>

            <div className="mt-6">
              <Button className="w-full" disabled={!auth.signedIn || applying} onClick={handleApplyToContribute}>
                <Users className="w-4 h-4 mr-2" />
                {applying ? "Submitting..." : "Submit Application"}
              </Button>

              {auth.signedIn && auth.contributorStatus === "pending" && (
                <div className="mt-2 text-xs text-muted-foreground text-center">
                  Your application is currently pending review.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-center mb-8" style={{ fontSize: "2rem", fontWeight: 700 }}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex gap-4">
                <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="mb-2">What types of data can I contribute?</h4>
                  <p className="text-muted-foreground">
                    AfNIA accepts DICOM and NIfTI uploads. We convert to BIDS and validate before publication.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex gap-4">
                <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="mb-2">Do I need to anonymize first?</h4>
                  <p className="text-muted-foreground">Yes. You must remove identifying information before publishing.</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex gap-4">
                <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="mb-2">Will I receive attribution for my contributions?</h4>
                  <p className="text-muted-foreground">
                    Yes! All datasets include proper attribution to the contributing institution and researchers.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-10 flex justify-center">
            <Button variant="outline" onClick={() => onNavigate("explore")}>
              Explore Datasets
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}