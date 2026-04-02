import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Search, CheckCircle, Globe, Hash, ChevronRight, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { GAMES, addOrder, generateOrderId, checkGameUsername, type Game, type GamePackage, type CheckResult } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { sendTelegramNotification } from '@/lib/telegram';
import diamondIcon from '@/assets/diamond-icon.png';

const TopUp = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check custom games from admin
  const customGames = localStorage.getItem('kira_custom_games');
  const allGames = customGames ? JSON.parse(customGames) as Game[] : GAMES;
  const game = allGames.find(g => g.id === gameId);

  const [playerIds, setPlayerIds] = useState<Record<string, string>>({});
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [checkProgress, setCheckProgress] = useState(0);
  const [selectedPkg, setSelectedPkg] = useState<GamePackage | null>(null);
  const [agreedTerms, setAgreedTerms] = useState(false);

  if (!game) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center animate-fade-in">
          <p className="text-muted-foreground">រកមិនឃើញហ្គេម។</p>
          <Link to="/" className="mt-4 inline-block text-primary underline">ត្រលប់ទៅទំព័រដើម</Link>
        </div>
      </div>
    );
  }

  const mainFieldKey = game.idFields[0]?.key || 'userId';
  const mainId = playerIds[mainFieldKey]?.trim() || '';

  const handleCheckAccount = async () => {
    if (!mainId) {
      setCheckError('សូមបញ្ចូល ID របស់អ្នកជាមុនសិន។');
      return;
    }
    setCheckLoading(true);
    setCheckError(null);
    setCheckResult(null);
    setCheckProgress(0);

    // Simulate multi-step system check
    const steps = [
      { label: 'កំពុងភ្ជាប់ទៅម៉ាស៊ីនមេ...', progress: 25 },
      { label: 'កំពុងផ្ទៀងផ្ទាត់ ID...', progress: 50 },
      { label: 'កំពុងពិនិត្យ Zone/Server...', progress: 75 },
      { label: 'កំពុងបញ្ជាក់គណនី...', progress: 100 },
    ];

    for (const step of steps) {
      setCheckProgress(step.progress);
      await new Promise(r => setTimeout(r, 400));
    }

    const zoneId = playerIds['zoneId']?.trim() || undefined;
    const result = checkGameUsername(game.id, mainId, zoneId);
    
    if (result.found) {
      if (result.zoneMatch === false) {
        setCheckResult(null);
        setCheckError(`⚠️ Zone ID មិនត្រឹមត្រូវសម្រាប់គណនី "${mainId}". សូមពិនិត្យ Zone ID ម្តងទៀត។`);
      } else {
        setCheckResult(result);
        setCheckError(null);
      }
    } else {
      setCheckResult(null);
      setCheckError(`រកមិនឃើញអ្នកប្រើប្រាស់សម្រាប់ ID "${mainId}".`);
    }
    setCheckLoading(false);
  };

  const handleOrder = () => {
    if (!selectedPkg) {
      toast({ title: 'សូមជ្រើសរើសកញ្ចប់', variant: 'destructive' });
      return;
    }
    if (!mainId) {
      toast({ title: 'សូមបញ្ចូល ID', variant: 'destructive' });
      return;
    }
    if (!agreedTerms) {
      toast({ title: 'សូមយល់ព្រមលក្ខខណ្ឌ', variant: 'destructive' });
      return;
    }

    const order = {
      id: generateOrderId(),
      gameId: game.id,
      gameName: game.name,
      playerIds,
      playerName: checkResult?.username || undefined,
      packageId: selectedPkg.id,
      packageName: selectedPkg.name,
      price: selectedPkg.price,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    addOrder(order);
    
    // Send Telegram notification for new order
    sendTelegramNotification('new_order', {
      id: order.id,
      gameName: order.gameName,
      packageName: order.packageName,
      price: order.price,
      playerName: order.playerName,
      playerIds: order.playerIds,
    });

    navigate(`/payment/${order.id}`);
  };

  const bestSellers = game.packages.filter(p => p.category === 'best-seller');
  const normals = game.packages.filter(p => p.category === 'normal');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Back */}
      <div className="container mx-auto px-4 pt-4 animate-fade-in">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> ត្រលប់ទៅទំព័រដើម
        </Link>
      </div>

      {/* Banner */}
      <div className="container mx-auto px-4 pt-3 animate-scale-in">
        <img src={game.banner} alt={game.name} className="w-full rounded-2xl object-cover shadow-green" width={1024} height={512} />
      </div>

      {/* Game Info */}
      <div className="container mx-auto px-4 pt-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm">
          <img src={game.icon} alt="" className="h-16 w-16 rounded-xl animate-float" width={64} height={64} />
          <div>
            <h2 className="font-heading text-base font-bold text-primary">{game.name}</h2>
            <p className="text-xs text-muted-foreground">{game.publisher}</p>
            <p className="flex items-center gap-1 text-xs font-medium text-success">
              <CheckCircle className="h-3 w-3" /> ដឹកជញ្ជូនភ្លាមៗ
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Enter Account Info */}
      <div className="container mx-auto px-4 pt-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <div className="rounded-2xl bg-gradient-green p-4">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground font-heading text-sm font-bold text-primary">1</span>
            <h3 className="font-heading text-base font-bold text-primary-foreground">បញ្ចូលព័ត៌មានគណនី</h3>
          </div>

          <div className="space-y-3">
            {game.idFields.map(field => (
              <div key={field.key}>
                <label className="mb-1 block text-xs font-bold uppercase text-primary-foreground/80">{field.label}</label>
                <div className="flex items-center gap-2 rounded-xl bg-primary-foreground/90 px-3 py-3 transition-all focus-within:ring-2 focus-within:ring-primary-foreground/50">
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

          <button
            onClick={handleCheckAccount}
            disabled={checkLoading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary-foreground/30 bg-primary-foreground/10 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary-foreground/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            {checkLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> កំពុងពិនិត្យប្រព័ន្ធ...</>
            ) : (
              <><Search className="h-4 w-4" /> ពិនិត្យគណនី (System Check)</>
            )}
          </button>

          {/* Progress bar during check */}
          {checkLoading && (
            <div className="mt-3 animate-fade-in">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-primary-foreground/70">កំពុងស្កេនប្រព័ន្ធ...</span>
                <span className="text-xs font-bold text-primary-foreground">{checkProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-primary-foreground/20">
                <div
                  className="h-full bg-primary-foreground transition-all duration-300 ease-out"
                  style={{ width: `${checkProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success result with details */}
          {checkResult && (
            <div className="mt-3 rounded-xl bg-primary-foreground/90 p-4 animate-scale-in space-y-2">
              <p className="text-sm text-success font-bold flex items-center gap-1">
                <CheckCircle className="h-4 w-4" /> ផ្ទៀងផ្ទាត់ជោគជ័យ
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-background/50 p-2">
                  <span className="text-muted-foreground">ឈ្មោះអ្នកប្រើ</span>
                  <p className="font-bold text-foreground">{checkResult.username}</p>
                </div>
                {checkResult.server && (
                  <div className="rounded-lg bg-background/50 p-2">
                    <span className="text-muted-foreground">Server</span>
                    <p className="font-bold text-foreground">{checkResult.server}</p>
                  </div>
                )}
                {checkResult.level && (
                  <div className="rounded-lg bg-background/50 p-2">
                    <span className="text-muted-foreground">Level</span>
                    <p className="font-bold text-foreground">Lv. {checkResult.level}</p>
                  </div>
                )}
                <div className="rounded-lg bg-background/50 p-2">
                  <span className="text-muted-foreground">Zone</span>
                  <p className="font-bold text-success">✓ ត្រឹមត្រូវ</p>
                </div>
              </div>
            </div>
          )}
          {checkError && (
            <div className="mt-3 rounded-xl bg-accent/10 p-3 animate-shake">
              <p className="text-sm text-accent font-medium">❌ {checkError}</p>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Select Package */}
      <div className="container mx-auto px-4 pt-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
        <div className="rounded-2xl bg-gradient-green p-4">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground font-heading text-sm font-bold text-primary">2</span>
            <h3 className="font-heading text-base font-bold text-primary-foreground">ជ្រើសរើសកញ្ចប់</h3>
          </div>

          {bestSellers.length > 0 && (
            <>
              <p className="mb-3 font-heading text-sm font-bold text-accent">🏆 កញ្ចប់លក់ដាច់ជាងគេ</p>
              <div className="mb-4 grid grid-cols-2 gap-2">
                {bestSellers.map((pkg, i) => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPkg(pkg)}
                    className={`relative rounded-xl border-2 p-3 text-left transition-all hover:scale-[1.03] active:scale-[0.97] ${
                      selectedPkg?.id === pkg.id
                        ? 'border-primary bg-primary/5 shadow-green'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                    style={{ animationDelay: `${i * 50}ms` }}
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

          {normals.length > 0 && (
            <>
              <p className="mb-3 font-heading text-sm font-bold text-primary-foreground">💎 កញ្ចប់ធម្មតា</p>
              <div className="grid grid-cols-2 gap-2">
                {normals.map((pkg, i) => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPkg(pkg)}
                    className={`relative flex items-center justify-between rounded-xl border-2 p-3 text-left transition-all hover:scale-[1.03] active:scale-[0.97] ${
                      selectedPkg?.id === pkg.id
                        ? 'border-primary bg-primary/5 shadow-green'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                    style={{ animationDelay: `${i * 50}ms` }}
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
                    <img src={diamondIcon} alt="" className="h-10 w-10 animate-float" loading="lazy" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Step 3: Payment Method */}
      <div className="container mx-auto px-4 pt-4 animate-slide-up" style={{ animationDelay: '400ms' }}>
        <div className="rounded-2xl bg-gradient-green p-4">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground font-heading text-sm font-bold text-primary">3</span>
            <h3 className="font-heading text-base font-bold text-primary-foreground">វិធីបង់ប្រាក់</h3>
          </div>

          <div className="flex items-center justify-between rounded-xl border-2 border-primary bg-card p-4 transition-all hover:shadow-green">
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
      <div className="container mx-auto px-4 pt-4 animate-slide-up" style={{ animationDelay: '500ms' }}>
        <div className="rounded-2xl bg-gradient-green p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={e => setAgreedTerms(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-primary-foreground/30 accent-primary"
            />
            <span className="text-sm text-primary-foreground">
              ខ្ញុំបានអាន និងយល់ព្រមតាម <span className="font-bold italic text-accent-foreground underline">លក្ខខណ្ឌ​ និង​គោលនយោបាយ</span> នៃការទិញ។
            </span>
          </label>
        </div>
      </div>

      {/* Total & Order */}
      <div className="container mx-auto px-4 py-4 animate-slide-up" style={{ animationDelay: '600ms' }}>
        <div className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground">តម្លៃសរុប</p>
            <p className="font-heading text-2xl font-bold text-foreground">
              ${selectedPkg ? selectedPkg.price.toFixed(2) : '0.00'}
            </p>
          </div>
          <button
            onClick={handleOrder}
            className="flex items-center gap-2 rounded-xl bg-gradient-green px-8 py-3 font-heading text-sm font-bold text-primary-foreground shadow-green transition-all hover:scale-105 active:scale-95"
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
