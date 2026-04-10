import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Search, CheckCircle, Hash, ChevronRight, Loader2, User, Globe, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fetchGameById, addOrder, generateOrderId, type Game, type GamePackage, type CheckResult } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { sendTelegramNotification } from "@/lib/telegram";
import { supabase } from "@/integrations/supabase/client";

const TopUp = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: game, isLoading: gameLoading } = useQuery({
    queryKey: ["game", gameId],
    queryFn: () => fetchGameById(gameId!),
    enabled: !!gameId,
  });

  const [playerIds, setPlayerIds] = useState<Record<string, string>>({});
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [checkProgress, setCheckProgress] = useState(0);
  const [selectedPkg, setSelectedPkg] = useState<GamePackage | null>(null);
  const [agreedTerms, setAgreedTerms] = useState(false);

  // --- AUTOMATED CHECK LOGIC (Like mrxtopup) ---
  const handleCheckAccount = async () => {
    const mainFieldKey = game?.idFields[0]?.key || "userId";
    const mainId = playerIds[mainFieldKey]?.trim();
    const zoneId = playerIds["zoneId"]?.trim();

    if (!mainId) {
      setCheckError("សូមបញ្ចូល ID របស់អ្នកជាមុនសិន។");
      return;
    }

    setCheckLoading(true);
    setCheckError(null);
    setCheckResult(null);
    
    // Smooth progress simulation
    setCheckProgress(10);
    const progressTimer = setInterval(() => {
        setCheckProgress(prev => (prev < 90 ? prev + 5 : prev));
    }, 200);

    try {
      const { data, error } = await supabase.functions.invoke("master-controller", {
        body: {
          action: "check_id",
          gameId: game?.id,
          userId: mainId,
          zoneId: zoneId,
        },
      });

      clearInterval(progressTimer);
      setCheckProgress(100);

      if (error || !data || !data.found) {
        throw new Error(data?.message || "រកមិនឃើញអ្នកប្រើប្រាស់");
      }

      setCheckResult({
        found: true,
        username: data.username,
        server: data.region || data.server || "Global",
        level: data.level,
      });
      
      toast({ title: "ស្វែងរកឃើញគណនី!", description: `ឈ្មោះ: ${data.username}`, variant: "default" });
    } catch (err: any) {
      setCheckError("រកមិនឃើញ ID នេះនៅក្នុងប្រព័ន្ធទេ។ សូមពិនិត្យម្តងទៀត។");
      setCheckProgress(0);
    } finally {
      setCheckLoading(false);
    }
  };

  const handleOrder = async () => {
    if (!selectedPkg || !playerIds[game?.idFields[0]?.key || "userId"] || !agreedTerms) {
      toast({ title: "ព័ត៌មានមិនគ្រប់គ្រាន់", description: "សូមបំពេញ ID និងជ្រើសរើសកញ្ចប់", variant: "destructive" });
      return;
    }

    const orderId = generateOrderId();
    const order = {
      id: orderId,
      gameId: game!.id,
      gameName: game!.name,
      playerIds,
      playerName: checkResult?.username || "Guest User",
      packageId: selectedPkg.id,
      packageName: selectedPkg.name,
      price: selectedPkg.price,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    };

    try {
      await addOrder(order);
      await sendTelegramNotification("new_order", {
        id: order.id,
        gameName: order.gameName,
        packageName: order.packageName,
        price: order.price,
        playerName: order.playerName,
        playerIds: order.playerIds,
      });
      navigate(`/payment/${order.id}`);
    } catch (error) {
      toast({ title: "Error", description: "Cannot create order", variant: "destructive" });
    }
  };

  if (gameLoading) return <div className="flex h-screen items-center justify-center bg-slate-950 text-white"><Loader2 className="animate-spin" /></div>;
  if (!game) return <div className="p-10 text-center text-white">Game Not Found</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 pb-24">
      <Navbar />

      <div className="container mx-auto px-4 pt-6">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> ត្រលប់ទៅទំព័រដើម
        </Link>

        {/* Header Section */}
        <div className="relative rounded-3xl overflow-hidden mb-8 border border-white/10 shadow-2xl">
          <img src={game.banner} className="w-full h-48 md:h-72 object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 flex items-center gap-4">
            <img src={game.icon} className="h-20 w-20 rounded-2xl border-4 border-[#0f172a] shadow-lg" />
            <div>
                <h1 className="text-3xl font-black italic tracking-tighter uppercase">{game.name}</h1>
                <p className="text-blue-400 font-bold text-sm tracking-widest uppercase">{game.publisher}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1: Account & Products */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. Account Info Section */}
            <div className="bg-slate-900/50 border border-white/10 p-6 rounded-3xl backdrop-blur-sm relative overflow-hidden">
              <div className="flex items-center gap-4 mb-6">
                <span className="bg-blue-600 text-white h-10 w-10 flex items-center justify-center rounded-xl font-black shadow-lg shadow-blue-500/30">1</span>
                <h3 className="text-xl font-bold italic uppercase">បញ្ចូលព័ត៌មានគណនី</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {game.idFields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase ml-1">{field.label}</label>
                    <div className="bg-slate-950 border border-white/5 rounded-2xl p-1 flex items-center focus-within:ring-2 ring-blue-500 transition-all">
                        <div className="bg-slate-900 p-3 rounded-xl text-slate-500"><Hash className="h-5 w-5" /></div>
                        <input
                            type="text" placeholder={field.placeholder}
                            className="bg-transparent border-none outline-none w-full px-4 text-white placeholder:text-slate-600 font-bold"
                            onChange={(e) => setPlayerIds((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleCheckAccount}
                disabled={checkLoading}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black italic uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50"
              >
                {checkLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <Search className="h-5 w-5" />}
                {checkLoading ? 'កំពុងឆែក...' : 'ពិនិត្យគណនី'}
              </button>

              {/* Progress Bar (mrxtopup style) */}
              {checkLoading && (
                <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${checkProgress}%` }} />
                </div>
              )}

              {/* Result Display */}
              {checkResult && (
                <div className="mt-6 bg-green-500/10 border border-green-500/30 p-5 rounded-2xl animate-in fade-in slide-in-from-top-2">
                   <div className="flex items-center gap-2 text-green-400 font-black text-sm uppercase mb-3">
                      <CheckCircle className="h-5 w-5" /> គណនីត្រូវបានរកឃើញ
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                         <p className="text-[10px] text-slate-500 uppercase font-black">Username</p>
                         <p className="font-bold text-white truncate">{checkResult.username}</p>
                      </div>
                      <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                         <p className="text-[10px] text-slate-500 uppercase font-black">Region/Server</p>
                         <p className="font-bold text-white">{checkResult.server}</p>
                      </div>
                   </div>
                </div>
              )}

              {checkError && (
                <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-400/10 p-4 rounded-xl border border-red-400/20 text-sm font-bold">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {checkError}
                </div>
              )}
            </div>

            {/* 2. Package Selection */}
            <div className="bg-slate-900/50 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-6">
                <span className="bg-blue-600 text-white h-10 w-10 flex items-center justify-center rounded-xl font-black shadow-lg shadow-blue-500/30">2</span>
                <h3 className="text-xl font-bold italic uppercase">ជ្រើសរើសកញ្ចប់</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {game.packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPkg(pkg)}
                    className={`relative group p-4 rounded-2xl border-2 text-left transition-all overflow-hidden ${
                      selectedPkg?.id === pkg.id 
                      ? "border-blue-500 bg-blue-500/10 ring-4 ring-blue-500/10 scale-[1.02]" 
                      : "border-white/5 bg-slate-950/40 hover:border-white/20"
                    }`}
                  >
                    <div className="flex flex-col h-full justify-between gap-4">
                      <span className={`font-black text-xs uppercase tracking-tighter ${selectedPkg?.id === pkg.id ? 'text-blue-400' : 'text-slate-400'}`}>
                        {pkg.name}
                      </span>
                      <span className="text-2xl font-black text-white italic">${pkg.price.toFixed(2)}</span>
                    </div>
                    {selectedPkg?.id === pkg.id && (
                        <div className="absolute -top-2 -right-2 bg-blue-500 p-2 rounded-bl-xl">
                            <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
                <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl shadow-2xl">
                    <h3 className="text-lg font-black uppercase italic mb-6 border-b border-white/5 pb-4">សេចក្តីសង្ខេប</h3>
                    
                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 font-bold uppercase">ហ្គេម</span>
                            <span className="text-white font-black italic uppercase">{game.name}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 font-bold uppercase">កញ្ចប់</span>
                            <span className="text-blue-400 font-black italic">{selectedPkg?.name || '---'}</span>
                        </div>
                        <div className="flex justify-between text-2xl border-t border-white/5 pt-4">
                            <span className="text-white font-black italic uppercase">សរុប</span>
                            <span className="text-green-500 font-black italic">${selectedPkg?.price.toFixed(2) || '0.00'}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                            type="checkbox"
                            checked={agreedTerms}
                            onChange={(e) => setAgreedTerms(e.target.checked)}
                            className="mt-1 h-5 w-5 rounded-md border-white/10 bg-slate-950 accent-blue-600 transition-all"
                            />
                            <span className="text-[11px] leading-tight text-slate-500 group-hover:text-slate-300 transition-colors">
                                ខ្ញុំបានពិនិត្យ ID ត្រឹមត្រូវ និងយល់ព្រមតាម <span className="text-blue-500 underline">លក្ខខណ្ឌប្រើប្រាស់</span> របស់គេហទំព័រ។
                            </span>
                        </label>

                        <button
                            onClick={handleOrder}
                            disabled={!selectedPkg || !agreedTerms}
                            className="w-full bg-green-600 hover:bg-green-500 text-white py-5 rounded-2xl font-black italic uppercase tracking-widest transition-all shadow-xl shadow-green-600/20 disabled:opacity-30 disabled:grayscale active:scale-95 flex items-center justify-center gap-2"
                        >
                            បញ្ជាទិញឥឡូវនេះ <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TopUp;
