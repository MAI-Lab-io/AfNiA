import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { FileText, CheckCircle, Loader2 } from 'lucide-react';

interface DataAccessRequestModalProps {
  open: boolean;
  onClose: () => void;
  datasetTitle: string;
  datasetId: string;
  accessType: 'Open' | 'Restricted';
}

export function DataAccessRequestModal({ 
  open, 
  onClose, 
  datasetTitle, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  datasetId,
  accessType 
}: DataAccessRequestModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    institution: '',
    position: '',
    researchPurpose: '',
    intendedUse: '',
  });

  const [agreements, setAgreements] = useState({
    dataUseAgreement: false,
    ethicsCompliance: false,
    citationAgreement: false,
    noRedistribution: false,
    dataProtection: false,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAgreementChange = (field: string, checked: boolean) => {
    setAgreements(prev => ({ ...prev, [field]: checked }));
  };

  const allAgreementsChecked = Object.values(agreements).every(v => v);
  const formValid = formData.fullName && formData.email && formData.institution && 
                   formData.researchPurpose && formData.intendedUse;

  const handleSubmit = async () => {
    if (!formValid || !allAgreementsChecked) return;
    
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setLoading(false);
    setSubmitted(true);
  };

  const handleClose = () => {
    setStep(1);
    setSubmitted(false);
    setFormData({
      fullName: '',
      email: '',
      institution: '',
      position: '',
      researchPurpose: '',
      intendedUse: '',
    });
    setAgreements({
      dataUseAgreement: false,
      ethicsCompliance: false,
      citationAgreement: false,
      noRedistribution: false,
      dataProtection: false,
    });
    onClose();
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="mb-3">Request Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              {accessType === 'Open' 
                ? 'You can now download the dataset. Check your email for download instructions and the data use agreement.'
                : 'Your access request has been submitted for review. You will receive an email notification once your request is processed (typically within 2-5 business days).'
              }
            </p>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {accessType === 'Open' ? 'Data Access Agreement' : 'Request Dataset Access'}
          </DialogTitle>
          <DialogDescription>
            {datasetTitle}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step >= 1 ? 'bg-primary text-white' : 'bg-gray-200'
          }`}>
            1
          </div>
          <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step >= 2 ? 'bg-primary text-white' : 'bg-gray-200'
          }`}>
            2
          </div>
        </div>

        <ScrollArea className="max-h-[60vh] pr-4">
          {step === 1 ? (
            /* Step 1: User Information */
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Dr. Jane Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="jane.doe@university.edu"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="institution">Institution/Organization *</Label>
                <Input
                  id="institution"
                  value={formData.institution}
                  onChange={(e) => handleInputChange('institution', e.target.value)}
                  placeholder="University of Cape Town"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position/Title</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  placeholder="Research Fellow, Neuroscience Department"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="researchPurpose">Research Purpose *</Label>
                <Textarea
                  id="researchPurpose"
                  value={formData.researchPurpose}
                  onChange={(e) => handleInputChange('researchPurpose', e.target.value)}
                  placeholder="Briefly describe your research project and objectives..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="intendedUse">Intended Use of Data *</Label>
                <Textarea
                  id="intendedUse"
                  value={formData.intendedUse}
                  onChange={(e) => handleInputChange('intendedUse', e.target.value)}
                  placeholder="Describe how you plan to use this dataset (e.g., algorithm development, validation, statistical analysis)..."
                  rows={4}
                  required
                />
              </div>

              <Button 
                onClick={() => setStep(2)} 
                className="w-full"
                disabled={!formValid}
              >
                Continue to Agreement
              </Button>
            </div>
          ) : (
            /* Step 2: Data Use Agreement */
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h3 className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Data Use Agreement
                </h3>
                
                <div className="text-sm text-muted-foreground space-y-3">
                  <p>
                    By accessing this dataset, you agree to the following terms and conditions:
                  </p>
                  
                  <div className="space-y-2 pl-4">
                    <p><strong>1. Permitted Use:</strong> The data may only be used for non-commercial research and educational purposes as described in your access request.</p>
                    
                    <p><strong>2. Data Protection:</strong> You will implement appropriate security measures to protect the confidentiality of the data and prevent unauthorized access.</p>
                    
                    <p><strong>3. No Re-identification:</strong> You will not attempt to identify or contact any individual participants in the dataset.</p>
                    
                    <p><strong>4. Citation Requirement:</strong> You will acknowledge the use of this dataset in all publications, presentations, and reports by citing the dataset appropriately.</p>
                    
                    <p><strong>5. No Redistribution:</strong> You will not share, transfer, or redistribute the dataset to any third party without explicit permission from AfNIA.</p>
                    
                    <p><strong>6. Ethics Compliance:</strong> You confirm that your research has received appropriate ethical approval from your institution or that such approval is not required.</p>
                    
                    <p><strong>7. Termination:</strong> AfNIA reserves the right to terminate your access if you violate any terms of this agreement.</p>
                    
                    <p><strong>8. No Warranties:</strong> The data is provided "as is" without any warranties. AfNIA is not liable for any damages arising from the use of this data.</p>
                  </div>
                </div>
              </div>

              {/* Agreement Checkboxes */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="dataUseAgreement"
                    checked={agreements.dataUseAgreement}
                    onCheckedChange={(checked) => 
                      handleAgreementChange('dataUseAgreement', checked as boolean)
                    }
                  />
                  <label htmlFor="dataUseAgreement" className="text-sm cursor-pointer">
                    I have read and agree to the Data Use Agreement above
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="ethicsCompliance"
                    checked={agreements.ethicsCompliance}
                    onCheckedChange={(checked) => 
                      handleAgreementChange('ethicsCompliance', checked as boolean)
                    }
                  />
                  <label htmlFor="ethicsCompliance" className="text-sm cursor-pointer">
                    I confirm that my research complies with applicable ethical standards and regulations
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="citationAgreement"
                    checked={agreements.citationAgreement}
                    onCheckedChange={(checked) => 
                      handleAgreementChange('citationAgreement', checked as boolean)
                    }
                  />
                  <label htmlFor="citationAgreement" className="text-sm cursor-pointer">
                    I will properly cite this dataset in all publications and presentations
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="noRedistribution"
                    checked={agreements.noRedistribution}
                    onCheckedChange={(checked) => 
                      handleAgreementChange('noRedistribution', checked as boolean)
                    }
                  />
                  <label htmlFor="noRedistribution" className="text-sm cursor-pointer">
                    I will not redistribute or share this dataset with others
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="dataProtection"
                    checked={agreements.dataProtection}
                    onCheckedChange={(checked) => 
                      handleAgreementChange('dataProtection', checked as boolean)
                    }
                  />
                  <label htmlFor="dataProtection" className="text-sm cursor-pointer">
                    I will implement appropriate security measures to protect the data
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(1)} 
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  className="flex-1"
                  disabled={!allAgreementsChecked || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}