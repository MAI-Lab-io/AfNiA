import { useState, useEffect, useMemo } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { LandingPage } from "./components/LandingPage";
import { ExplorePage } from "./components/ExplorePage";
import { DatasetDetailPage } from "./components/DatasetDetailPage";
import { ContributePage } from "./components/ContributePage";
import { AboutPage } from "./components/AboutPage";
import { Dataset } from "./components/DatasetCard";
import { ProfilePage } from "./components/ProfilePage";
import { UploadDialog } from "./components/UploadDialog";
import { AdminDashboardPage } from "./components/AdminDashboardPage";
import { SupportDialog } from "./components/SupportDialog";
import { AuthDialog } from "./components/AuthDialog";
import { Button } from "./components/ui/button";

import { supabase } from "./lib/supabaseClient";

// ✅ Put these files in src/assets/
import bratsAfricaThumbnail from "./assets/generated_image(2).png";
import preciseLogo from "./assets/pppp.jpg";
import afniaLogo from "./assets/favicon-32.png";

type User = {
  id: string;
  email?: string | null;
  isAdmin?: boolean;
} | null;

type BackendDatasetResponse = {
  dataset_id: string;
  title: string;
  institution?: string;
  country?: string;
  modality?: string[];
  description?: string;
  accessType?: string;
  authors?: string[];
  extra?: {
    doi?: string;
  };
};

type BackendDatasetsListResponse = {
  datasets?: BackendDatasetResponse[];
};

// Temporary admin check
// Replace this later with backend/profile role logic
function isAdminEmail(email?: string | null) {
  const admins = ["haskemailab@gmail.com", "admin@afnia.mailab.io"];
  return !!email && admins.includes(email.toLowerCase());
}

