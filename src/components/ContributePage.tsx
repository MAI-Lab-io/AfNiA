import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import { Upload, CheckCircle, Shield, FileText, Users, HelpCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ContributePageProps {
  onNavigate: (page: string) => void;
}

/** EmailJS credentials (from you) */
const EMAILJS_SERVICE_ID = 'service_ccmymuk';
const EMAILJS_TEMPLATE_ID = 'template_1bljph7';
const EMAILJS_PUBLIC_KEY = 'Ptmb_rR6hoRn-5ghD';

export function ContributePage({ onNavigate }: ContributePageProps) {
  const steps = [
    {
      number: 1,
      icon: FileText,
      title: 'Dataset',
      description: 'Provide detail information of the dataset.',
    },
    {
      number: 2,
      icon: Shield,
      title: 'Ensure Ethics Compliance',
      description:
        'Confirm all data is anonymized and meets ethical standards with proper participant consent.',
    },
    {
      number: 3,
      icon: Upload,
      title: 'Upload Dataset',
      description: 'Use our secure platform to upload neuroimaging data with detailed metadata.',
    },
    {
      number: 4,
      icon: CheckCircle,
      title: 'Review & Publish',
      description:
        'Our team reviews your submission for quality and compliance before making it available.',
    },
  ];

  const [form, setForm] = useState({
    institution: '',
    country: '',
    name: '',
    email: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<null | 'ok' | 'err'>(null);
  const [errMsg, setErrMsg] = useState<string>('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    if (sent) setSent(null);
  };

  const validate = () => {
    if (!form.institution.trim()) return 'Please enter your institution.';
    if (!form.country.trim()) return 'Please enter your country.';
    if (!form.name.trim()) return 'Please enter your name.';
    if (!form.email.trim()) return 'Please enter your email.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Please enter a valid email.';
    if (!form.message.trim()) return 'Please describe your dataset.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg('');
    const v = validate();
    if (v) {
      setErrMsg(v);
      setSent('err');
      return;
    }

    setSending(true);
    try {
      // This subject will be available as {{subject}} in your EmailJS template
      const subject = `AfNIA Partnership Request from ${form.institution}`;

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          institution: form.institution,
          country: form.country,
          name: form.name,
          email: form.email,
          message: form.message,
          subject,
        },
        { publicKey: EMAILJS_PUBLIC_KEY }
      );

      setSent('ok');
      setForm({ institution: '', country: '', name: '', email: '', message: '' });
    } catch (err: any) {
      setErrMsg('Failed to send. Please try again or email us directly.');
      setSent('err');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="mb-4" style={{ fontSize: '2.5rem', fontWeight: 700 }}>
            Contribute Data to AfNIA
          </h1>
          <p className="text-muted-foreground" style={{ fontSize: '1.125rem' }}>
            Join our network of research institutions and clinics advancing African neuroscience.
            Your data contributions help build a more representative and equitable future for brain research.
          </p>
        </div>

        {/* Steps */}
        <div className="mb-16">
          <h2 className="text-center mb-12" style={{ fontSize: '2rem', fontWeight: 700 }}>
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <Card key={step.number} className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-6 h-6" />
                </div>
                <div className="text-primary mb-2" style={{ fontWeight: 700 }}>
                  Step {step.number}
                </div>
                <h4 className="mb-2">{step.title}</h4>
                <p className="text-muted-foreground">{step.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Ethical Standards */}
        <div className="mb-16 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="w-12 h-12 bg-primary text-white rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="mb-4" style={{ fontSize: '2rem', fontWeight: 700 }}>
                Ethical Standards & Anonymization
              </h2>
              <p className="text-muted-foreground mb-6">
                AfNIA is committed to the highest ethical standards in data sharing. We ensure:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Complete anonymization of all participant data</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Institutional ethics board approval for all datasets</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Informed consent from all participants</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Compliance with international data protection regulations</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Secure data transmission and storage protocols</span>
                </li>
              </ul>
            </div>
            <div className="rounded-lg overflow-hidden shadow-xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1631557675489-a923dfbda67d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwcmVzZWFyY2glMjBsYWJvcmF0b3J5fGVufDF8fHx8MTc2MzA3MDc1NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Medical research laboratory"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            <h2 className="mb-6" style={{ fontSize: '2rem', fontWeight: 700 }}>
              Become a Partner
            </h2>
            <p className="text-muted-foreground mb-6">
              Interested in contributing data? Fill out this form and our team will get in touch with you.
            </p>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="institution">Institution Name</Label>
                  <Input
                    id="institution"
                    placeholder="Your institution"
                    value={form.institution}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    placeholder="Country"
                    value={form.country}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Contact Name</Label>
                  <Input id="name" placeholder="Your name" value={form.name} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="message">Tell us about your dataset</Label>
                <Textarea
                  id="message"
                  placeholder="Describe the type of neuroimaging data you'd like to contribute, number of participants, modalities, etc."
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                />
              </div>

              {sent === 'ok' && (
                <div className="rounded-md border border-green-200 bg-green-50 p-3 text-green-700 text-sm">
                  ✅ Thank you! Your request was sent. We’ll be in touch soon.
                </div>
              )}
              {sent === 'err' && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
                  ❌ {errMsg || 'Something went wrong.'}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={sending}>
                <Users className="w-4 h-4 mr-2" />
                {sending ? 'Sending…' : 'Submit Partnership Request'}
              </Button>
            </form>
          </Card>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-center mb-8" style={{ fontSize: '2rem', fontWeight: 700 }}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex gap-4">
                <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="mb-2">What types of data can I contribute?</h4>
                  <p className="text-muted-foreground">
                    We accept MRI, CT, PET scans and other neuroimaging modalities. Data should be properly
                    anonymized and accompanied by metadata.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex gap-4">
                <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="mb-2">How is data anonymization ensured?</h4>
                  <p className="text-muted-foreground">
                    We provide tools and guidelines for proper anonymization. Our team also reviews all submissions
                    to ensure compliance before publication.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex gap-4">
                <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="mb-2">Will I receive attribution for my contributions?</h4>
                  <p className="text-muted-foreground">
                    Yes! All datasets include proper attribution to the contributing institution and researchers.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
