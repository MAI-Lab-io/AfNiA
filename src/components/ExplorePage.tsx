import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { FilterSidebar } from "./FilterSidebar";
import { DatasetCard, Dataset } from "./DatasetCard";
import { DatasetTypesSummary } from "./DatasetTypesSummary";

interface ExplorePageProps {
  datasets: Dataset[];
  onViewDataset: (id: string) => void;
}

/**
 * Classify a dataset as "Neuroimaging" vs "Others" based on its modality list.
 */
function getDataType(dataset: Dataset): "Neuroimaging" | "Others" {
  const neuroimagingModalities = new Set(
    [
      "mri",
      "fmri",
      "dti",
      "pet",
      "spect",
      "meg",
      "eeg",
      "nirs",
      "ct",
    ].map((s) => s.toLowerCase())
  );

  const mods = (dataset.modality ?? []).map((m) =>
    (m || "").toLowerCase().trim()
  );

  const isNeuro = mods.some((m) => neuroimagingModalities.has(m));

  return isNeuro ? "Neuroimaging" : "Others";
}

export function ExplorePage({ datasets, onViewDataset }: ExplorePageProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedFilters, setSelectedFilters] = useState({
    countries: [] as string[],
    modalities: [] as string[],
    diagnoses: [] as string[],
    accessTypes: [] as string[],
    dataTypes: [] as string[],
  });

  const filters = useMemo(() => {
    const countries = [...new Set(datasets.map((d) => d.country))].sort();

    const modalities = [
      ...new Set(
        datasets
          .flatMap((d) => d.modality ?? [])
          .filter(Boolean)
          .map((m) => m.trim())
      ),
    ].sort();

    const diagnoses = [
      ...new Set(datasets.map((d) => d.diagnosis).filter(Boolean) as string[]),
    ].sort();

    const accessTypes = ["Open", "Restricted"];

    const dataTypes = ["Neuroimaging", "Others"];

    return { countries, modalities, diagnoses, accessTypes, dataTypes };
  }, [datasets]);

  const handleFilterChange = (category: string, value: string) => {
    setSelectedFilters((prev) => {
      const categoryFilters = prev[category as keyof typeof prev] as string[];
      const isSelected = categoryFilters.includes(value);

      return {
        ...prev,
        [category]: isSelected
          ? categoryFilters.filter((v) => v !== value)
          : [...categoryFilters, value],
      };
    });
  };

  const filteredDatasets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return datasets.filter((dataset) => {
      const matchesSearch =
        q === "" ||
        dataset.title.toLowerCase().includes(q) ||
        dataset.institution.toLowerCase().includes(q) ||
        dataset.country.toLowerCase().includes(q);

      const matchesCountry =
        selectedFilters.countries.length === 0 ||
        selectedFilters.countries.includes(dataset.country);

      const matchesModality =
        selectedFilters.modalities.length === 0 ||
        (dataset.modality ?? []).some((m) =>
          selectedFilters.modalities.includes(m)
        );

      const matchesDiagnosis =
        selectedFilters.diagnoses.length === 0 ||
        (dataset.diagnosis &&
          selectedFilters.diagnoses.includes(dataset.diagnosis));

      const matchesAccessType =
        selectedFilters.accessTypes.length === 0 ||
        selectedFilters.accessTypes.includes(dataset.accessType);

      const dt = getDataType(dataset);
      const matchesDataType =
        selectedFilters.dataTypes.length === 0 ||
        selectedFilters.dataTypes.includes(dt);

      return (
        matchesSearch &&
        matchesCountry &&
        matchesModality &&
        matchesDiagnosis &&
        matchesAccessType &&
        matchesDataType
      );
    });
  }, [datasets, searchQuery, selectedFilters]);

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="mb-4" style={{ fontSize: "2.5rem", fontWeight: 700 }}>
            Explore Datasets
          </h1>

          <p className="text-muted-foreground mb-6">
            Browse and access neuroimaging datasets from across Africa
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />

            <Input
              type="text"
              placeholder="Search datasets by title, institution, or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Dataset Types (with spacing fix) */}
        <div className="mb-16">
          <DatasetTypesSummary datasets={datasets} />
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Filters */}
          <div className="lg:col-span-1">
            <FilterSidebar
              filters={filters}
              selectedFilters={selectedFilters}
              onFilterChange={handleFilterChange}
            />
          </div>

          {/* Dataset Grid */}
          <div className="lg:col-span-3">

            <div className="mb-4 text-muted-foreground">
              Showing {filteredDatasets.length} of {datasets.length} datasets
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDatasets.map((dataset) => (
                <DatasetCard
                  key={dataset.id}
                  dataset={dataset}
                  onView={onViewDataset}
                />
              ))}
            </div>

            {filteredDatasets.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No datasets found matching your criteria. Try adjusting your filters.
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}