// Mock dataset data
const mockDatasets: Dataset[] = [
  {
    id: "1",
    title: "BraTs-Africa Dataset",
    institution: "Six Diagnostic Centers (Nigeria)",
    country: "Nigeria",
    modality: ["MRI"],
    diagnosis: "Brain Cancer",
    participantCount: 146,
    thumbnail: bratsAfricaThumbnail,
    description:
      "Collection of retrospective pre-operative brain magnetic resonance imaging (MRI) scans, clinically acquired from six diagnostic centers in Nigeria. Dataset includes 146 patients with high-grade brain MRIs indicating central nervous system neoplasms, diffuse glioma, low-grade glioma, or glioblastoma. The brain scans are multiparametric MRI images (mpMRI), specifically T1, T1 CE, T2, and T2 FLAIR, acquired on 1.5T MRI between January 2019 and December 2022.",
    accessType: "Open",
  },
  {
    id: "2",
    title: "The PRECISE-ABreast Dataset",
    institution: "PRECISE",
    country: "Sub-Saharan Africa",
    modality: ["Ultrasound"],
    diagnosis: "Breast Cancer",
    participantCount: 7354,
    thumbnail: preciseLogo,
    description:
      "Multi-institutional breast ultrasound (BUS) dataset for breast cancer detection, classification, and segmentation. Integrates images from BUSI, BrEaST, and BUS-BRA datasets, including benign, malignant, and normal cases from community-dwelling women in sub-Saharan Africa. Comprises 7,354 images with expert-verified annotations for robust algorithm development.",
    accessType: "Restricted",
  },
  {
    id: "3",
    title: "Brain Age Dataset",
    institution: "MAILAB",
    country: "Nigeria",
    modality: ["MRI"],
    diagnosis: "Normal",
    participantCount: 500,
    thumbnail: afniaLogo,
    description:
      "Pre-surgical neuroimaging dataset for epilepsy patients undergoing evaluation for surgical intervention. Combines high-resolution structural MRI with PET imaging for seizure focus localization.",
    accessType: "Coming Soon",
  },
];

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);

  // dialogs + auth
  const [supportOpen, setSupportOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [user, setUser] = useState<User>(null);

  // backend datasets
  const [backendDatasets, setBackendDatasets] = useState<Dataset[]>([]);
  const [datasetsLoading, setDatasetsLoading] = useState(true);

  // ✅ Load user on boot, and subscribe to auth changes
  useEffect(() => {
    let ignore = false;

    async function init() {
      const { data } = await supabase.auth.getUser();

      if (!ignore) {
        const u = data.user;
        setUser(
          u
            ? {
                id: u.id,
                email: u.email,
                isAdmin: isAdminEmail(u.email),
              }
            : null
        );
      }
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;

      setUser(
        u
          ? {
              id: u.id,
              email: u.email,
              isAdmin: isAdminEmail(u.email),
            }
          : null
      );
    });

    return () => {
      ignore = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // ✅ Fetch published datasets from backend
  useEffect(() => {
    let ignore = false;

    async function loadDatasets() {
      setDatasetsLoading(true);

      try {
        const res = await fetch("/api/datasets", {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch datasets (${res.status})`);
        }

        const data: BackendDatasetsListResponse | BackendDatasetResponse[] =
          await res.json();

        const rawDatasets = Array.isArray(data) ? data : data.datasets || [];

        const mapped: Dataset[] = rawDatasets.map((d) => ({
          id: d.dataset_id,
          title: d.title,
          institution: d.institution || "Unknown Institution",
          country: d.country || "Unknown Country",
          modality: d.modality || [],
          diagnosis: d.diagnosis || "",
          participantCount: d.participantCount || 0,
          thumbnail: afniaLogo,
          description: d.description || "",
          accessType: d.accessType || "Open",
        }));

        if (!ignore) {
          setBackendDatasets(mapped);
        }
      } catch (err) {
        console.error("Dataset fetch error:", err);
        if (!ignore) {
          setBackendDatasets([]);
        }
      } finally {
        if (!ignore) {
          setDatasetsLoading(false);
        }
      }
    }

    loadDatasets();

    return () => {
      ignore = true;
    };
  }, []);

  // Set favicon
  useEffect(() => {
    const existingLinks = document.querySelectorAll("link[rel*='icon']");
    existingLinks.forEach((link) => link.remove());

    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    link.href = afniaLogo;
    document.head.appendChild(link);

    document.title = "AfNIA - African NeuroImaging Archive";
  }, []);

  // ✅ Merge backend + mock datasets, avoiding duplicate IDs
  const allDatasets = useMemo(() => {
    const seen = new Set<string>();
    const merged: Dataset[] = [];

    for (const ds of [...backendDatasets, ...mockDatasets]) {
      if (!seen.has(ds.id)) {
        seen.add(ds.id);
        merged.push(ds);
      }
    }

    return merged;
  }, [backendDatasets]);

  const handleNavigate = (page: string) => {
    // block non-admin users from admin page
    if (page === "admin" && !user?.isAdmin) {
      setCurrentPage("home");
      setSelectedDatasetId(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // handle dynamic dataset page ids like "dataset-1" or "dataset-ds-000001"
    if (page.startsWith("dataset-")) {
      const datasetId = page.replace("dataset-", "").trim();

      if (datasetId) {
        setSelectedDatasetId(datasetId);
        setCurrentPage("dataset-detail");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    setCurrentPage(page);
    setSelectedDatasetId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleViewDataset = (id: string) => {
    setSelectedDatasetId(id);
    setCurrentPage("dataset-detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectedDataset = allDatasets.find((d) => d.id === selectedDatasetId);

  const relatedDatasets = selectedDataset
    ? allDatasets.filter(
        (d) =>
          d.id !== selectedDataset.id &&
          (d.country === selectedDataset.country ||
            d.modality.some((m) => selectedDataset.modality.includes(m)))
      )
    : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenSupport={() => setSupportOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenUpload={() => setUploadOpen(true)}
        user={user}
        onSignOut={async () => {
          await supabase.auth.signOut();
          setUser(null);
          setCurrentPage("home");
          setSelectedDatasetId(null);
        }}
      />

      {/* Dialogs */}
      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />

      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onSignedIn={(u) =>
          setUser(
            u
              ? {
                  ...u,
                  isAdmin: isAdminEmail(u.email),
                }
              : null
          )
        }
      />

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        user={user}
        onOpenAuth={() => setAuthOpen(true)}
        onNavigate={handleNavigate}
      />

      <main className="flex-1">
        {currentPage === "home" && (
          <LandingPage onNavigate={handleNavigate} datasets={allDatasets} />
        )}

        {currentPage === "explore" && (
          <ExplorePage datasets={allDatasets} onViewDataset={handleViewDataset} />
        )}

        {currentPage === "dataset-detail" && selectedDataset && (
          <DatasetDetailPage
            dataset={selectedDataset}
            relatedDatasets={relatedDatasets}
            onBack={() => handleNavigate("explore")}
            onViewDataset={handleViewDataset}
          />
        )}

        {currentPage === "profile" && (
          <ProfilePage
            onNavigate={handleNavigate}
            onOpenAuth={() => setAuthOpen(true)}
            user={user}
          />
        )}

        {currentPage === "admin" && user?.isAdmin && (
          <AdminDashboardPage user={user} onNavigate={handleNavigate} />
        )}

        {currentPage === "contribute" && (
          <ContributePage
            onNavigate={handleNavigate}
            onOpenAuth={() => setAuthOpen(true)}
          />
        )}

        {currentPage === "about" && <AboutPage />}

        {currentPage === "dataset-detail" && !selectedDataset && (
          <div className="container mx-auto px-4 py-16 text-center">
            <h2 className="text-2xl font-semibold mb-4">Dataset not found</h2>
            <p className="text-muted-foreground mb-6">
              The dataset you tried to open is not available in the current list.
            </p>
            <Button onClick={() => handleNavigate("explore")}>
              Back to Explore
            </Button>
          </div>
        )}

        {currentPage === "explore" && datasetsLoading && (
          <div className="container mx-auto px-4 pb-8 text-sm text-muted-foreground">
            Loading latest datasets...
          </div>
        )}
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default App;