import { useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { ExplorePage } from './components/ExplorePage';
import { DatasetDetailPage } from './components/DatasetDetailPage';
import { ContributePage } from './components/ContributePage';
import { AboutPage } from './components/AboutPage';
import { Dataset } from './components/DatasetCard';
import bratsAfricaThumbnail from '/home/mailab/AfNiA/src/assets/BRATS_banner_noCaption.png';
import preciseLogo from '/home/mailab/AfNiA/src/assets/pppp.jpg';

// Mock dataset data
const mockDatasets: Dataset[] = [
  {
    id: '1',
    title: 'BraTs-Africa Dataset',
    institution: 'Six Diagnostic Centers (Nigeria)',
    country: 'Nigeria',
    modality: ['MRI', 'Segmentation'],
    diagnosis: 'Brain Cancer',
    participantCount: 146,
    thumbnail: bratsAfricaThumbnail,
    description: 'Collection of retrospective pre-operative brain magnetic resonance imaging (MRI) scans, clinically acquired from six diagnostic centers in Nigeria. Dataset includes 146 patients with high-grade brain MRIs indicating central nervous system neoplasms, diffuse glioma, low-grade glioma, or glioblastoma. The brain scans are multiparametric MRI images (mpMRI), specifically T1, T1 CE, T2, and T2 FLAIR, acquired on 1.5T MRI between January 2019 and December 2022.',
    accessType: 'Open',
  },
  {
    id: '2',
    title: 'The PRECISE-ABreast Challenge Dataset',
    institution: 'PRECISE Consortium',
    country: 'Multi-country (Sub-Saharan Africa)',
    modality: ['Ultrasound', 'BUS'],
    diagnosis: 'Breast Cancer',
    participantCount: 7354,
    thumbnail: preciseLogo,
    description: 'Multi-institutional breast ultrasound (BUS) dataset for breast cancer detection, classification, and segmentation. Integrates images from BUSI, BrEaST, and BUS-BRA datasets, including benign, malignant, and normal cases from community-dwelling women in sub-Saharan Africa. Comprises 7,354 images with expert-verified annotations for robust algorithm development.',
    accessType: 'Restricted',
  },
  {
    id: '3',
    title: 'Epilepsy Surgical Planning Database',
    institution: 'KEMRI',
    country: 'Kenya',
    modality: ['MRI', 'PET'],
    diagnosis: 'Epilepsy',
    participantCount: 156,
    thumbnail: 'https://images.unsplash.com/photo-1549925245-f20a1bac6454?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmFpbiUyMHNjYW4lMjBNUkklMjBuZXVyb2ltYWdpbmd8ZW58MXx8fHwxNzYzMTExNzUwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    description: 'Pre-surgical neuroimaging dataset for epilepsy patients undergoing evaluation for surgical intervention. Combines high-resolution structural MRI with PET imaging for seizure focus localization.',
    accessType: 'Restricted',
  },
  {
    id: '4',
    title: 'Alzheimer\'s Disease Biomarkers',
    institution: 'Cairo Medical Center',
    country: 'Egypt',
    modality: ['MRI', 'PET'],
    diagnosis: 'Alzheimer\'s',
    participantCount: 189,
    thumbnail: 'https://images.unsplash.com/photo-1647613561332-3d88a6a0048e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmFpbiUyMG5ldXJvc2NpZW5jZSUyMHJlc2VhcmNofGVufDF8fHx8MTc2MzExMTc1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    description: 'Multi-modal neuroimaging study investigating Alzheimer\'s disease biomarkers in Egyptian populations. Includes amyloid PET, tau PET, and structural MRI with neuropsychological assessments.',
    accessType: 'Open',
  },
  {
    id: '5',
    title: 'Traumatic Brain Injury Outcomes',
    institution: 'Makerere University',
    country: 'Uganda',
    modality: ['CT', 'MRI'],
    diagnosis: 'TBI',
    participantCount: 324,
    thumbnail: 'https://images.unsplash.com/photo-1549925245-f20a1bac6454?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmFpbiUyMHNjYW4lMjBNUkklMjBuZXVyb2ltYWdpbmd8ZW58MXx8fHwxNzYzMTExNzUwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    description: 'Prospective study of traumatic brain injury patients with acute CT imaging and follow-up MRI scans. Tracks recovery trajectories and identifies predictors of long-term outcomes.',
    accessType: 'Open',
  },
  {
    id: '6',
    title: 'Multiple Sclerosis Registry',
    institution: 'University of Ghana Medical School',
    country: 'Ghana',
    modality: ['MRI'],
    diagnosis: 'Multiple Sclerosis',
    participantCount: 98,
    thumbnail: 'https://images.unsplash.com/photo-1647613561332-3d88a6a0048e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmFpbiUyMG5ldXJvc2NpZW5jZSUyMHJlc2VhcmNofGVufDF8fHx8MTc2MzExMTc1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    description: 'Registry of multiple sclerosis patients in West Africa with serial MRI scans documenting disease progression and treatment response over time.',
    accessType: 'Restricted',
  },
  {
    id: '7',
    title: 'Healthy Adult Brain Atlas',
    institution: 'University of Cape Town',
    country: 'South Africa',
    modality: ['MRI', 'DTI', 'fMRI'],
    participantCount: 567,
    thumbnail: 'https://images.unsplash.com/photo-1549925245-f20a1bac6454?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmFpbiUyMHNjYW4lMjBNUkklMjBuZXVyb2ltYWdpbmd8ZW58MXx8fHwxNzYzMTExNzUwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    description: 'Comprehensive normative dataset of healthy adults aged 18-65 years. Multi-modal imaging including structural MRI, DTI, and resting-state fMRI for establishing population norms.',
    accessType: 'Open',
  },
  {
    id: '8',
    title: 'Parkinson\'s Disease Progression',
    institution: 'Lagos University Hospital',
    country: 'Nigeria',
    modality: ['MRI', 'PET'],
    diagnosis: 'Parkinson\'s',
    participantCount: 134,
    thumbnail: 'https://images.unsplash.com/photo-1647613561332-3d88a6a0048e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmFpbiUyMG5ldXJvc2NpZW5jZSUyMHJlc2VhcmNofGVufDF8fHx8MTc2MzExMTc1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    description: 'Longitudinal study tracking Parkinson\'s disease progression in West African patients. Includes dopamine transporter PET imaging and structural MRI with clinical motor assessments.',
    accessType: 'Restricted',
  },
];

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setSelectedDatasetId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewDataset = (id: string) => {
    setSelectedDatasetId(id);
    setCurrentPage('dataset-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectedDataset = mockDatasets.find(d => d.id === selectedDatasetId);
  const relatedDatasets = selectedDataset
    ? mockDatasets.filter(d => 
        d.id !== selectedDataset.id && 
        (d.country === selectedDataset.country || 
         d.modality.some(m => selectedDataset.modality.includes(m)))
      )
    : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header currentPage={currentPage} onNavigate={handleNavigate} />
      
      <main className="flex-1">
        {currentPage === 'home' && <LandingPage onNavigate={handleNavigate} />}
        {currentPage === 'explore' && (
          <ExplorePage datasets={mockDatasets} onViewDataset={handleViewDataset} />
        )}
        {currentPage === 'dataset-detail' && selectedDataset && (
          <DatasetDetailPage
            dataset={selectedDataset}
            relatedDatasets={relatedDatasets}
            onBack={() => handleNavigate('explore')}
            onViewDataset={handleViewDataset}
          />
        )}
        {currentPage === 'contribute' && <ContributePage onNavigate={handleNavigate} />}
        {currentPage === 'about' && <AboutPage />}
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default App;

