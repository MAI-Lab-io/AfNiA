import { Menu } from 'lucide-react';
import { Button } from './ui/button';
import logo from '../assets/logo.png';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Header({ currentPage, onNavigate }: HeaderProps) {
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'explore', label: 'Explore Datasets' },
    { id: 'contribute', label: 'Contribute' },
    { id: 'about', label: 'About' },
  ];

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
 <button 
  onClick={() => onNavigate('home')}
  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
>
  <img 
    src={logo} 
    alt="AfNIA - African NeuroImaging Archive" 
    className="h-16 sm:h-20 md:h-24 lg:h-28 w-auto"
  />
  <span className="flex items-center gap-2">
    <span style={{ color: '#7C3AED', fontWeight: '900', fontSize: '2.5rem' }}>AfNIA</span>
    <span style={{ color: '#000000', fontWeight: 400, fontSize: '1.25rem' }}>- African NeuroImaging Archive</span>
  </span>
</button>


          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`transition-colors ${
                  currentPage === item.id
                    ? 'text-primary'
                    : 'text-foreground hover:text-primary'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
