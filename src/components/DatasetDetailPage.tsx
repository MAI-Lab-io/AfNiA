import { useState, useEffect} from 'react';
import { ArrowLeft, Download, Lock, MapPin, Users, Calendar, Database, Eye, FileDown, Quote} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Dataset } from './DatasetCard';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { DataAccessRequestModal } from './DataAccessRequestModal';

interface DatasetDetailPageProps {
  dataset: Dataset;
  relatedDatasets: Dataset[];
  onBack: () => void;
  onViewDataset: (id: string) => void;
}

export function DatasetDetailPage({ dataset, relatedDatasets, onBack, onViewDataset }: DatasetDetailPageProps) {
  const [showAccessModal, setShowAccessModal] = useState(false);
    const [stats, setStats] = useState({
    viewCount: dataset.viewCount || 0,
    downloadCount: dataset.downloadCount || 0,
    citationCount: dataset.citationCount || 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Fetch and increment view count when component mounts
  useEffect(() => {
    const trackView = async () => {
      try {
        // Increment view count
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-e3110718/dataset-stats/${dataset.id}/view`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const updatedStats = await response.json();
          setStats(updatedStats);
        } else {
          console.error('Failed to increment view count');
        }
      } catch (error) {
        console.error('Error tracking view:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    trackView();
  }, [dataset.id]);

  const handleAccessDataset = () => {
    setShowAccessModal(true);
  };

  const handleAccessGranted = async () => {
    // Increment download count when access is granted
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e3110718/dataset-stats/${dataset.id}/download`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const updatedStats = await response.json();
        setStats(updatedStats);
      }
    } catch (error) {
      console.error('Error incrementing download count:', error);
    }
  };

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Datasets
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">

            {/* Title and Tags */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <h1 style={{ fontSize: '2.5rem', fontWeight: 700 }}>{dataset.title}</h1>
                <Badge variant={dataset.accessType === 'Open' ? 'default' : 'secondary'}>
                  {dataset.accessType}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {dataset.modality.map((mod) => (
                  <Badge key={mod} variant="outline">{mod}</Badge>
                ))}
                {dataset.diagnosis && (
                  <Badge variant="outline">{dataset.diagnosis}</Badge>
                )}
              </div>
            </div>


            {/* Preview */}
            <div className="aspect-video bg-white rounded-lg overflow-hidden mb-6 p-2">
              <ImageWithFallback
                src={dataset.thumbnail}
                alt={dataset.title}
                className="w-full h-full object-contain"
              />
            </div>

         {/* Usage Statistics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Eye className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {isLoadingStats ? '...' : stats.viewCount.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Views</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <FileDown className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {isLoadingStats ? '...' : stats.downloadCount.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Downloads</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Quote className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {isLoadingStats ? '...' : stats.citationCount.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Citations</p>
                  </div>
                </div>
              </Card>
            </div>

            
            {/* Description */}
            <Card className="p-6 mb-6">
              <h3 className="mb-4">Description</h3>
              <p className="text-muted-foreground">{dataset.description}</p>
            </Card>

            {/* Data Access - Only show for BraTS-Africa dataset */}
            {dataset.id === '1' && (
              <Card className="p-6 mb-6">
                <h3 className="mb-4">Data Access</h3>
                
                <div className="mb-4">
                  <p className="mb-2">Version 1: Updated 2024/09/04</p>
                </div>

                {/* Data Access Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left p-3 border">Title</th>
                        <th className="text-left p-3 border">Data Type</th>
                        <th className="text-left p-3 border">Format</th>
                        <th className="text-left p-3 border">Access Points</th>
                        <th className="text-left p-3 border">Subjects</th>
                        <th className="text-left p-3 border">Series</th>
                        <th className="text-left p-3 border">Images</th>
                        <th className="text-left p-3 border">License</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-3 border">Radiology Images and Segmentations - BraTS 2023 Challenge</td>
                        <td className="p-3 border">MRI, Segmentation</td>
                        <td className="p-3 border">NIFTI</td>
                        <td className="p-3 border">
                          <Button 
                            size="sm" 
                            className="mb-1"
                            onClick={() => setShowAccessModal(true)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            DOWNLOAD (4 GB)
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1">
                            Download requires{' '}
                            <a
                              href="https://www.ibm.com/products/aspera/downloads#Client-deployed+software"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              IBM-Aspera-Connect plugin
                            </a>
                          </p>
                        </td>
                        <td className="p-3 border">146</td>
                        <td className="p-3 border">730</td>
                        <td className="p-3 border">730</td>
                        <td className="p-3 border">CC BY 4.0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Additional Info */}
            <Card className="p-6">
              <h3 className="mb-4">Dataset Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">Institution</p>
                    <p>{dataset.institution}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-accent mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">Country</p>
                    <p>{dataset.country}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">Participants</p>
                    <p>{dataset.participantCount}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Database className="w-5 h-5 text-accent mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">Modalities</p>
                    <p>{dataset.modality.join(', ')}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h3 className="mb-6">Access Dataset</h3>
              
              {dataset.accessType === 'Open' ? (
                <>
                  <p className="text-muted-foreground mb-6">
                    This dataset is openly available. Complete the Data Use Agreement to download.
                  </p>
                  <Button 
                    className="w-full mb-3"
                    onClick={() => setShowAccessModal(true)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Access Dataset
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground mb-6">
                    This dataset requires approval to access. Submit a request with your research purpose and agree to the data use terms.
                  </p>
                  <Button 
                    className="w-full mb-3"
                    onClick={() => setShowAccessModal(true)}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Request Access
                  </Button>
                </>
              )}
              
              <div className="mt-6 pt-6 border-t">
                <h4 className="mb-3">Ethical Standards</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>All data is anonymized</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Institutional ethics approval obtained</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Participant consent secured</span>
                  </li>
                </ul>
              </div>
            </Card>
          </div>
        </div>

        {/* Related Datasets */}
        {relatedDatasets.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-6" style={{ fontSize: '2rem', fontWeight: 700 }}>Related Datasets</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedDatasets.slice(0, 3).map((related) => (
                <Card key={related.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onViewDataset(related.id)}>
                  <div className="aspect-video bg-gray-100">
                    <ImageWithFallback
                      src={related.thumbnail}
                      alt={related.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="mb-2">{related.title}</h4>
                    <p className="text-muted-foreground">{related.country}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Data Access Request Modal */}
      <DataAccessRequestModal
        open={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        datasetTitle={dataset.title}
        datasetId={dataset.id}
        accessType={dataset.accessType}
      />
    </div>
  );
}