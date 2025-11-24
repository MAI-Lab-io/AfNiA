import { Mail, MapPin } from 'lucide-react';
import logo from '../public/logo.png';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-gray-50 border-t mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="col-span-1 md:col-span-2">
            <img src={logo} alt="AfNIA" className="h-10 sm:h-12 md:h-16 lg:h-20 w-auto" />
            <p className="text-muted-foreground max-w-md">
              Empowering African neuroscience through open, equitable neuroimaging data.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('about')} className="text-muted-foreground hover:text-primary transition-colors">
                  About
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="text-muted-foreground hover:text-primary transition-colors">
                  Partners
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('home')} className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Use
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4">Contact</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>info@mailab.io</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>MAILAB</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
          <p>© 2025 MAILAB. All rights reserved. Building a more equitable future for neuroscience in Africa.</p>
        </div>
      </div>
    </footer>
  );
}
