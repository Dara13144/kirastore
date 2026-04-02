import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { Clock, CheckCircle, XCircle, Copy, Loader2, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getOrders, updateOrderStatus, type Order } from '@/lib/store';
import { generateKHQRCode, generateTransactionMd5, checkPaymentWithMd5 } from '@/lib/payment';
import { useToast } from '@/hooks/use-toast';

const BAKONG_ACCOUNT = 'nyx_shop@bkjr';
const EXPIRY_MINUTES = 5;
const CHECK_INTERVAL_SEC = 120;

const Payment = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [timeLeft, setTimeLeft] = useState(EXPIRY_MINUTES * 60);
  const [status, setStatus] = useState<Order['status']>('pending');
  const [qrCode, setQrCode] = useState<string>('');
  const [qrLoading, setQrLoading] = useState(true);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [lastCheck, setLastCheck] = useState<string>('');

  useEffect(() => {
    const orders = getOrders();
    const found = orders.find(o => o.id === orderId);
    if (!found) { navigate('/'); return; }
    setOrder(found);
    setStatus(found.status);
    if (found.status !== 'pending') return;
    const created = new Date(found.createdAt).getTime();
    const expiresAt = created + EXPIRY_MINUTES * 60 * 1000;
    const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    setTimeLeft(remaining);
    if (remaining <= 0) { updateOrderStatus(found.id, 'expired'); setStatus('expired'); }
  }, [orderId, navigate]);

  useEffect(() => {
    if (!order || status !== 'pending') return;
    setQrLoading(true);
    generateKHQRCode(order.price, order.id).then(qr => { setQrCode(qr); setQrLoading(false); }).catch(() => setQrLoading(false));
  }, [order, status]);

  useEffect(() => {
    if (status !== 'pending' || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); if (order) { updateOrderStatus(order.id, 'expired'); setStatus('expired'); } return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status, timeLeft, order]);

  const performPaymentCheck = useCallback(async () => {
    if (!order || status !== 'pending') return;
    setCheckingPayment(true);
    const hash = generateTransactionMd5(order.id, order.price);
    try {
      const result = await checkPaymentWithMd5(order.id, order.price, hash);
      setLastCheck(new Date().toLocaleTimeString());
      if (result.paid) {
        updateOrderStatus(order.id, 'completed', result.txHash);
        setStatus('completed');
        toast({ title: '✅ ការទូទាត់បានបញ្ជាក់!', description: `បានផ្ទៀងផ្ទាត់ប្រតិបត្តិការ។ Hash: ${result.txHash}` });
      }
    } catch (err) { console.error('Payment check failed:', err); }
    finally { setCheckingPayment(false); }
  }, [order, status, toast]);

  useEffect(() => {
    if (status !== 'pending' || !order) return;
    const initialTimeout = setTimeout(performPaymentCheck, 30000);
    const interval = setInterval(performPaymentCheck, CHECK_INTERVAL_SEC * 1000);
    return () => { clearTimeout(initialTimeout); clearInterval(interval); };
  }, [status, order, performPaymentCheck]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const copyAccount = () => { navigator.clipboard.writeText(BAKONG_ACCOUNT); toast({ title: 'បានចម្លង!', description: 'គណនី Bakong បានចម្លង' }); };
  const copyOrderId = () => { if (!order) return; navigator.clipboard.writeText(order.id); toast({ title: 'បានចម្លង!', description: 'Order ID បានចម្លង' }); };

  if (!order) return null;
  const md5Hash = generateTransactionMd5(order.id, order.price);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-lg px-4 py-6">
        <button onClick={() => navigate('/')} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground animate-fade-in">
          <ArrowLeft className="h-4 w-4" /> ត្រលប់ទៅទំព័រដើម
        </button>

        <div className="rounded-t-2xl bg-accent px-6 py-4 animate-slide-down">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-accent-foreground">ការទូទាត់</h2>
            {status === 'pending' && (
              <div className="flex items-center gap-2 rounded-full bg-accent-foreground/20 px-3 py-1">
                <Clock className="h-4 w-4 text-accent-foreground animate-pulse-slow" />
                <span className="font-heading text-sm font-bold text-accent-foreground">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-b-2xl bg-card p-6 shadow-lg animate-fade-in">
          {status === 'pending' && (
            <div className="animate-scale-in">
              <div className="mb-6 text-center">
                <p className="font-heading text-sm font-medium uppercase text-muted-foreground">ចំនួនសរុប</p>
                <p className="font-heading text-4xl font-bold text-foreground">${order.price.toFixed(2)}</p>
              </div>

              <div className="mb-6 flex justify-center">
                {qrLoading ? (
                  <div className="flex h-[300px] w-[300px] items-center justify-center rounded-2xl bg-muted">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border-4 border-primary/20 bg-white p-2 shadow-green animate-scale-in">
                    <img src={qrCode} alt="KHQR Payment" className="h-[280px] w-[280px]" />
                  </div>
                )}
              </div>

              <p className="mb-4 text-center text-sm italic text-muted-foreground">
                ស្កេនជាមួយ ABA Mobile ឬកម្មវិធីដែលគាំទ្រ KHQR ដើម្បីបញ្ចប់ការទូទាត់។
              </p>

              <div className="mb-6 flex items-center justify-center gap-2">
                {checkingPayment ? (
                  <span className="flex items-center gap-2 text-sm text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" /> កំពុងផ្ទៀងផ្ទាត់ការទូទាត់...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-sm text-primary animate-pulse-slow">
                    <span className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-primary"></span>
                    </span>
                    កំពុងរង់ចាំការទូទាត់...
                  </span>
                )}
              </div>

              <div className="space-y-2 rounded-xl bg-muted p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order ID</span>
                  <button onClick={copyOrderId} className="flex items-center gap-1 font-mono text-foreground hover:text-primary">
                    {order.id} <Copy className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">គណនី</span>
                  <button onClick={copyAccount} className="flex items-center gap-1 font-mono text-primary font-bold hover:text-primary/80">
                    {BAKONG_ACCOUNT} <Copy className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ហ្គេម</span>
                  <span className="text-foreground">{order.gameName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">កញ្ចប់</span>
                  <span className="text-foreground">{order.packageName}</span>
                </div>
                {order.playerName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">អ្នកលេង</span>
                    <span className="font-bold text-success">{order.playerName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MD5 Hash</span>
                  <span className="font-mono text-xs text-muted-foreground">{md5Hash.substring(0, 16)}...</span>
                </div>
                {lastCheck && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ពិនិត្យចុងក្រោយ</span>
                    <span className="text-xs text-muted-foreground">{lastCheck}</span>
                  </div>
                )}
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                ⚠️ ផ្ទៀងផ្ទាត់ស្វ័យប្រវត្តិរៀងរាល់ 2 នាទី • ផុតកំណត់ក្នុង {EXPIRY_MINUTES} នាទី
              </p>
            </div>
          )}

          {status === 'completed' && (
            <div className="py-8 text-center animate-scale-in">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10 animate-bounce-once">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <h2 className="mb-2 font-heading text-2xl font-bold text-success">ការទូទាត់បានបញ្ជាក់!</h2>
              <p className="mb-1 text-sm text-muted-foreground">Order: <span className="font-mono">{order.id}</span></p>
              <p className="mb-1 text-sm text-muted-foreground">{order.gameName} • {order.packageName}</p>
              {order.transactionHash && (
                <p className="mb-4 text-xs text-muted-foreground">TX: <span className="font-mono">{order.transactionHash}</span></p>
              )}
              <button onClick={() => navigate('/')} className="mt-4 rounded-xl bg-gradient-green px-8 py-3 font-heading text-sm font-bold text-primary-foreground shadow-green transition-transform hover:scale-105">
                ត្រលប់ទៅហាង
              </button>
            </div>
          )}

          {(status === 'expired' || status === 'failed') && (
            <div className="py-8 text-center animate-fade-in">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <h2 className="mb-2 font-heading text-2xl font-bold text-destructive">
                {status === 'expired' ? 'ការទូទាត់ផុតកំណត់' : 'ការទូទាត់បរាជ័យ'}
              </h2>
              <p className="mb-6 text-sm text-muted-foreground">សូមព្យាយាមម្ដងទៀតជាមួយការបញ្ជាទិញថ្មី។</p>
              <button onClick={() => navigate('/')} className="rounded-xl bg-gradient-green px-8 py-3 font-heading text-sm font-bold text-primary-foreground shadow-green transition-transform hover:scale-105">
                ព្យាយាមម្ដងទៀត
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Payment;
