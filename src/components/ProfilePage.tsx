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

type Profile = {
  fullName?: string;
  institution: string;
  country: string;
  department?: string;
  role?: string;
  orcid?: string;
};

type MyDataset = {
  id: string;
  title: string;
  status:
    | "draft"
    | "pending_review"
    | "approved"
    | "rejected"
    | "uploading"
    | "processing"
    | "published"
    | "archived"
    | "failed";
  accessType: "Open" | "Restricted";
  participantCount?: number;
  modality?: string[];
  diagnosis?: string;
  createdAt?: string;
  doi?: string;
  viewCount?: number;
  downloadCount?: number;
  citationCount?: number;
  admin_note?: string | null;
  dataset_id?: string | null;
  published?: boolean;
};

interface ProfilePageProps {
  onNavigate: (page: string) => void;
  onOpenAuth: () => void;
  user: User;
}

export function ProfilePage({
  onNavigate,
  onOpenAuth,
  user,
}: ProfilePageProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [datasetsLoading, setDatasetsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [form, setForm] = useState<Profile>({
    fullName: "",
    institution: "",
    country: "",
    department: "",
    role: "",
    orcid: "",
  });

  const [myDatasets, setMyDatasets] = useState<MyDataset[]>([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!user) return;

      setLoading(true);
      setDatasetsLoading(true);
      setError(null);

      try {
        const [profileRes, datasetsRes] = await Promise.all([
          apiGet<{ ok: boolean; profile: Profile | null }>("/api/profile/me"),
          apiGet<{ ok: boolean; datasets: MyDataset[] }>("/api/my/datasets"),
        ]);

        if (!mounted) return;

        if (profileRes.profile) {
          setForm((prev) => ({ ...prev, ...profileRes.profile }));
        }

        setMyDatasets(datasetsRes.datasets || []);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load dashboard");
      } finally {
        if (mounted) {
          setLoading(false);
          setDatasetsLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  if (!user) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h2 className="text-2xl font-semibold mb-4">Sign in required</h2>
        <Button onClick={onOpenAuth}>Sign in</Button>
      </div>
    );
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    setOkMsg(null);

    try {
      const res = await apiPostJson<{ ok: boolean; profile: Profile }>(
        "/api/profile/me",
        form
      );
      setForm(res.profile);
      setOkMsg("Profile updated successfully.");
    } catch (e: any) {
      setError(e?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function deleteDataset(datasetId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this dataset?"
    );
    if (!confirmed) return;

    try {
      await apiGet(`/api/my/datasets/${datasetId}/delete`);
      setMyDatasets((prev) => prev.filter((d) => d.id !== datasetId));
    } catch (e: any) {
      setError(e?.message || "Failed to delete dataset");
    }
  }

  const set =
    (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const stats = useMemo(() => {
    const uploaded = myDatasets.length;
    const approved = myDatasets.filter(
      (d) =>
        d.status === "approved" ||
        d.status === "published" ||
        d.status === "processing" ||
        d.status === "uploading"
    ).length;

    const downloads = myDatasets.reduce(
      (sum, d) => sum + (d.downloadCount || 0),
      0
    );

    const citations = myDatasets.reduce(
      (sum, d) => sum + (d.citationCount || 0),
      0
    );

    return { uploaded, approved, downloads, citations };
  }, [myDatasets]);

  const statusClass = (status: MyDataset["status"]) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-700";
      case "approved":
        return "bg-emerald-100 text-emerald-700";
      case "pending_review":
        return "bg-yellow-100 text-yellow-700";
      case "uploading":
        return "bg-sky-100 text-sky-700";
      case "processing":
        return "bg-blue-100 text-blue-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "archived":
        return "bg-gray-200 text-gray-700";
      case "failed":
        return "bg-rose-100 text-rose-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const statusLabel = (status: MyDataset["status"]) => {
    switch (status) {
      case "pending_review":
        return "Pending Review";
      case "uploading":
        return "Uploading";
      case "processing":
        return "Processing";
      case "published":
        return "Published";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "archived":
        return "Archived";
      case "failed":
        return "Failed";
      default:
        return "Draft";
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Contributor Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your profile, uploaded datasets, and contribution activity.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded border text-red-600 bg-white mb-6">
            {error}
          </div>
        )}

        {okMsg && (
          <div className="p-3 rounded border text-green-700 bg-white mb-6">
            {okMsg}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          <div className="xl:col-span-2">
            <Card className="p-6 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Profile Information</h2>
                  <p className="text-sm text-muted-foreground">
                    Update your contributor and institution details.
                  </p>
                </div>
                <Button
                  onClick={onSave}
                  disabled={saving || !form.institution || !form.country}
                >
                  {saving ? "Saving..." : "Edit Profile / Save"}
                </Button>
              </div>

              {loading ? (
                <p>Loading profile...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Full name</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.fullName || ""}
                      onChange={set("fullName")}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Institution *</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.institution}
                      onChange={set("institution")}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Country *</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.country}
                      onChange={set("country")}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Department</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.department || ""}
                      onChange={set("department")}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Role</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.role || ""}
                      onChange={set("role")}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">ORCID</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.orcid || ""}
                      onChange={set("orcid")}
                    />
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div>
            <Card className="p-6 rounded-2xl shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Contribution Stats</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-purple-50 p-4">
                  <div className="text-2xl font-bold text-purple-700">
                    {stats.uploaded}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Uploaded datasets
                  </div>
                </div>

                <div className="rounded-xl bg-green-50 p-4">
                  <div className="text-2xl font-bold text-green-700">
                    {stats.approved}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Approved / In pipeline
                  </div>
                </div>

                <div className="rounded-xl bg-orange-50 p-4">
                  <div className="text-2xl font-bold text-orange-700">
                    {stats.downloads}
                  </div>
                  <div className="text-sm text-muted-foreground">Downloads</div>
                </div>

                <div className="rounded-xl bg-blue-50 p-4">
                  <div className="text-2xl font-bold text-blue-700">
                    {stats.citations}
                  </div>
                  <div className="text-sm text-muted-foreground">Citations</div>
                </div>
              </div>

              <div className="mt-6">
                <Button className="w-full" onClick={() => onNavigate("upload")}>
                  Upload New Dataset
                </Button>
              </div>
            </Card>
          </div>
        </div>

        <Card className="p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">My Uploaded Datasets</h2>
              <p className="text-sm text-muted-foreground">
                Track review status, usage, and manage your contributions.
              </p>
            </div>
            <Button variant="outline" onClick={() => onNavigate("upload")}>
              Add More Data
            </Button>
          </div>

          {datasetsLoading ? (
            <p>Loading datasets...</p>
          ) : myDatasets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-xl bg-gray-50">
              You have not uploaded any datasets yet.
            </div>
          ) : (
            <div className="space-y-4">
              {myDatasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className="border rounded-2xl p-5 bg-white hover:shadow-sm transition"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <h3 className="text-lg font-semibold">{dataset.title}</h3>

                        <Badge className={statusClass(dataset.status)}>
                          {statusLabel(dataset.status)}
                        </Badge>

                        <Badge variant="outline">{dataset.accessType}</Badge>

                        {dataset.published && (
                          <Badge className="bg-green-50 text-green-700 border border-green-200">
                            Live
                          </Badge>
                        )}
                      </div>

                      <div className="text-sm text-muted-foreground mb-3">
                        {dataset.createdAt
                          ? `Uploaded: ${new Date(dataset.createdAt).toLocaleDateString()}`
                          : "Upload date unavailable"}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {(dataset.modality || []).map((mod) => (
                          <Badge key={mod} variant="secondary">
                            {mod}
                          </Badge>
                        ))}
                        {dataset.diagnosis && (
                          <Badge variant="outline">{dataset.diagnosis}</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="font-semibold">
                            {dataset.participantCount || 0}
                          </div>
                          <div className="text-muted-foreground">
                            Participants
                          </div>
                        </div>

                        <div>
                          <div className="font-semibold">
                            {dataset.downloadCount || 0}
                          </div>
                          <div className="text-muted-foreground">Downloads</div>
                        </div>

                        <div>
                          <div className="font-semibold">
                            {dataset.viewCount || 0}
                          </div>
                          <div className="text-muted-foreground">Views</div>
                        </div>

                        <div>
                          <div className="font-semibold">
                            {dataset.citationCount || 0}
                          </div>
                          <div className="text-muted-foreground">Citations</div>
                        </div>
                      </div>

                      {dataset.doi && (
                        <div className="mt-3 text-sm">
                          <span className="font-medium">DOI:</span> {dataset.doi}
                        </div>
                      )}

                      {dataset.status === "rejected" && dataset.admin_note && (
                        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                          <span className="font-medium">Admin feedback:</span>{" "}
                          {dataset.admin_note}
                        </div>
                      )}

                      {dataset.status === "pending_review" && (
                        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
                          Your submission is awaiting admin review.
                        </div>
                      )}

                      {dataset.status === "processing" && (
                        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                          Your dataset is being processed.
                        </div>
                      )}

                      {dataset.status === "uploading" && (
                        <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-700">
                          Your files are being uploaded.
                        </div>
                      )}

                      {dataset.status === "failed" && (
                        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                          Processing failed. Please review the job logs or resubmit.
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-44">
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (dataset.published && dataset.dataset_id) {
                            onNavigate(`dataset-${dataset.dataset_id}`);
                          } else {
                            onNavigate(`dataset-${dataset.id}`);
                          }
                        }}
                      >
                        View
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => onNavigate(`edit-dataset-${dataset.id}`)}
                      >
                        Edit
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => onNavigate(`add-data-${dataset.id}`)}
                      >
                        Add Data
                      </Button>

                      <Button
                        variant="destructive"
                        onClick={() => deleteDataset(dataset.id)}
                      >
                        Delete
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
