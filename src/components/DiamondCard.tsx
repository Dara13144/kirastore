import { Diamond, Sparkles } from 'lucide-react';
import type { DiamondPackage } from '@/lib/store';
import diamondIcon from '@/assets/diamond-icon.png';

interface Props {
  pkg: DiamondPackage;
  onSelect: (pkg: DiamondPackage) => void;
}

const DiamondCard = ({ pkg, onSelect }: Props) => {
  return (
    <button
      onClick={() => onSelect(pkg)}
      className="group relative overflow-hidden rounded-xl border border-border bg-gradient-card p-4 text-left transition-all duration-300 hover:glow-border hover:shadow-neon"
    >
      {pkg.popular && (
        <div className="absolute right-0 top-0 rounded-bl-lg bg-gradient-primary px-3 py-1">
          <span className="font-heading text-[10px] font-bold text-primary-foreground">HOT</span>
        </div>
      )}

      <div className="mb-3 flex items-center gap-3">
        <img src={diamondIcon} alt="Diamond" className="h-10 w-10 transition-transform group-hover:scale-110" />
        <div>
          <p className="font-heading text-sm font-bold text-foreground">{pkg.diamonds.toLocaleString()}</p>
          {pkg.bonus && (
            <p className="flex items-center gap-1 text-xs text-accent">
              <Sparkles className="h-3 w-3" /> +{pkg.bonus} Bonus
            </p>
          )}
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-lg font-bold text-primary">${pkg.price.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">{pkg.priceKHR.toLocaleString()} KHR</p>
        </div>
        <span className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          Buy
        </span>
      </div>
    </button>
  );
};

export default DiamondCard;
