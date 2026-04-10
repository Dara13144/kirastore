import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client'; // Adjust path based on your project
import { Loader2, CheckCircle2, QrCode, User, Hash } from 'lucide-react';

// --- CONFIGURATION ---
const DIAMOND_PACKS = [
  { id: 'ml_86', name: '86 Diamonds', price: 1.25 },
  { id: 'ml_172', name: '172 Diamonds', price: 2.50 },
  { id: 'ml_w_pass', name: 'Weekly Pass', price: 2.00 },
];

export default function DiamondTopup() {
  // Form State
  const [playerId, setPlayerId] = useState('');
  const [serverId, setServerId] = useState('');
  const [selectedPack, setSelectedPack] = useState<typeof DIAMOND_PACKS[0] | null>(null);
  
  // Payment State
  const [loading, setLoading] = useState(false);
  const [qrString, setQrString] = useState('');
  const [md5, setMd5] = useState('');
  const [orderId, setOrderId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'expired'>('idle');

  // 1. Generate QR Code via Supabase Edge Function
  const generatePayment = async () => {
    if (!playerId || !selectedPack) {
      alert("Please enter Player ID and select a pack");
      return;
    }

    setLoading(true);
    const generatedOrderId = `ORD-${Date.now()}`;
    setOrderId(generatedOrderId);

    try {
      const { data, error } = await supabase.functions.invoke('bakong-payment', {
        body: { 
          action: 'create_qr', 
          amount: selectedPack.price, 
          orderId: generatedOrderId 
        },
      });

      if (error) throw error;

      if (data && data.qr) {
        setQrString(data.qr);
        setMd5(data.md5);
        setPaymentStatus('pending');
        startCheckPayment(data.md5, generatedOrderId);
      }
    } catch (error) {
      console.error("Payment Error:", error);
      alert("Failed to create payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Poll the Edge Function to verify payment
  const startCheckPayment = (paymentMd5: string, currentOrderId: string) => {
    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('bakong-payment', {
          body: { 
            action: 'check_payment', 
            md5: paymentMd5, 
            orderId: currentOrderId,
            createdAt: new Date().toISOString() // Used for backend expiry check
          },
        });

        if (error) return;

        if (data.paid) {
          setPaymentStatus('success');
          clearInterval(interval);
        } else if (data.expired) {
          setPaymentStatus('expired');
          clearInterval(interval);
        }
      } catch (e) {
        console.log("Still checking...");
      }
    }, 4000); // Check every 4 seconds

    // Safety timeout: stop after 10 mins
    setTimeout(() => clearInterval(interval), 600000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 flex flex-col items-center font-sans">
      <div className="max-w-md w-full space-y-6 bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-[2.5rem] shadow-2xl">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black italic tracking-tighter text-blue-500 uppercase">Diamond Store</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Instant KHQR Checkout</p>
        </div>

        {paymentStatus === 'idle' && (
          <>
            {/* Player Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm font-bold text-slate-400 uppercase ml-1">
                <User size={16} /> <span>Account Info</span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Hash className="absolute left-3 top-3 text-slate-600" size={18} />
                  <input 
                    type="text" placeholder="Player ID"
                    className="w-full bg-slate-950 border border-slate-800 p-3 pl-10 rounded-2xl focus:outline-none focus:ring-2 ring-blue-500 transition-all font-bold"
                    value={playerId} onChange={(e) => setPlayerId(e.target.value)}
                  />
                </div>
                <input 
                  type="text" placeholder="Zone"
                  className="w-24 bg-slate-950 border border-slate-800 p-3 rounded-2xl focus:outline-none focus:ring-2 ring-blue-500 transition-all text-center font-bold"
                  value={serverId} onChange={(e) => setServerId(e.target.value)}
                />
              </div>
            </div>

            {/* Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm font-bold text-slate-400 uppercase ml-1">
                <QrCode size={16} /> <span>Select Package</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {DIAMOND_PACKS.map(pack => (
                  <button
                    key={pack.id}
                    onClick={() => setSelectedPack(pack)}
                    className={`p-4 rounded-2xl border-2 transition-all flex justify-between items-center group ${
                      selectedPack?.id === pack.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                    }`}
                  >
                    <span className={`font-bold ${selectedPack?.id === pack.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                        {pack.name}
                    </span>
                    <span className="text-blue-500 font-black italic">${pack.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generatePayment}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-[1.5rem] font-black italic uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Pay Now'}
            </button>
          </>
        )}

        {/* QR Display */}
        {paymentStatus === 'pending' && (
          <div className="text-center space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="bg-white p-6 rounded-[2rem] inline-block shadow-inner">
              <QRCodeSVG value={qrString} size={200} />
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-yellow-500">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping"></div>
                    <p className="text-sm font-black uppercase tracking-widest">Waiting for payment</p>
                </div>
                <p className="text-slate-500 text-[10px] uppercase">Order ID: {orderId}</p>
            </div>
            <button 
              onClick={() => setPaymentStatus('idle')}
              className="text-slate-600 text-xs font-bold uppercase hover:text-slate-400 transition-colors underline underline-offset-4"
            >
              Cancel Transaction
            </button>
          </div>
        )}

        {/* Success State */}
        {paymentStatus === 'success' && (
          <div className="text-center py-8 space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-green-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                <CheckCircle2 className="text-green-500" size={40} />
            </div>
            <h2 className="text-2xl font-black italic text-green-500 uppercase tracking-tighter">Success!</h2>
            <p className="text-slate-400 text-sm leading-relaxed px-4">
              Payment received. Your diamonds are being processed for <b>{playerId}</b>.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full mt-4 bg-slate-800 hover:bg-slate-700 py-4 rounded-2xl font-bold transition-all"
            >
              Back to Store
            </button>
          </div>
        )}

        {/* Expired State */}
        {paymentStatus === 'expired' && (
          <div className="text-center py-8 space-y-4">
            <h2 className="text-xl font-bold text-red-500 uppercase">QR Expired</h2>
            <p className="text-slate-400 text-sm">This payment link has timed out.</p>
            <button onClick={() => setPaymentStatus('idle')} className="text-blue-500 font-bold">Try Again</button>
          </div>
        )}
      </div>

      <footer className="mt-8 text-slate-700 text-[10px] font-bold uppercase tracking-widest">
        Secured by Bakong & KHPay • 2026 nyx_shop@bkjr
      </footer>
    </div>
  );
}
