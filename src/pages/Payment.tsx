import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Clock, CheckCircle, XCircle, Copy } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getOrders, updateOrderStatus, type Order } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

const BAKONG_ACCOUNT = 'nyx_shop@bkjr';
const EXPIRY_MINUTES = 5;

const Payment = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [timeLeft, setTimeLeft] = useState(EXPIRY_MINUTES * 60);
  const [status, setStatus] = useState<Order['status']>('pending');

  useEffect(() => {
    const orders = getOrders();
    const found = orders.find(o => o.id === orderId);
    if (!found) {
      navigate('/topup');
      return;
    }
    setOrder(found);
    setStatus(found.status);

    if (found.status !== 'pending') return;

    const created = new Date(found.createdAt).getTime();
    const expiresAt = created + EXPIRY_MINUTES * 60 * 1000;
    const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    setTimeLeft(remaining);

    if (remaining <= 0) {
      updateOrderStatus(found.id, 'expired');
      setStatus('expired');
    }
  }, [orderId, navigate]);

  // Countdown timer
  useEffect(() => {
    if (status !== 'pending' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (order) {
            updateOrderStatus(order.id, 'expired');
            setStatus('expired');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, timeLeft, order]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const copyAccount = () => {
    navigator.clipboard.writeText(BAKONG_ACCOUNT);
    toast({ title: 'Copied!', description: 'Bakong account copied to clipboard' });
  };

  if (!order) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto max-w-lg px-4 py-8">
        <div className="rounded-2xl border border-border bg-gradient-card p-6">
          {/* Status */}
          <div className="mb-6 text-center">
            {status === 'pending' && (
              <>
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 animate-pulse-glow">
                  <Clock className="h-8 w-8 text-accent" />
                </div>
                <h2 className="font-heading text-xl font-bold text-foreground">Waiting for Payment</h2>
                <p className="mt-1 font-heading text-2xl font-bold text-accent">{formatTime(timeLeft)}</p>
              </>
            )}
            {status === 'completed' && (
              <>
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <h2 className="font-heading text-xl font-bold text-green-400">Payment Confirmed!</h2>
              </>
            )}
            {(status === 'failed' || status === 'expired') && (
              <>
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="font-heading text-xl font-bold text-destructive">
                  {status === 'expired' ? 'Payment Expired' : 'Payment Failed'}
                </h2>
              </>
            )}
          </div>

          {/* Order Details */}
          <div className="mb-6 space-y-3 rounded-xl bg-muted/30 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-mono text-foreground">{order.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Player ID</span>
              <span className="text-foreground">{order.playerId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Package</span>
              <span className="text-foreground">{order.packageName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Diamonds</span>
              <span className="text-primary font-bold">{order.diamonds.toLocaleString()} 💎</span>
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex justify-between">
                <span className="font-medium text-foreground">Total</span>
                <span className="font-heading text-lg font-bold text-accent">${order.price.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Instructions */}
          {status === 'pending' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="mb-2 text-center text-sm font-medium text-foreground">
                  Transfer to Bakong Account
                </p>
                <div className="flex items-center justify-center gap-2">
                  <code className="rounded-lg bg-muted px-4 py-2 font-mono text-lg text-primary">
                    {BAKONG_ACCOUNT}
                  </code>
                  <button onClick={copyAccount} className="rounded-lg bg-muted p-2 text-muted-foreground hover:text-primary">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Amount: <span className="font-bold text-accent">${order.price.toFixed(2)}</span>
                </p>
                <p className="mt-1 text-center text-xs text-muted-foreground">
                  Memo/Note: <span className="font-mono text-primary">{order.id}</span>
                </p>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                ⚠️ Payment will expire in {EXPIRY_MINUTES} minutes. Include the Order ID in the memo.
              </p>
            </div>
          )}

          {(status === 'expired' || status === 'failed') && (
            <button
              onClick={() => navigate('/topup')}
              className="w-full rounded-xl bg-gradient-primary py-3 font-heading text-sm font-bold text-primary-foreground"
            >
              Try Again
            </button>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Payment;
