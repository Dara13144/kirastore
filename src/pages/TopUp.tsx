import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Search, CheckCircle, Globe, Hash, ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { GAMES, addOrder, generateOrderId, checkGameUsername, type Game, type GamePackage } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import diamondIcon from '@/assets/diamond-icon.png';

const TopUp = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const game = GAMES.find(g => g.id === gameId);

  const [playerIds, setPlayerIds] = useState<Record<string, string>>({});
  const [checkedName, setCheckedName] = useState<string | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<GamePackage | null>(null);
  const [agreedTerms, setAgreedTerms] = useState(false);

  if (!game) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Game not found.</p>
          <Link to="/" className="mt-4 inline-block text-primary underline">Back to Home</Link>
        </div>
      </div>
    );
  }

  const mainFieldKey = game.idFields[0]?.key || 'userId';
  const mainId = playerIds[mainFieldKey]?.trim() || '';

  const handleCheckAccount = async () => {
    if (!mainId) {
      setCheckError('Please enter your ID first.');
      return;
    }
    setCheckLoading(true);
    setCheckError(null);
    setCheckedName(null);

    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));

    const result = checkGameUsername(game.id, mainId);
    if (result.found) {
      setCheckedName(result.username);
      setCheckError(null);
    } else {
      setCheckedName(null);
      setCheckError(`No user found for ID "${mainId}".`);
    }
    setCheckLoading(false);
  };

  const handleOrder = () => {
    if (!selectedPkg) {
      toast({ title: 'សូមជ្រើសរើស Package', variant: 'destructive' });
      return;
    }
    if (!mainId) {
      toast({ title: 'សូមបញ្ចូល ID', variant: 'destructive' });
      return;
    }
    if (!agreedTerms) {
      toast({ title: 'សូមយល់ព្រមលក្ខខណ្ឌ', description: 'Please agree to terms.', variant: 'destructive' });
      return;
    }

    const order = {
      id: generateOrderId(),
      gameId: game.id,
      gameName: game.name,
      playerIds,
      playerName: checkedName || undefined,
      packageId: selectedPkg.id,
      packageName: selectedPkg.name,
      price: selectedPkg.price,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    addOrder(order);
    navigate(`/payment/${order.id}`);
  };

  const bestSellers = game.packages.filter(p => p.category === 'best-seller');
  const normals = game.packages.filter(p => p.category === 'normal');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Back */}
      <div className="container mx-auto px-4 pt-4">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Return to home page
        </Link>
      </div>

      {/* Banner */}
      <div className="container mx-auto px-4 pt-3">
        <img src={game.banner} alt={game.name} className="w-full rounded-2xl object-cover" width={1024} height={512} />
      </div>

      {/* Game Info */}
      <div className="container mx-auto px-4 pt-4">
        <div className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm">
          <img src={game.icon} alt="" className="h-16 w-16 rounded-xl" width={64} height={64} />
          <div>
            <h2 className="font-heading text-base font-bold text-primary">{game.name}</h2>
            <p className="text-xs text-muted-foreground">{game.publisher}</p>
            <p className="flex items-center gap-1 text-xs font-medium text-success">
              <CheckCircle className="h-3 w-3" /> Instant Delivery
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Enter Account Info */}
      <div className="container mx-auto px-4 pt-4">
        <div className="rounded-2xl bg-gradient-green p-4">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground font-heading text-sm font-bold text-primary">1</span>
            <h3 className="font-heading text-base font-bold text-primary-foreground">Enter Account Info</h3>
          </div>

          <div className="space-y-3">
            {game.idFields.map(field => (
              <div key={field.key}>
                <label className="mb-1 block text-xs font-bold uppercase text-primary-foreground/80">{field.label}</label>
                <div className="flex items-center gap-2 rounded-xl bg-primary-foreground/90 px-3 py-3">
                  {field.key === 'userId' || field.key === 'playerId' ? <Hash className="h-4 w-4 text-muted-foreground" /> : <Globe className="h-4 w-4 text-muted-foreground" />}
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={playerIds[field.key] || ''}
                    onChange={e => setPlayerIds(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Check Account Button */}
          <button
            onClick={handleCheckAccount}
            disabled={checkLoading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary-foreground/30 bg-primary-foreground/10 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/20"
          >
            <Search className="h-4 w-4" />
            {checkLoading ? 'Checking...' : 'Check account (Check ID)'}
          </button>

          {/* Check Result */}
          {checkedName && (
            <div className="mt-3 rounded-xl bg-primary-foreground/90 p-3">
              <p className="text-sm text-success font-medium">
                ✅ Username: <span className="font-bold">{checkedName}</span>
              </p>
            </div>
          )}
          {checkError && (
            <div className="mt-3 rounded-xl bg-accent/10 p-3">
              <p className="text-sm text-accent font-medium">❌ {checkError}</p>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Select Package */}
      <div className="container mx-auto px-4 pt-4">
        <div className="rounded-2xl bg-gradient-green p-4">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground font-heading text-sm font-bold text-primary">2</span>
            <h3 className="font-heading text-base font-bold text-primary-foreground">Select Package</h3>
          </div>

          {/* Best Sellers */}
          {bestSellers.length > 0 && (
            <>
              <p className="mb-3 font-heading text-sm font-bold text-accent">🏆 Best Seller Package</p>
              <div className="mb-4 grid grid-cols-2 gap-2">
                {bestSellers.map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPkg(pkg)}
                    className={`relative rounded-xl border-2 p-3 text-left transition-all ${
                      selectedPkg?.id === pkg.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    {pkg.tag && (
                      <span className="absolute -right-1 -top-2 rounded bg-accent px-1.5 py-0.5 text-[9px] font-bold text-accent-foreground">
                        {pkg.tag}
                      </span>
                    )}
                    <p className="text-sm font-bold text-foreground">{pkg.name}</p>
                    <p className="text-sm font-bold text-primary">$ {pkg.price.toFixed(2)}</p>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Normal */}
          {normals.length > 0 && (
            <>
              <p className="mb-3 font-heading text-sm font-bold text-primary-foreground">💎 Normal package</p>
              <div className="grid grid-cols-2 gap-2">
                {normals.map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPkg(pkg)}
                    className={`relative flex items-center justify-between rounded-xl border-2 p-3 text-left transition-all ${
                      selectedPkg?.id === pkg.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    {pkg.tag && (
                      <span className="absolute -right-1 -top-2 rounded bg-accent px-1.5 py-0.5 text-[9px] font-bold text-accent-foreground">
                        {pkg.tag}
                      </span>
                    )}
                    <div>
                      <p className="text-sm font-bold text-foreground">{pkg.name}</p>
                      <p className="text-sm font-bold text-primary">$ {pkg.price.toFixed(2)}</p>
                    </div>
                    <img src={diamondIcon} alt="" className="h-10 w-10" loading="lazy" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Step 3: Payment Method */}
      <div className="container mx-auto px-4 pt-4">
        <div className="rounded-2xl bg-gradient-green p-4">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground font-heading text-sm font-bold text-primary">3</span>
            <h3 className="font-heading text-base font-bold text-primary-foreground">Payment Method</h3>
          </div>

          <div className="flex items-center justify-between rounded-xl border-2 border-primary bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-accent">
                <span className="text-[8px] font-bold text-accent-foreground">ABA</span>
                <span className="text-[6px] font-bold text-accent-foreground">KHQR</span>
              </div>
              <span className="font-heading text-sm font-bold text-foreground">KHQR / ABA Pay</span>
            </div>
            <CheckCircle className="h-5 w-5 text-primary" />
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="container mx-auto px-4 pt-4">
        <div className="rounded-2xl bg-gradient-green p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={e => setAgreedTerms(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-primary-foreground/30 accent-primary"
            />
            <span className="text-sm text-primary-foreground">
              I have read and agree to <span className="font-bold italic text-accent-foreground underline">the Terms and Conditions</span> and Purchase Policy.
            </span>
          </label>
        </div>
      </div>

      {/* Total & Order */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground">TOTAL PRICE</p>
            <p className="font-heading text-2xl font-bold text-foreground">
              ${selectedPkg ? selectedPkg.price.toFixed(2) : '0.00'}
            </p>
          </div>
          <button
            onClick={handleOrder}
            className="flex items-center gap-2 rounded-xl bg-gradient-green px-8 py-3 font-heading text-sm font-bold text-primary-foreground shadow-green transition-transform hover:scale-105"
          >
            បញ្ជាទិញ <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TopUp;
