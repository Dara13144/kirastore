import { useState } from 'react';
import { Search, CheckCircle, Clock, XCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getOrders, type Order } from '@/lib/store';

const statusConfig = {
  pending: { icon: Clock, color: 'text-accent', label: 'Pending' },
  completed: { icon: CheckCircle, color: 'text-green-400', label: 'Completed' },
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
      o => o.id.toLowerCase().includes(query.toLowerCase()) || o.playerId.includes(query)
    );
    setResults(found);
    setSearched(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto max-w-lg px-4 py-8">
        <h1 className="mb-6 font-heading text-2xl font-bold text-gradient">Check Order</h1>

        <div className="mb-6 flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Order ID or Player ID..."
            className="flex-1 rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleSearch}
            className="rounded-lg bg-gradient-primary px-4 py-3 text-primary-foreground"
          >
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
              <div key={order.id} className="rounded-xl border border-border bg-gradient-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-sm text-foreground">{order.id}</span>
                  <span className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
                    <Icon className="h-3 w-3" /> {cfg.label}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Player: {order.playerId}</p>
                  <p>{order.packageName} • {order.diamonds} 💎 • ${order.price.toFixed(2)}</p>
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
