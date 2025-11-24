import React from 'react';
import { Database, Upload, MapPin, Users, Brain, Activity } from 'lucide-react';
import { Button } from './ui/button';
import { StatCard } from './StatCard';
import { ImageWithFallback } from './figma/ImageWithFallback';
import '../styles/LandingPage.css'; // Make sure to import the CSS

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const partners = [
    'Crestview Radiology Ltd - Nigeria',
    'CAMERA',
    'Lacuna Fund(our voice in data)',
    'Center for Global Health',
    'MINDLAB',
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-accent/5 to-transparent py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
  <div>
    <div className="mb-8 text-left">
      <h1 className="mb-6">
        <span style={{ fontSize: '2rem', fontWeight: 500, color: '#fd9d4eff' }}>
          Welcome to{' '}
        </span>
        <span style={{ fontSize: '3.5rem', fontWeight: 900, color: '#7C3AED' }}>
          AfNIA
        </span>
      </h1>
    </div>

    <h5 className="mb-6" style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.2 }}>
      Empowering African neuroscience through open, equitable neuroimaging data
    </h5>
    <p className="text-muted-foreground mb-8" style={{ fontSize: '1.125rem' }}>
      AfNIA aggregates and shares brain imaging datasets (MRI, CT, PET) from clinics and research centers across Africa, advancing medical research and improving healthcare outcomes.
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
    <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
      <ImageWithFallback
        src="src/assets/Neuroimaging Data Analysis in Action.png"
        alt="Brain scan visualization"
        className="w-full h-full object-cover"
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
              AfNIA is building Africa's first comprehensive neuroimaging archive to democratize access to brain imaging data, 
              accelerate medical discoveries, and ensure African populations are represented in global neuroscience research.
            </p>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-center mb-12" style={{ fontSize: '2.5rem', fontWeight: 700 }}>Impact at a Glance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={MapPin} value="12" label="Partner Clinics" color="primary" />
            <StatCard icon={Database} value="8" label="Countries" color="accent" />
            <StatCard icon={Brain} value="10,000+" label="Brain Scans" color="primary" />
            <StatCard icon={Users} value="5,000+" label="Participants" color="accent" />
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
