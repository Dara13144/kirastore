import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import diamondIcon from '@/assets/diamond-icon.png';

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-gradient-green shadow-green">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={diamondIcon} alt="KIRA STORE" className="h-8 w-8 rounded-full" />
          <div>
            <span className="font-heading text-base font-bold text-primary-foreground">KIRA STORE</span>
            <p className="text-[10px] text-primary-foreground/80">• Quality • Safety • Affordable price</p>
          </div>
        </Link>

        <button onClick={() => setOpen(!open)} className="text-primary-foreground md:hidden">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        <div className="hidden items-center gap-6 md:flex">
          <Link to="/" className="text-sm font-medium text-primary-foreground/90 hover:text-primary-foreground">Home</Link>
          <Link to="/check-order" className="text-sm font-medium text-primary-foreground/90 hover:text-primary-foreground">Check Order</Link>
        </div>
      </div>

      {open && (
        <div className="border-t border-primary-foreground/10 bg-gradient-green px-4 pb-3 md:hidden">
          <Link to="/" onClick={() => setOpen(false)} className="block py-2 text-sm text-primary-foreground/90">Home</Link>
          <Link to="/check-order" onClick={() => setOpen(false)} className="block py-2 text-sm text-primary-foreground/90">Check Order</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
