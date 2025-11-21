import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from './ui/input';
import { FilterSidebar } from './FilterSidebar';
import { DatasetCard, Dataset } from './DatasetCard';

interface ExplorePageProps {
  datasets: Dataset[];
  onViewDataset: (id: string) => void;
}

export function ExplorePage({ datasets, onViewDataset }: ExplorePageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    countries: [] as string[],
    modalities: [] as string[],
    diagnoses: [] as string[],
    accessTypes: [] as string[],
  });

  // Extract unique filter options from datasets
  const filters = {
    countries: [...new Set(datasets.map(d => d.country))],
    modalities: [...new Set(datasets.flatMap(d => d.modality))],
    diagnoses: [...new Set(datasets.map(d => d.diagnosis).filter(Boolean) as string[])],
    accessTypes: ['Open', 'Restricted'],
  };

  const handleFilterChange = (category: string, value: string) => {
    setSelectedFilters(prev => {
      const categoryFilters = prev[category as keyof typeof prev];
      const isSelected = categoryFilters.includes(value);
      
      return {
        ...prev,
        [category]: isSelected
          ? categoryFilters.filter(v => v !== value)
          : [...categoryFilters, value],
      };
    });
  };

  // Filter datasets based on search and selected filters
  const filteredDatasets = datasets.filter(dataset => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      dataset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.country.toLowerCase().includes(searchQuery.toLowerCase());

    // Country filter
    const matchesCountry = selectedFilters.countries.length === 0 || 
      selectedFilters.countries.includes(dataset.country);

    // Modality filter
    const matchesModality = selectedFilters.modalities.length === 0 || 
      dataset.modality.some(m => selectedFilters.modalities.includes(m));

    // Diagnosis filter
    const matchesDiagnosis = selectedFilters.diagnoses.length === 0 || 
      (dataset.diagnosis && selectedFilters.diagnoses.includes(dataset.diagnosis));

    // Access type filter
    const matchesAccessType = selectedFilters.accessTypes.length === 0 || 
      selectedFilters.accessTypes.includes(dataset.accessType);

    return matchesSearch && matchesCountry && matchesModality && matchesDiagnosis && matchesAccessType;
  });

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="mb-4" style={{ fontSize: '2.5rem', fontWeight: 700 }}>Explore Datasets</h1>
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
