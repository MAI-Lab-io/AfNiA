import { useMemo } from "react";
import { Dataset } from "./DatasetCard";

interface DatasetTypesSummaryProps {
  datasets: Dataset[];
}

export function DatasetTypesSummary({ datasets }: DatasetTypesSummaryProps) {
  const { modalityTypes, diagnosisTypes } = useMemo(() => {
    const modalityMap = new Map<string, number>();
    const diagnosisMap = new Map<string, number>();

    datasets.forEach((dataset) => {
      (dataset.modality ?? []).forEach((mod) => {
        modalityMap.set(mod, (modalityMap.get(mod) || 0) + 1);
      });

      if (dataset.diagnosis) {
        diagnosisMap.set(
          dataset.diagnosis,
          (diagnosisMap.get(dataset.diagnosis) || 0) + 1
        );
      }
    });

    return {
      modalityTypes: modalityMap,
      diagnosisTypes: diagnosisMap,
    };
  }, [datasets]);

  return (
    <div className="mb-10">
      <h3
        className="text-center mb-8"
        style={{ fontSize: "1.875rem", fontWeight: 600 }}
      >
        Dataset Types
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Imaging Modalities */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h4 className="mb-4" style={{ fontSize: "1.25rem", fontWeight: 600 }}>
            Imaging Modalities
          </h4>

          <div className="space-y-3">
            {Array.from(modalityTypes.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([modality, count]) => (
                <div key={modality} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{modality}</span>

                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${(count / datasets.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Clinical Conditions */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h4 className="mb-4" style={{ fontSize: "1.25rem", fontWeight: 600 }}>
            Clinical Conditions
          </h4>

          <div className="space-y-3">
            {Array.from(diagnosisTypes.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([diagnosis, count]) => (
                <div key={diagnosis} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{diagnosis}</span>

                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-accent h-2 rounded-full"
                        style={{ width: `${(count / datasets.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}