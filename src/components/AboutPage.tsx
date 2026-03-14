import { Target, Users, Globe, Heart, MapPin } from "lucide-react";
import { Card } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const mailabIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type Site = {
  country: string;
  sites: number;
  city: string;
  lat: number;
  lng: number;
  isMailab?: boolean;
};

export function AboutPage() {
  const contributingSites: Site[] = [
    { country: "Nigeria", sites: 3, city: "Lagos", lat: 6.5244, lng: 3.3792 },
    { country: "Kenya", sites: 2, city: "Nairobi", lat: -1.2864, lng: 36.8172 },
    { country: "South Africa", sites: 2, city: "Cape Town", lat: -33.9249, lng: 18.4241 },
    { country: "Ghana", sites: 1, city: "Accra", lat: 5.6037, lng: -0.1870 },
    { country: "Egypt", sites: 2, city: "Cairo", lat: 30.0444, lng: 31.2357 },
    { country: "Uganda", sites: 1, city: "Kampala", lat: 0.3476, lng: 32.5825 },
    { country: "Tanzania", sites: 1, city: "Dar es Salaam", lat: -6.7924, lng: 39.2083 },
  ];

  const mailabSite: Site = {
    country: "Nigeria",
    sites: 1,
    city: "MAI Lab",
    lat: 6.5244,
    lng: 3.3792,
    isMailab: true,
  };

  const values = [
    {
      icon: Target,
      title: "Scientific Excellence",
      description:
        "Maintaining the highest standards in data quality, curation, and accessibility.",
    },
    {
      icon: Globe,
      title: "Pan-African Collaboration",
      description:
        "Building bridges between researchers, clinicians, and institutions across the continent.",
    },
    {
      icon: Heart,
      title: "Equity & Inclusion",
      description:
        "Ensuring African populations are represented in global neuroscience research.",
    },
    {
      icon: Users,
      title: "Open Science",
      description:
        "Democratizing access to data while respecting ethical standards and participant privacy.",
    },
  ];

  const networkLines = contributingSites.map((site) => [
    [mailabSite.lat, mailabSite.lng],
    [site.lat, site.lng],
  ]) as [number, number][][];

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="mb-6" style={{ fontSize: "2.5rem", fontWeight: 700 }}>
            About AfNIA
          </h1>
          <p className="text-muted-foreground" style={{ fontSize: "1.125rem" }}>
            The African NeuroImaging Archive is a pioneering initiative to build
            Africa&apos;s first comprehensive neuroimaging data repository,
            advancing medical research and ensuring equitable representation in
            global neuroscience.
          </p>
        </div>

        {/* Mission */}
        <div className="mb-16 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-8 md:p-12">
          <div className="flex flex-col items-center text-center gap-8">
            <div className="rounded-lg overflow-hidden shadow-xl w-full max-w-4xl">
              <div className="aspect-[16/9] w-full">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1669854310488-542a99280b8a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2ElMjBtYXAlMjBjb250aW5lbnR8ZW58MXx8fHwxNzYzMTExNzUwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Africa map"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="w-full max-w-3xl">
              <h2 className="mb-4" style={{ fontSize: "2rem", fontWeight: 700 }}>
                Our Mission
              </h2>

              <p className="text-muted-foreground mb-6">
                AfNiA was founded in 2023 to address the critical underrepresentation of
                African populations in neuroimaging research. By aggregating and sharing
                brain imaging data from clinics and research centers across the continent,
                we aim to:
              </p>

              <ul className="space-y-2 text-muted-foreground text-left mx-auto max-w-2xl">
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
          <h2 className="text-center mb-12" style={{ fontSize: "2rem", fontWeight: 700 }}>
            Our Values
          </h2>
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
          <h2 className="text-center mb-12" style={{ fontSize: "2rem", fontWeight: 700 }}>
            Contributing Sites Across Africa
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Real interactive network map */}
            <div className="rounded-lg overflow-hidden shadow-lg h-96 border">
              <MapContainer
                center={[5, 20]}
                zoom={3}
                scrollWheelZoom={true}
                className="w-full h-full"
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Connection lines from MAI Lab to other nodes */}
                {networkLines.map((line, index) => (
                  <Polyline
                    key={index}
                    positions={line}
                    pathOptions={{ color: "#7C3AED", weight: 2, opacity: 0.7 }}
                  />
                ))}

                {/* MAI Lab central node */}
                <Marker position={[mailabSite.lat, mailabSite.lng]} icon={mailabIcon}>
                  <Popup>
                    <div>
                      <strong>MAI Lab</strong>
                      <br />
                      Lagos, Nigeria
                      <br />
                      Central coordination / pinned node
                    </div>
                  </Popup>
                </Marker>

                <CircleMarker
                  center={[mailabSite.lat, mailabSite.lng]}
                  radius={14}
                  pathOptions={{ color: "#7C3AED", fillColor: "#7C3AED", fillOpacity: 0.15 }}
                />

                {/* Contributing sites */}
                {contributingSites.map((site, index) => (
                  <Marker key={index} position={[site.lat, site.lng]} icon={defaultIcon}>
                    <Popup>
                      <div>
                        <strong>{site.country}</strong>
                        <br />
                        {site.city}
                        <br />
                        {site.sites} {site.sites === 1 ? "site" : "sites"}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* Site List */}
            <div>
              <h3 className="mb-6">Network Coverage</h3>

              <div className="space-y-3">
                <Card className="p-4 border-purple-200 bg-purple-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="font-semibold text-purple-700">MAI Lab</p>
                        <p className="text-muted-foreground">Lagos, Nigeria</p>
                      </div>
                    </div>
                    <div className="text-purple-700" style={{ fontWeight: 700 }}>
                      Hub
                    </div>
                  </div>
                </Card>

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

                      <div className="text-primary" style={{ fontWeight: 700 }}>
                        {site.sites} {site.sites === 1 ? "site" : "sites"}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Founding Institutions */}
        <div className="mb-16">
          <h2 className="text-center mb-6 text-3xl font-bold">Founding Institutions</h2>

          <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
            AfNIA was established through a collaborative effort of leading research institutions and
            medical centers across Africa, with support from international partners.
          </p>

          <div className="relative overflow-hidden">
            <div className="flex animate-scroll gap-6">
              {[
                { href: "https://www.mcgill.ca/", img: "/mcgill_logo.jpg", alt: "McGill Logo", name: "McGill University", location: "Canada" },
                { href: "https://www.mcgill.ca/neuro/", img: "/neuro_logo_horiz_rgb_eng_0.png", alt: "MNI Logo", name: "Montreal Neurological Institute–Hospital", location: "Canada" },
                { href: "https://mailab.io/", img: "/MAI_LAB_LOGO-removebg-preview-edited-2.png", alt: "MAI Lab Logo", name: "Medical Artificial Intelligence Laboratory", location: "Nigeria" },
                { href: "https://www.linkedin.com/company/crestviewradiology/", img: "/sponsor3.cca72af6d5bdfa0e9e23.png", alt: "Crestview Radiology Logo", name: "Crestview Radiology Ltd", location: "Nigeria" },
                { href: "https://www3.pennmedicine.org/departments-and-centers/department-of-radiology/", img: "/ug_med_logo.png", alt: "UGMS Logo", name: "Department of Radiology, University of Pennsylvania", location: "United States" },
              ].map((institution, index) => (
                <Card key={index} className="p-5 hover:shadow-md transition-shadow flex-shrink-0 min-w-[280px]">
                  <a
                    href={institution.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4"
                  >
                    <img src={institution.img} alt={institution.alt} className="h-12 w-16 object-contain" />
                    <div>
                      <p className="font-semibold">{institution.name}</p>
                      <p className="text-muted-foreground">{institution.location}</p>
                    </div>
                  </a>
                </Card>
              ))}

              {[
                { href: "https://www.mcgill.ca/", img: "/mcgill_logo.jpg", alt: "McGill Logo", name: "McGill University", location: "Canada" },
                { href: "https://www.mcgill.ca/neuro/", img: "/neuro_logo_horiz_rgb_eng_0.png", alt: "MNI Logo", name: "Montreal Neurological Institute–Hospital", location: "Canada" },
                { href: "https://mailab.io/", img: "/MAI_LAB_LOGO-removebg-preview-edited-2.png", alt: "MAI Lab Logo", name: "Medical Artificial Intelligence Laboratory", location: "Nigeria" },
                { href: "https://www.linkedin.com/company/crestviewradiology/", img: "/sponsor3.cca72af6d5bdfa0e9e23.png", alt: "Crestview Radiology Logo", name: "Crestview Radiology Ltd", location: "Nigeria" },
                { href: "https://www3.pennmedicine.org/departments-and-centers/department-of-radiology/", img: "/ug_med_logo.png", alt: "UGMS Logo", name: "Department of Radiology, University of Pennsylvania", location: "United States" },
              ].map((institution, index) => (
                <Card key={`dup-${index}`} className="p-5 hover:shadow-md transition-shadow flex-shrink-0 min-w-[280px]">
                  <a
                    href={institution.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4"
                  >
                    <img src={institution.img} alt={institution.alt} className="h-12 w-16 object-contain" />
                    <div>
                      <p className="font-semibold">{institution.name}</p>
                      <p className="text-muted-foreground">{institution.location}</p>
                    </div>
                  </a>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}