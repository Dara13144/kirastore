import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Diamond, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DiamondCard from '@/components/DiamondCard';
import { DIAMOND_PACKAGES, addOrder, generateOrderId, type DiamondPackage } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

const TopUp = () => {
  const [playerId, setPlayerId] = useState('');
  const [selectedPkg, setSelectedPkg] = useState<DiamondPackage | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSelect = (pkg: DiamondPackage) => {
    if (!playerId.trim()) {
      toast({ title: 'សូមបញ្ចូល Player ID', description: 'Please enter your Player ID first', variant: 'destructive' });
      return;
    }
    setSelectedPkg(pkg);
  };

  const handleConfirm = () => {
    if (!selectedPkg || !playerId.trim()) return;

    const order = {
      id: generateOrderId(),
      playerId: playerId.trim(),
      packageId: selectedPkg.id,
      packageName: selectedPkg.name,
      diamonds: selectedPkg.diamonds + (selectedPkg.bonus || 0),
      price: selectedPkg.price,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    addOrder(order);
    navigate(`/payment/${order.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 font-heading text-2xl font-bold text-gradient">
          <Diamond className="mr-2 inline h-6 w-6" /> Top Up Diamond
        </h1>

        {/* Player ID */}
        <div className="mb-8 rounded-xl border border-border bg-gradient-card p-4">
          <label className="mb-2 block text-sm font-medium text-muted-foreground">
            Player ID / User ID
          </label>
          <input
            type="text"
            value={playerId}
            onChange={e => setPlayerId(e.target.value)}
            placeholder="Enter your Player ID..."
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Packages */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {DIAMOND_PACKAGES.map(pkg => (
            <DiamondCard
              key={pkg.id}
              pkg={pkg}
              onSelect={handleSelect}
            />
          ))}
        </div>

        {/* Confirm */}
        {selectedPkg && (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 p-4 backdrop-blur-xl">
            <div className="container mx-auto flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Selected</p>
                <p className="font-heading text-lg font-bold text-foreground">
                  {selectedPkg.diamonds.toLocaleString()} 💎
                  <span className="ml-2 text-primary">${selectedPkg.price.toFixed(2)}</span>
                </p>
              </div>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-2 rounded-xl bg-gradient-primary px-6 py-3 font-heading text-sm font-bold text-primary-foreground shadow-neon transition-transform hover:scale-105"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="pb-24" />
      <Footer />
    </div>
  );
};

export default TopUp;
