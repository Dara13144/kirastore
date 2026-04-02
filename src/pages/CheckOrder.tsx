import { useState } from 'react';
import { Search, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { searchOrders, type Order } from '@/lib/store';

const statusConfig = {
  pending: { icon: Clock, color: 'text-primary', label: 'កំពុងរង់ចាំ' },
  completed: { icon: CheckCircle, color: 'text-success', label: 'បានបញ្ចប់' },
  failed: { icon: XCircle, color: 'text-destructive', label: 'បរាជ័យ' },
  expired: { icon: XCircle, color: 'text-muted-foreground', label: 'ផុតកំណត់' },
};

const CheckOrder = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Order[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const found = await searchOrders(query.trim());
    setResults(found);
    setSearched(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto max-w-lg px-4 py-8">
        <h1 className="mb-6 font-heading text-xl font-bold text-gradient-green animate-fade-in">ពិនិត្យការបញ្ជាទិញ</h1>

        <div className="mb-6 flex gap-2 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="បញ្ចូល Order ID ឬ Player Name..."
            className="flex-1 rounded-xl border-2 border-input bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <button onClick={handleSearch} disabled={loading} className="rounded-xl bg-gradient-green px-4 py-3 text-primary-foreground transition-transform hover:scale-105">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
          </button>
        </div>

        {searched && results.length === 0 && !loading && (
          <p className="text-center text-muted-foreground animate-fade-in">រកមិនឃើញការបញ្ជាទិញ។</p>
        )}

        <div className="space-y-3">
          {results.map((order, i) => {
            const cfg = statusConfig[order.status];
            const Icon = cfg.icon;
            return (
              <div key={order.id} className="rounded-2xl border-2 border-border bg-card p-4 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-sm text-foreground">{order.id}</span>
                  <span className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
                    <Icon className="h-3 w-3" /> {cfg.label}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>{order.gameName}</p>
                  <p>{order.packageName} • <span className="text-primary font-bold">${order.price.toFixed(2)}</span></p>
                  {order.playerName && <p>អ្នកលេង: <span className="text-success font-bold">{order.playerName}</span></p>}
                  <p className="text-xs">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CheckOrder;
