import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Search, CheckCircle, Globe, Hash, ChevronRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fetchGameById, addOrder, generateOrderId, type Game, type GamePackage, type CheckResult } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { sendTelegramNotification } from "@/lib/telegram";
import { supabase } from "@/integrations/supabase/client";
import diamondIcon from "@/assets/diamond-icon.png";

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

  // --- START CHECK ID LOGIC ---
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
    setCheckProgress(20);

    try {
      // Calling the Master Controller / verify-game-id function
      const { data, error } = await supabase.functions.invoke("master-controller", {
        body: {
          action: "check_id", // Directing to the check_id logic
          gameId: game?.id,
          userId: mainId,
          zoneId: zoneId,
        },
      });

      setCheckProgress(70);

      if (error || !data) throw new Error("Verification failed");

      if (data.found) {
        setCheckProgress(100);
        setCheckResult({
          found: true,
          username: data.username,
          server: data.region || data.server,
          level: data.level,
        });
        toast({ title: "ស្វែងរកឃើញគណនី!", description: `ឈ្មោះ: ${data.username}`, variant: "default" });
      } else {
        setCheckError(`រកមិនឃើញអ្នកប្រើប្រាស់សម្រាប់ ID "${mainId}".`);
      }
    } catch (err: any) {
      console.error("Check ID Error:", err);
      setCheckError("មានបញ្ហាក្នុងការភ្ជាប់ទៅប្រព័ន្ធ។ សូមពិនិត្យ ID ម្តងទៀត។");
    } finally {
      setCheckLoading(false);
    }
  };
  // --- END CHECK ID LOGIC ---

  const handleOrder = async () => {
    const mainFieldKey = game?.idFields[0]?.key || "userId";
    const mainId = playerIds[mainFieldKey]?.trim();

    if (!selectedPkg || !mainId || !agreedTerms) {
      toast({ title: "សូមបំពេញព័ត៌មានឲ្យបានគ្រប់គ្រាន់", variant: "destructive" });
      return;
    }

    const orderId = generateOrderId();

    const order = {
      id: orderId,
      gameId: game!.id,
      gameName: game!.name,
      playerIds,
      playerName: checkResult?.username || "Unknown",
      packageId: selectedPkg.id,
      packageName: selectedPkg.name,
      price: selectedPkg.price,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    };

    try {
      await addOrder(order);

      // Notify Admin
      sendTelegramNotification("new_order", {
        id: order.id,
        gameName: order.gameName,
        packageName: order.packageName,
        price: order.price,
        playerName: order.playerName,
        playerIds: order.playerIds,
      });

      navigate(`/payment/${order.id}`);
    } catch (error) {
      toast({ title: "មានបញ្ហា", description: "មិនអាចបង្កើតការបញ្ជាទិញបានទេ", variant: "destructive" });
    }
  };

  // Content Filtering
  if (gameLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (!game) return <div className="p-10 text-center">Game Not Found</div>;

  const bestSellers = game.packages.filter((p) => p.category === "best-seller" && !p.disabled);
  const normals = game.packages.filter((p) => p.category === "normal" && !p.disabled);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Banner & Header */}
      <div className="container mx-auto px-4 pt-4">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> ត្រលប់ក្រោយ
        </Link>
        <img src={game.banner} alt="" className="w-full rounded-2xl object-cover h-48 md:h-64 shadow-lg" />

        <div className="mt-4 flex items-center gap-4 bg-card p-4 rounded-2xl border border-border">
          <img src={game.icon} className="h-16 w-16 rounded-xl" />
          <div>
            <h2 className="text-xl font-bold">{game.name}</h2>
            <p className="text-xs text-muted-foreground">{game.publisher}</p>
          </div>
        </div>
      </div>

      {/* 1. Account Info Section */}
      <div className="container mx-auto px-4 mt-6">
        <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-2xl shadow-xl text-white">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-white text-green-700 h-8 w-8 flex items-center justify-center rounded-full font-bold">
              1
            </span>
            <h3 className="text-lg font-bold">បញ្ចូលព័ត៌មានគណនី</h3>
          </div>

          <div className="space-y-4">
            {game.idFields.map((field) => (
              <div key={field.key}>
                <label className="text-xs font-semibold mb-1 block opacity-80 uppercase">{field.label}</label>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 flex items-center gap-2">
                  <Hash className="h-4 w-4 opacity-60" />
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    className="bg-transparent border-none outline-none w-full text-white placeholder:text-white/40"
                    onChange={(e) => setPlayerIds((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleCheckAccount}
            disabled={checkLoading}
            className="w-full mt-4 bg-white/20 hover:bg-white/30 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
          >
            {checkLoading ? <Loader2 className="animate-spin" /> : <Search className="h-4 w-4" />}
            ពិនិត្យគណនី
          </button>

          {checkResult && (
            <div className="mt-4 bg-white text-black p-4 rounded-xl animate-in fade-in zoom-in duration-300">
              <p className="text-green-600 font-bold flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4" /> គណនីត្រឹមត្រូវ
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-100 p-2 rounded">
                  <span className="text-gray-500 text-[10px]">Nickname</span>
                  <p className="font-bold">{checkResult.username}</p>
                </div>
                {checkResult.server && (
                  <div className="bg-gray-100 p-2 rounded">
                    <span className="text-gray-500 text-[10px]">Server/Region</span>
                    <p className="font-bold">{checkResult.server}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {checkError && <p className="mt-3 text-red-300 text-sm font-medium">❌ {checkError}</p>}
        </div>
      </div>

      {/* 2. Package Selection */}
      <div className="container mx-auto px-4 mt-6">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-primary text-white h-8 w-8 flex items-center justify-center rounded-full font-bold">
              2
            </span>
            <h3 className="text-lg font-bold">ជ្រើសរើសកញ្ចប់</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {game.packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPkg(pkg)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedPkg?.id === pkg.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border"
                }`}
              >
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-sm">{pkg.name}</span>
                  <span className="text-primary font-heading text-lg">${pkg.price.toFixed(2)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Checkout Footer */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-md border-t border-border p-4 mt-10">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="h-5 w-5 accent-primary"
            />
            <span className="text-xs text-muted-foreground">ខ្ញុំបានពិនិត្យ ID ត្រឹមត្រូវ និងយល់ព្រមតាមលក្ខខណ្ឌ</span>
          </div>
          <button
            onClick={handleOrder}
            disabled={!selectedPkg || !agreedTerms}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg"
          >
            បញ្ជាទិញឥឡូវនេះ <ChevronRight />
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TopUp;
