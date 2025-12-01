import { ArrowLeft, Download, Lock, MapPin, Users, Calendar, Database } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Dataset } from './DatasetCard';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface DatasetDetailPageProps {
  dataset: Dataset;
  relatedDatasets: Dataset[];
  onBack: () => void;
  onViewDataset: (id: string) => void;
}

export function DatasetDetailPage({ dataset, relatedDatasets, onBack, onViewDataset }: DatasetDetailPageProps) {
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
            {/* Preview */}
            <div className="aspect-video bg-white rounded-lg overflow-hidden mb-6 p-2">  
              <ImageWithFallback
                src={dataset.thumbnail}
                alt={dataset.title}
                className="w-full h-full object-contain"
              />
            </div>

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

            {/* Description */}
            <Card className="p-6 mb-6">
              <h3 className="mb-4">Description</h3>
              <p className="text-muted-foreground">{dataset.description}</p>
            </Card>

            {/* Data Access - Only show for BraTS-Africa dataset */}
            {dataset.id === '1' && (
              <Card className="p-6 mb-6">
                <h3 className="mb-4">Data Access</h3>
                <p className="text-muted-foreground mb-4">
                  Some data in this collection contains images that could potentially be used to reconstruct a human face. 
                  Due to NIH Controlled Data Access Policy changes, downloads that are previously required login-access are 
                  no longer available via TCIA.
                </p>
                
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
                          <a
                            href="https://faspex.cancerimagingarchive.net/aspera/faspex/public/package?context=eyJyZXNvdXJjZSI6InBhY2thZ2VzIiwidHlwZSI6ImV4dGVybmFsX2Rvd25sb2FkX3BhY2thZ2UiLCJpZCI6Ijk0OCIsInBhc3Njb2RlIjoiOTg2MzVlMGRmNzc3NWQ0NWJmZTQ2NjlhYzQwNjNmYjcxMjU0MzI1NyIsInBhY2thZ2VfaWQiOiI5NDgiLCJlbWFpbCI6ImhlbHBAY2FuY2VyaW1hZ2luZ2FyY2hpdmUubmV0In0="
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block"
                          >
                            <Button size="sm" className="mb-1">
                              <Download className="w-4 h-4 mr-2" />
                              DOWNLOAD (4 GB)
                            </Button>
                          </a>
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
                    This dataset is openly available for download. By downloading, you agree to use the data ethically and cite the source appropriately.
                  </p>
                  {dataset.id === '1' ? (
                    <a
                      href="https://faspex.cancerimagingarchive.net/aspera/faspex/public/package?context=eyJyZXNvdXJjZSI6InBhY2thZ2VzIiwidHlwZSI6ImV4dGVybmFsX2Rvd25sb2FkX3BhY2thZ2UiLCJpZCI6Ijk0OCIsInBhc3Njb2RlIjoiOTg2MzVlMGRmNzc3NWQ0NWJmZTQ2NjlhYzQwNjNmYjcxMjU0MzI1NyIsInBhY2thZ2VfaWQiOiI5NDgiLCJlbWFpbCI6ImhlbHBAY2FuY2VyaW1hZ2luZ2FyY2hpdmUubmV0In0="
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button className="w-full mb-3">
                        <Download className="w-4 h-4 mr-2" />
                        Download Dataset
                      </Button>
                    </a>
                  ) : (
                    <Button className="w-full mb-3">
                      <Download className="w-4 h-4 mr-2" />
                      Download Dataset
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <p className="text-muted-foreground mb-6">
                    This dataset requires approval to access. Submit a request describing your research purpose and intended use.
                  </p>
                  <Button className="w-full mb-3">
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
    </div>
  );
}
