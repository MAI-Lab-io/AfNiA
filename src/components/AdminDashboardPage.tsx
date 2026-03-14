import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { apiGet, apiPostJson } from "../lib/api";

type User = {
  id: string;
  email?: string | null;
  isAdmin?: boolean;
} | null;

type AdminSubmission = {
  reg_id: string;
  title: string;
  contributorName?: string;
  contributorEmail?: string;
  institution?: string;
  country?: string;
  diagnosis?: string;
  modality?: string[] | string;
  accessType?: string;
  status:
    | "draft"
    | "pending_review"
    | "approved"
    | "rejected"
    | "uploading"
    | "processing"
    | "published"
    | "archived";
  created_at?: string;
  ethics_document_url?: string;
  diagnostic_metadata_url?: string;
  admin_note?: string | null;
};

interface AdminDashboardPageProps {
  user: User;
  onNavigate: (page: string) => void;
}

export function AdminDashboardPage({
  user,
  onNavigate,
}: AdminDashboardPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user?.isAdmin) return;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await apiGet<{ ok: boolean; submissions: AdminSubmission[] }>(
          "/api/admin/submissions"
        );
        setSubmissions(res.submissions || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load admin submissions");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user?.id, user?.isAdmin]);

  const stats = useMemo(() => {
    return {
      pending: submissions.filter((s) => s.status === "pending_review").length,
      approved: submissions.filter((s) => s.status === "approved").length,
      rejected: submissions.filter((s) => s.status === "rejected").length,
      published: submissions.filter((s) => s.status === "published").length,
    };
  }, [submissions]);

  async function approveSubmission(regId: string) {
    try {
      const note = notes[regId] || "";
      await apiPostJson(`/api/admin/submissions/${regId}/approve`, {
        admin_note: note,
      });

      setSubmissions((prev) =>
        prev.map((item) =>
          item.reg_id === regId
            ? { ...item, status: "approved", admin_note: note }
            : item
        )
      );
    } catch (e: any) {
      setError(e?.message || "Failed to approve submission");
    }
  }

  async function rejectSubmission(regId: string) {
    try {
      const note = notes[regId] || "";
      await apiPostJson(`/api/admin/submissions/${regId}/reject`, {
        admin_note: note,
      });

      setSubmissions((prev) =>
        prev.map((item) =>
          item.reg_id === regId
            ? { ...item, status: "rejected", admin_note: note }
            : item
        )
      );
    } catch (e: any) {
      setError(e?.message || "Failed to reject submission");
    }
  }

  function getStatusBadge(status: AdminSubmission["status"]) {
    const styles: Record<AdminSubmission["status"], string> = {
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

  if (!user?.isAdmin) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h2 className="text-2xl font-semibold mb-4">Admin access only</h2>
        <Button onClick={() => onNavigate("home")}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Review dataset submissions and control approval before file upload.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded border text-red-600 bg-white mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-5 rounded-2xl">
            <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending review</div>
          </Card>

          <Card className="p-5 rounded-2xl">
            <div className="text-2xl font-bold text-green-700">{stats.approved}</div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </Card>

          <Card className="p-5 rounded-2xl">
            <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </Card>

          <Card className="p-5 rounded-2xl">
            <div className="text-2xl font-bold text-emerald-700">{stats.published}</div>
            <div className="text-sm text-muted-foreground">Published</div>
          </Card>
        </div>

        <Card className="p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Submissions</h2>
              <p className="text-sm text-muted-foreground">
                Review Step 1 metadata and supporting documents.
              </p>
            </div>
          </div>

          {loading ? (
            <p>Loading submissions...</p>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-xl bg-gray-50">
              No submissions found.
            </div>
          ) : (
            <div className="space-y-5">
              {submissions.map((submission) => (
                <div
                  key={submission.reg_id}
                  className="border rounded-2xl p-5 bg-white"
                >
                  <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <h3 className="text-lg font-semibold">{submission.title}</h3>
                        {getStatusBadge(submission.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                        <div>
                          <b>Contributor:</b>{" "}
                          {submission.contributorName || "Unknown"}
                        </div>
                        <div>
                          <b>Email:</b>{" "}
                          {submission.contributorEmail || "Unavailable"}
                        </div>
                        <div>
                          <b>Institution:</b>{" "}
                          {submission.institution || "Unavailable"}
                        </div>
                        <div>
                          <b>Country:</b> {submission.country || "Unavailable"}
                        </div>
                        <div>
                          <b>Access:</b> {submission.accessType || "Unavailable"}
                        </div>
                        <div>
                          <b>Diagnosis:</b> {submission.diagnosis || "N/A"}
                        </div>
                        <div className="md:col-span-2">
                          <b>Submitted:</b>{" "}
                          {submission.created_at
                            ? new Date(submission.created_at).toLocaleString()
                            : "Unknown"}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 mb-4">
                        {submission.ethics_document_url && (
                          <a
                            href={submission.ethics_document_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-purple-700 hover:underline"
                          >
                            View ethics document
                          </a>
                        )}

                        {submission.diagnostic_metadata_url && (
                          <a
                            href={submission.diagnostic_metadata_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-blue-700 hover:underline"
                          >
                            View diagnostic metadata
                          </a>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium">Admin note</label>
                        <textarea
                          className="w-full border rounded p-2 mt-1"
                          rows={3}
                          value={notes[submission.reg_id] ?? submission.admin_note ?? ""}
                          onChange={(e) =>
                            setNotes((prev) => ({
                              ...prev,
                              [submission.reg_id]: e.target.value,
                            }))
                          }
                          placeholder="Reason for approval/rejection, or feedback for the contributor"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 xl:w-48">
                      <Button
                        onClick={() => approveSubmission(submission.reg_id)}
                        disabled={submission.status === "approved"}
                      >
                        Approve
                      </Button>

                      <Button
                        variant="destructive"
                        onClick={() => rejectSubmission(submission.reg_id)}
                        disabled={submission.status === "rejected"}
                      >
                        Reject
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() =>
                          onNavigate(`admin-submission-${submission.reg_id}`)
                        }
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}