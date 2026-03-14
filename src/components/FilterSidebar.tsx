import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Card } from "./ui/card";

interface FilterSidebarProps {
  filters: {
    countries: string[];
    modalities: string[];
    diagnoses: string[];
    accessTypes: string[];
    dataTypes: string[]; // ✅ NEW
  };
  selectedFilters: {
    countries: string[];
    modalities: string[];
    diagnoses: string[];
    accessTypes: string[];
    dataTypes: string[]; // ✅ NEW
  };
  onFilterChange: (category: string, value: string) => void;
}

export function FilterSidebar({
  filters,
  selectedFilters,
  onFilterChange,
}: FilterSidebarProps) {
  const filterSections = [
    { id: "countries", label: "Country", options: filters.countries },

    // ✅ NEW: Neuroimaging vs Others
    { id: "dataTypes", label: "Data Type", options: filters.dataTypes },

    { id: "modalities", label: "Modality", options: filters.modalities },
    { id: "diagnoses", label: "Diagnosis", options: filters.diagnoses },
    { id: "accessTypes", label: "Access Type", options: filters.accessTypes },
  ] as const;

  return (
    <Card className="p-6">
      <h3 className="mb-6">Filters</h3>

      <div className="space-y-6">
        {filterSections.map((section) => (
          <div key={section.id}>
            <Label className="mb-3 block">{section.label}</Label>

            <div className="space-y-2">
              {section.options.map((option) => (
                <div key={option} className="flex items-center gap-2">
                  <Checkbox
                    id={`${section.id}-${option}`}
                    checked={(
                      selectedFilters[
                        section.id as keyof typeof selectedFilters
                      ] as string[]
                    )?.includes(option)}
                    onCheckedChange={() => onFilterChange(section.id, option)}
                  />

                  <label
                    htmlFor={`${section.id}-${option}`}
                    className="text-muted-foreground cursor-pointer"
                  >
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}