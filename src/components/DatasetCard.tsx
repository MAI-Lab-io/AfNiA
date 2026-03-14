import { MapPin, Database } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export interface Dataset {
  id: string;
  title: string;
  institution: string;
  country: string;
  modality: string[];
  diagnosis?: string;
  participantCount: number;
  thumbnail: string;
  description: string;
  accessType: "Open" | "Restricted" | "Coming Soon";
  viewCount?: number;
  downloadCount?: number;
  citationCount?: number;
}

interface DatasetCardProps {
  dataset: Dataset;
  onView: (id: string) => void;
}

export function DatasetCard({ dataset, onView }: DatasetCardProps) {
  const location = [dataset.institution, dataset.country].filter(Boolean).join(", ");
  const participantText = `${Number(dataset.participantCount || 0).toLocaleString()} participants`;

  const badgeVariant =
    dataset.accessType === "Open" ? "default" : "secondary";

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-white relative overflow-hidden p-1">
        <ImageWithFallback
          src={dataset.thumbnail || ""}
          alt={dataset.title}
          className="w-full h-full object-contain"
        />
      </div>

      <div className="p-2.5">
        <div className="flex items-start justify-between mb-1 gap-2">
          <h3 className="flex-1 text-xs font-semibold leading-tight pr-1">
            {dataset.title}
          </h3>

          <Badge
            variant={badgeVariant}
            className="text-[10px] px-1 py-0 shrink-0"
          >
            {dataset.accessType}
          </Badge>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground mb-1 text-[10px]">
          <MapPin className="w-2.5 h-2.5 shrink-0" />
          <span className="truncate">{location || "Location unavailable"}</span>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground mb-1.5 text-[10px]">
          <Database className="w-2.5 h-2.5 shrink-0" />
          <span>{participantText}</span>
        </div>

        <div className="flex flex-wrap gap-0.5 mb-1.5">
          {(dataset.modality || []).map((mod) => (
            <Badge
              key={mod}
              variant="outline"
              className="text-[10px] px-1 py-0"
            >
              {mod}
            </Badge>
          ))}

          {dataset.diagnosis && (
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              {dataset.diagnosis}
            </Badge>
          )}
        </div>

        <Button
          onClick={() => onView(dataset.id)}
          className="w-full text-[10px] h-7 px-2"
          disabled={dataset.accessType === "Coming Soon"}
        >
          {dataset.accessType === "Coming Soon" ? "Coming Soon" : "View Dataset"}
        </Button>
      </div>
    </Card>
  );
}