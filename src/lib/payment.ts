import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';

// --- CONFIGURATION ---
const KHPAY_CONFIG = {
  API_KEY: 'ak_c142035c7035fb3e0e13d752a9f4b000100f1ba2f6066aa2',
  BASE_URL: 'https://khpay.site/api/v1',
  BAKONG_ID: 'dara_mao1@bkrt'
};

const DIAMOND_PACKS = [
  { id: 'ml_86', name: '86 Diamonds', price: 1.25 },
  { id: 'ml_172', name: '172 Diamonds', price: 2.50 },
  { id: 'ml_w_pass', name: 'Weekly Pass', price: 2.00 },
];

export default function DiamondTopup() {
  // Form State
  const [playerId, setPlayerId] = useState('');
  const [serverId, setServerId] = useState('');
  const [selectedPack, setSelectedPack] = useState(null);
  
  // Payment State
  const [loading, setLoading] = useState(false);
  const [qrString, setQrString] = useState('');
  const [md5, setMd5] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success'>('idle');

  // 1. Generate QR Code
  const generatePayment = async () => {
    if (!playerId || !selectedPack) {
      alert("Please enter Player ID and select a pack");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${KHPAY_CONFIG.BASE_URL}/qr/generate`, {
        amount: selectedPack.price.toFixed(2),
        note: `Order: ${selectedPack.name} | ID: ${playerId}(${serverId})`,
        bakong_id: KHPAY_CONFIG.BAKONG_ID // Directing to your account
      }, {
        headers: {
          'Authorization': `Bearer ${KHPAY_CONFIG.API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.qr) {
        setQrString(response.data.qr);
        setMd5(response.data.md5);
        setPaymentStatus('pending');
        startCheckPayment(response.data.md5);
      }
    } catch (error) {
      console.error("Payment Error:", error);
      alert("Error connecting to KHPay. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Poll KHPay to check if user has paid
  const startCheckPayment = (paymentMd5: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${KHPAY_CONFIG.BASE_URL}/qr/verify/${paymentMd5}`, {
          headers: { 'Authorization': `Bearer ${KHPAY_CONFIG.API_KEY}` }
        });

        if (res.data.paid === true || res.data.status === 'success') {
          setPaymentStatus('success');
          clearInterval(interval);
        }
      } catch (e) {
        console.log("Checking payment...");
      }
    }, 4000); // Check every 4 seconds

    // Stop checking after 10 minutes to save resources
    setTimeout(() => clearInterval(interval), 600000);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 flex flex-col items-center">
      <div className="max-w-md w-full space-y-8 bg-gray-900 p-8 rounded-3xl shadow-2xl border border-gray-800">
        <div className="text-center">
          <h1 className="text-3xl font-black text-blue-500">DIAMOND SHOP</h1>
          <p className="text-gray-400 text-sm mt-2">Instant Topup via KHQR</p>
        </div>

        {/* Input Fields */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <input 
              type="text" placeholder="Player ID"
              className="flex-1 bg-gray-800 border border-gray-700 p-3 rounded-xl focus:outline-none focus:ring-2 ring-blue-500"
              value={playerId} onChange={(e) => setPlayerId(e.target.value)}
            />
            <input 
              type="text" placeholder="(Server)"
              className="w-24 bg-gray-800 border border-gray-700 p-3 rounded-xl focus:outline-none focus:ring-2 ring-blue-500"
              value={serverId} onChange={(e) => setServerId(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-2">
            {DIAMOND_PACKS.map(pack => (
              <button
                key={pack.id}
                onClick={() => setSelectedPack(pack)}
                className={`p-4 rounded-xl border-2 transition-all flex justify-between items-center ${
                  selectedPack?.id === pack.id ? 'border-blue-500 bg-blue-500/10' : 'border-gray-800 bg-gray-800/40'
                }`}
              >
                <span className="font-bold">{pack.name}</span>
                <span className="text-blue-400 font-black">${pack.price.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Area */}
        <div className="pt-4">
          {paymentStatus === 'idle' && (
            <button
              onClick={generatePayment}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-bold text-lg transition-transform active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Pay with KHQR'}
            </button>
          )}

          {paymentStatus === 'pending' && (
            <div className="text-center space-y-4 animate-fadeIn">
              <div className="bg-white p-4 rounded-2xl inline-block">
                <QRCodeSVG value={qrString} size={220} />
              </div>
              <div className="flex items-center justify-center gap-2 text-yellow-500">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <p className="text-sm font-bold uppercase tracking-widest">Waiting for Payment</p>
              </div>
              <button 
                onClick={() => setPaymentStatus('idle')}
                className="text-gray-500 text-xs hover:underline"
              >
                Cancel and change order
              </button>
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="text-center py-6 bg-green-500/10 border border-green-500/50 rounded-2xl">
              <div className="text-4xl mb-2">🎉</div>
              <h2 className="text-xl font-bold text-green-500">Payment Received!</h2>
              <p className="text-gray-400 text-sm">Diamonds are being sent to {playerId}.</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 text-sm bg-green-600 px-4 py-2 rounded-lg font-bold"
              >
                New Order
              </button>
            </div>
          )}
        </div>
      </div>

      <footer className="mt-8 text-gray-600 text-xs">
        Secure Payment via KHPay API • {KHPAY_CONFIG.BAKONG_ID}
      </footer>
    </div>
  );
}
