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
      navigate('/');
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

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const copyAccount = () => {
    navigator.clipboard.writeText(BAKONG_ACCOUNT);
    toast({ title: 'Copied!', description: 'Bakong account copied' });
  };

  if (!order) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-lg px-4 py-8">
        <div className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="mb-6 text-center">
            {status === 'pending' && (
              <>
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h2 className="font-heading text-xl font-bold text-foreground">Waiting for Payment</h2>
                <p className="mt-1 font-heading text-2xl font-bold text-accent">{formatTime(timeLeft)}</p>
              </>
            )}
            {status === 'completed' && (
              <>
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                <h2 className="font-heading text-xl font-bold text-success">Payment Confirmed!</h2>
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

          <div className="mb-6 space-y-3 rounded-xl bg-muted p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-mono text-foreground">{order.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Game</span>
              <span className="text-foreground">{order.gameName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Package</span>
              <span className="text-foreground">{order.packageName}</span>
            </div>
            {order.playerName && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Player</span>
                <span className="font-bold text-success">{order.playerName}</span>
              </div>
            )}
            <div className="border-t border-border pt-3">
              <div className="flex justify-between">
                <span className="font-medium text-foreground">Total</span>
                <span className="font-heading text-lg font-bold text-primary">${order.price.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {status === 'pending' && (
            <div className="space-y-4">
              <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
                <p className="mb-2 text-center text-sm font-medium text-foreground">Transfer to Bakong</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="rounded-lg bg-muted px-4 py-2 font-mono text-lg text-primary">{BAKONG_ACCOUNT}</code>
                  <button onClick={copyAccount} className="rounded-lg bg-muted p-2 text-muted-foreground hover:text-primary">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Amount: <span className="font-bold text-primary">${order.price.toFixed(2)}</span>
                </p>
                <p className="mt-1 text-center text-xs text-muted-foreground">
                  Memo: <span className="font-mono text-primary">{order.id}</span>
                </p>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                ⚠️ Payment expires in {EXPIRY_MINUTES} minutes
              </p>
            </div>
          )}

          {(status === 'expired' || status === 'failed') && (
            <button
              onClick={() => navigate('/')}
              className="w-full rounded-xl bg-gradient-green py-3 font-heading text-sm font-bold text-primary-foreground"
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
