import { MapPin, Database } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';

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
  accessType: 'Open' | 'Restricted' | 'Coming Soon';
}

interface DatasetCardProps {
  dataset: Dataset;
  onView: (id: string) => void;
}

export function DatasetCard({ dataset, onView }: DatasetCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        <ImageWithFallback
          src={dataset.thumbnail}
          alt={dataset.title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="flex-1">{dataset.title}</h3>
          <Badge variant={dataset.accessType === 'Open' ? 'default' : 'secondary'}>
            {dataset.accessType}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <MapPin className="w-4 h-4" />
          <span>{dataset.institution}, {dataset.country}</span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Database className="w-4 h-4" />
          <span>{dataset.participantCount} participants</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {dataset.modality.map((mod) => (
            <Badge key={mod} variant="outline">{mod}</Badge>
          ))}
          {dataset.diagnosis && (
            <Badge variant="outline">{dataset.diagnosis}</Badge>
          )}
        </div>

        <Button onClick={() => onView(dataset.id)} className="w-full">
          View Dataset
        </Button>
      </div>
    </Card>
  );
}
