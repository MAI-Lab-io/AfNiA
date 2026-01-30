import React from 'react';
import { Database, Upload, MapPin, Users, Brain, Activity } from 'lucide-react';
import { Button } from './ui/button';
import { StatCard } from './StatCard';
import { Dataset } from './DatasetCard';
import '../styles/LandingPage.css'; // Make sure to import the CSS

interface LandingPageProps {
  onNavigate: (page: string) => void;
  datasets: Dataset[];
}

export function LandingPage({ onNavigate, datasets }: LandingPageProps) {
  const partners = [
    'Crestview Radiology Ltd - Nigeria',
    'CAMERA',
    'Lacuna Fund(our voice in data)',
    'Center for Global Health',
    'MINDLAB',
  ];

   // Calculate statistics dynamically from datasets
  const stats = {
    uniqueCountries: new Set(datasets.map(d => d.country)).size,
    uniqueInstitutions: new Set(datasets.map(d => d.institution)).size,
    totalParticipants: datasets.reduce((sum, d) => sum + d.participantCount, 0),
    totalDatasets: datasets.length,
  };

  // Calculate dataset types by modality and diagnosis
  const modalityTypes = new Map<string, number>();
  const diagnosisTypes = new Map<string, number>();

  datasets.forEach(dataset => {
    // Count modalities
    dataset.modality.forEach(mod => {
      modalityTypes.set(mod, (modalityTypes.get(mod) || 0) + 1);
    });

    // Count diagnosis types
    if (dataset.diagnosis) {
      diagnosisTypes.set(dataset.diagnosis, (diagnosisTypes.get(dataset.diagnosis) || 0) + 1);
    }
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-accent/5 to-transparent py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
  <div>
    <div className="mb-8 text-left">
      <h1 className="mb-6">
        <span style={{ fontSize: '3.5rem', fontWeight: 500, color: '#7C3AED' }}>
          Welcome to{' '}
        </span>
        <span style={{ fontSize: '3.5rem', fontWeight: 900, color: '#7C3AED' }}>
          AfNiA
        </span>
      </h1>
    </div>

    <h5 className="mb-6" style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.2 }}>
      Empowering African neuroscience through open, equitable neuroimaging data
    </h5>
    <p className="text-muted-foreground mb-8" style={{ fontSize: '1.125rem' }}>
      AfNiA collates and shares brain imaging datasets (MRI, CT, PET) from clinics and research centers across Africa, advancing medical research and improving healthcare outcomes.
    </p>
    <div className="flex flex-wrap gap-4">
      <Button size="lg" onClick={() => onNavigate('explore')}>
        Explore Datasets
      </Button>
      <Button size="lg" variant="outline" onClick={() => onNavigate('contribute')}>
        <Upload className="w-4 h-4 mr-2" />
        Contribute Data
      </Button>
    </div>
  </div>

  <div className="relative">
      <div className="rounded-2xl overflow-hidden shadow-2xl flex justify-center items-center bg-white">
        <img
         src="/Neuroimaging Data Analysis.png"
         alt="Brain scan visualization"
         className="max-w-full h-auto object-contain"
      />
</div>

    <div className="absolute -bottom-6 -left-6 bg-primary text-white p-6 rounded-xl shadow-xl">
      <Activity className="w-8 h-8 mb-2" />
      <p style={{ fontWeight: 700 }}>Advancing Research</p>
    </div>
  </div>
</div>

        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="mb-4" style={{ fontSize: '2.5rem', fontWeight: 700 }}>Our Mission</h2>
            <p className="text-muted-foreground" style={{ fontSize: '1.125rem' }}>
              AfNiA is building Africa's first comprehensive neuroimaging archive to democratize access to brain imaging data, 
              accelerate medical discoveries, and ensure African populations are represented in global neuroscience research.
            </p>
          </div>
        </div>
      </section>

    {/* Statistics */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-center mb-12" style={{ fontSize: '2.5rem', fontWeight: 700 }}>Impact at a Glance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard 
              icon={Database} 
              value={stats.uniqueInstitutions.toString()} 
              label="Partner Institutions" 
              color="primary" 
            />
            <StatCard 
              icon={MapPin} 
              value={stats.uniqueCountries.toString()} 
              label="Countries" 
              color="accent" 
            />
            <StatCard 
              icon={Brain} 
              value={stats.totalDatasets.toString()} 
              label="Datasets" 
              color="primary" 
            />
            <StatCard 
              icon={Users} 
              value={stats.totalParticipants.toLocaleString()} 
              label="Participants" 
              color="accent" 
            />
          </div>

          {/* Dataset Types */}
          <div className="mt-16">
            <h3 className="text-center mb-8" style={{ fontSize: '1.875rem', fontWeight: 600 }}>Dataset Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Imaging Modalities */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h4 className="mb-4" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Imaging Modalities</h4>
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
                          <span className="text-sm font-medium w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Clinical Conditions */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h4 className="mb-4" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Clinical Conditions</h4>
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
                          <span className="text-sm font-medium w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Partners - Scrolling */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-center mb-12" style={{ fontSize: '2.5rem', fontWeight: 700 }}>Our Partners</h2>
          <div className="overflow-hidden">
            <div className="scrolling-partners flex gap-8">
              {partners.map((partner, index) => (
                <div key={index} className="flex-shrink-0 p-6 bg-white border rounded-lg hover:shadow-md transition-shadow min-w-[200px]">
                  <p className="text-center text-muted-foreground">{partner}</p>
                </div>
              ))}
              {/* Duplicate for seamless loop */}
              {partners.map((partner, index) => (
                <div key={`dup-${index}`} className="flex-shrink-0 p-6 bg-white border rounded-lg hover:shadow-md transition-shadow min-w-[200px]">
                  <p className="text-center text-muted-foreground">{partner}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-accent text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4" style={{ fontSize: '2.5rem', fontWeight: 700 }}>Join the Movement</h2>
          <p className="mb-8 max-w-2xl mx-auto" style={{ fontSize: '1.125rem' }}>
            Be part of Africa's neuroscience revolution. Contribute your data or explore existing datasets to advance research and improve patient outcomes.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={() => onNavigate('contribute')}>
              Become a Partner
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10" onClick={() => onNavigate('explore')}>
              Browse Datasets
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}