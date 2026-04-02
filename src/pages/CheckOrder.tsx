import { useState } from 'react';
import { Search, CheckCircle, Clock, XCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getOrders, type Order } from '@/lib/store';

const statusConfig = {
  pending: { icon: Clock, color: 'text-primary', label: 'Pending' },
  completed: { icon: CheckCircle, color: 'text-success', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-destructive', label: 'Failed' },
  expired: { icon: XCircle, color: 'text-muted-foreground', label: 'Expired' },
};

const CheckOrder = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Order[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    const orders = getOrders();
    const found = orders.filter(
      o => o.id.toLowerCase().includes(query.toLowerCase()) ||
           Object.values(o.playerIds).some(v => v.includes(query))
    );
    setResults(found);
    setSearched(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto max-w-lg px-4 py-8">
        <h1 className="mb-6 font-heading text-xl font-bold text-gradient-green">Check Order</h1>

        <div className="mb-6 flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Order ID or Player ID..."
            className="flex-1 rounded-xl border-2 border-input bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <button onClick={handleSearch} className="rounded-xl bg-gradient-green px-4 py-3 text-primary-foreground">
            <Search className="h-5 w-5" />
          </button>
        </div>

        {searched && results.length === 0 && (
          <p className="text-center text-muted-foreground">No orders found.</p>
        )}

        <div className="space-y-3">
          {results.map(order => {
            const cfg = statusConfig[order.status];
            const Icon = cfg.icon;
            return (
              <div key={order.id} className="rounded-2xl border-2 border-border bg-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-sm text-foreground">{order.id}</span>
                  <span className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
                    <Icon className="h-3 w-3" /> {cfg.label}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>{order.gameName}</p>
                  <p>{order.packageName} • <span className="text-primary font-bold">${order.price.toFixed(2)}</span></p>
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
