import { Diamond, Menu, X, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import diamondIcon from '@/assets/diamond-icon.png';

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={diamondIcon} alt="KIRA STORE" className="h-8 w-8" />
          <span className="font-heading text-lg font-bold text-gradient">KIRA STORE</span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-6 md:flex">
          <Link to="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Home
          </Link>
          <Link to="/topup" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Top Up
          </Link>
          <Link to="/check-order" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Check Order
          </Link>
          <Link to="/admin" className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-accent">
            <Shield className="h-4 w-4" /> Admin
          </Link>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="text-foreground md:hidden">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border bg-background px-4 pb-4 md:hidden">
          <Link to="/" onClick={() => setOpen(false)} className="block py-3 text-sm text-muted-foreground hover:text-primary">Home</Link>
          <Link to="/topup" onClick={() => setOpen(false)} className="block py-3 text-sm text-muted-foreground hover:text-primary">Top Up</Link>
          <Link to="/check-order" onClick={() => setOpen(false)} className="block py-3 text-sm text-muted-foreground hover:text-primary">Check Order</Link>
          <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-1 py-3 text-sm text-muted-foreground hover:text-accent">
            <Shield className="h-4 w-4" /> Admin
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
