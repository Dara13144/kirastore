import diamondIcon from '@/assets/diamond-icon.png';

const Footer = () => (
  <footer className="border-t border-border bg-card/50 py-8">
    <div className="container mx-auto px-4 text-center">
      <div className="mb-4 flex items-center justify-center gap-2">
        <img src={diamondIcon} alt="" className="h-6 w-6" />
        <span className="font-heading text-sm font-bold text-gradient">KIRA STORE</span>
      </div>
      <p className="text-xs text-muted-foreground">
        © {new Date().getFullYear()} KIRA STORE. Fast & Secure Diamond Top Up.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Payment powered by Bakong KHQR
      </p>
    </div>
  </footer>
);

export default Footer;
