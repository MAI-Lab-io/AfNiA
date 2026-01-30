import { Target, Users, Globe, Heart, MapPin } from 'lucide-react';
import { Card } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function AboutPage() {
  const team = [
        {
      name: 'Dr. Abiodun Fatade, MBBSS, FWACS',
      role: 'Managing Director',
      institution: 'Crestview Radiology, Lagos',
      country: 'Nigeria',
    },
    {
      name: 'Dr. Udunna Anazodo, Ph.D',
      role: 'Scientific Director',
      institution: 'McGill University, Quebec',
      country: 'Canada',
    },
    {
      name: 'Dr. Maruf Adewole, PhD.',
      role: 'Ethics & Compliance',
      institution: 'University of Pennsylvania',
      country: 'USA',
    },
    {
      name: 'Dr. Farouk Dako, MD, MPH',
      role: 'Technical Lead',
      institution: 'University of Pennsylvania',
      country: 'USA',
    },
    {
      name: 'Dr. Oluyemisi Toyobo, MBBSS, FWACS',
      role: 'Research Coordinator',
      institution: 'Crestview Radiology, Lagos',
      country: 'Nigeria',
    },
  ];

  const contributingSites = [
    { country: 'Nigeria', sites: 3, city: 'Lagos' },
    { country: 'Kenya', sites: 2, city: 'Nairobi' },
    { country: 'South Africa', sites: 2, city: 'Cape Town' },
    { country: 'Ghana', sites: 1, city: 'Accra' },
    { country: 'Egypt', sites: 2, city: 'Cairo' },
    { country: 'Uganda', sites: 1, city: 'Kampala' },
    { country: 'Tanzania', sites: 1, city: 'Dar es Salaam' },
  ];

  const values = [
    {
      icon: Target,
      title: 'Scientific Excellence',
      description: 'Maintaining the highest standards in data quality, curation, and accessibility.',
    },
    {
      icon: Globe,
      title: 'Pan-African Collaboration',
      description: 'Building bridges between researchers, clinicians, and institutions across the continent.',
    },
    {
      icon: Heart,
      title: 'Equity & Inclusion',
      description: 'Ensuring African populations are represented in global neuroscience research.',
    },
    {
      icon: Users,
      title: 'Open Science',
      description: 'Democratizing access to data while respecting ethical standards and participant privacy.',
    },
  ];

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="mb-6" style={{ fontSize: '2.5rem', fontWeight: 700 }}>About AfNIA</h1>
          <p className="text-muted-foreground" style={{ fontSize: '1.125rem' }}>
            The African NeuroImaging Archive is a pioneering initiative to build Africa's first comprehensive 
            neuroimaging data repository, advancing medical research and ensuring equitable representation 
            in global neuroscience.
          </p>
        </div>

        {/* Mission */}
        <div className="mb-16 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="rounded-lg overflow-hidden shadow-xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1669854310488-542a99280b8a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2ElMjBtYXAlMjBjb250aW5lbnR8ZW58MXx8fHwxNzYzMTExNzUwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Africa map"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="mb-4" style={{ fontSize: '2rem', fontWeight: 700 }}>Our Mission</h2>
              <p className="text-muted-foreground mb-4">
                AfNIA was founded in 2023 to address the critical underrepresentation of African populations 
                in neuroimaging research. By aggregating and sharing brain imaging data from clinics and 
                research centers across the continent, we aim to:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Accelerate discoveries in African neuroscience and mental health</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Improve diagnostic tools and treatments for African patients</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Foster collaboration between African researchers and global institutions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Build local capacity in neuroimaging and data science</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-center mb-12" style={{ fontSize: '2rem', fontWeight: 700 }}>Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-6 h-6" />
                </div>
                <h4 className="mb-2">{value.title}</h4>
                <p className="text-muted-foreground">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>

{/* Contributing Sites Map */}
<div className="mb-16">
  <h2
    className="text-center mb-12"
    style={{ fontSize: '2rem', fontWeight: 700 }}
  >
    Contributing Sites Across Africa
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

    {/* Interactive Map */}
    <div className="rounded-lg overflow-hidden shadow-lg h-96">

      <iframe
        title="Africa Contributing Sites Map"
        className="w-full h-full border-0"
        loading="lazy"
        src="
https://www.openstreetmap.org/export/embed.html
?bbox=-25,-40,60,40
&layer=mapnik
&marker=6.5244,3.3792
&marker=-1.2864,36.8172
&marker=-33.9249,18.4241
&marker=5.6037,-0.1870
&marker=30.0444,31.2357
&marker=0.3476,32.5825
&marker=-6.7924,39.2083
"
      />

    </div>

    {/* Site List */}
    <div>
      <h3 className="mb-6">Network Coverage</h3>

      <div className="space-y-3">
        {contributingSites.map((site, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <p>{site.country}</p>
                  <p className="text-muted-foreground">{site.city}</p>
                </div>
              </div>

              <div
                className="text-primary"
                style={{ fontWeight: 700 }}
              >
                {site.sites} {site.sites === 1 ? 'site' : 'sites'}
              </div>

            </div>
          </Card>
        ))}
      </div>
    </div>

  </div>
</div>


        {/* Team */}
        <div className="mb-16">
          <h2 className="text-center mb-12" style={{ fontSize: '2rem', fontWeight: 700 }}>Leadership Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <Card key={index} className="p-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full mx-auto mb-4 flex items-center justify-center text-white" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h4 className="mb-1">{member.name}</h4>
                <p className="text-primary mb-2">{member.role}</p>
                <p className="text-muted-foreground">{member.institution}</p>
                <p className="text-muted-foreground">{member.country}</p>
              </Card>
            ))}
          </div>
        </div>

   {/* Founding Institutions */}
        <div className="mb-16">
          <h2 className="text-center mb-6 text-3xl font-bold">Founding Institutions</h2>

          <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
            AfNIA was established through a collaborative effort of leading research institutions and
            medical centers across Africa, with support from international partners.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">

            <Card className="p-5 hover:shadow-md transition-shadow">
              <a
                href="https://www.mcgill.ca/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4"
              >
                <img src="/mcgill_logo.jpg" alt="McGill Logo" className="h-12 object-contain" />
                <div>
                  <p className="font-semibold">McGill University</p>
                  <p className="text-muted-foreground">Canada</p>
                </div>
              </a>
            </Card>

            <Card className="p-5 hover:shadow-md transition-shadow">
              <a
                href="https://www.mcgill.ca/neuro/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4"
              >
                <img src="/neuro_logo_horiz_rgb_eng_0.png" alt="MNI Logo" className="h-12 object-contain" />
                <div>
                  <p className="font-semibold">Montreal Neurological Institute–Hospital</p>
                  <p className="text-muted-foreground">Canada</p>
                </div>
              </a>
            </Card>

            <Card className="p-5 hover:shadow-md transition-shadow">
              <a
                href="https://mailab.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4"
              >
                <img src="MAI_LAB_LOGO-removebg-preview-edited-22.png" alt="MAI Lab Logo" className="h-12 object-contain" />
                <div>
                  <p className="font-semibold">Medical Artificial Intelligence Laboratory</p>
                  <p className="text-muted-foreground">Nigeria</p>
                </div>
              </a>
            </Card>

            <Card className="p-5 hover:shadow-md transition-shadow">
              <a
                href="https://www.linkedin.com/company/crestviewradiology/?originalSubdomain=ng/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4"
              >
                <img src="/sponsor3.cca72af6d5bdfa0e9e23.png" alt="Crestview Radiology Logo" className="h-12 object-contain" />
                <div>
                  <p className="font-semibold">Crestview Radiology Ltd</p>
                  <p className="text-muted-foreground">Nigeria</p>
                </div>
              </a>
            </Card>

            <Card className="p-5 hover:shadow-md transition-shadow">
              <a
                href="https://www3.pennmedicine.org/departments-and-centers/department-of-radiology/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4"
              >
                <img src="/ug_med_logo.png" alt="UGMS Logo" className="h-12 object-contain" />
                <div>
                  <p className="font-semibold">Department of Radiology, University of Pennsylvania</p>
                  <p className="text-muted-foreground">United States</p>
                </div>
              </a>
            </Card>

          </div>
        </div>

      </div>
    </div>
  );
}
