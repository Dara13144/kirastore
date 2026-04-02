import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Clock, Trash2, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getOrders, updateOrderStatus, type Order } from '@/lib/store';

const ADMIN_PASS = 'kira2024';

const statusConfig = {
  pending: { icon: Clock, color: 'text-accent', bg: 'bg-accent/10' },
  completed: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
  failed: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  expired: { icon: XCircle, color: 'text-muted-foreground', bg: 'bg-muted/30' },
};

const Admin = () => {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>('all');

  const login = () => {
    if (pass === ADMIN_PASS) {
      setAuthed(true);
      loadOrders();
    }
  };

  const loadOrders = () => setOrders(getOrders());

  const handleStatusChange = (orderId: string, status: Order['status']) => {
    updateOrderStatus(orderId, status);
    loadOrders();
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    completed: orders.filter(o => o.status === 'completed').length,
    revenue: orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.price, 0),
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto flex max-w-sm flex-col items-center px-4 py-24">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <Shield className="h-8 w-8 text-accent" />
          </div>
          <h1 className="mb-6 font-heading text-xl font-bold text-foreground">Admin Panel</h1>
          <input
            type="password"
            value={pass}
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            placeholder="Password..."
            className="mb-4 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={login}
            className="w-full rounded-xl bg-gradient-gold py-3 font-heading text-sm font-bold text-accent-foreground"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold text-gradient-gold">Admin Panel</h1>
          <button onClick={loadOrders} className="rounded-lg bg-muted p-2 text-muted-foreground hover:text-primary">
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: 'Total Orders', value: stats.total, color: 'text-foreground' },
            { label: 'Pending', value: stats.pending, color: 'text-accent' },
            { label: 'Completed', value: stats.completed, color: 'text-green-400' },
            { label: 'Revenue', value: `$${stats.revenue.toFixed(2)}`, color: 'text-primary' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-gradient-card p-4 text-center">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`font-heading text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {['all', 'pending', 'completed', 'failed', 'expired'].map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); loadOrders(); }}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium capitalize transition-colors ${
                filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Orders */}
        <div className="space-y-3">
          {filtered.map(order => {
            const cfg = statusConfig[order.status];
            const Icon = cfg.icon;
            return (
              <div key={order.id} className="rounded-xl border border-border bg-gradient-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-sm text-foreground">{order.id}</span>
                  <span className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${cfg.color} ${cfg.bg}`}>
                    <Icon className="h-3 w-3" /> {order.status}
                  </span>
                </div>
                <div className="mb-3 text-sm text-muted-foreground">
                  <p>Player: <span className="text-foreground">{order.playerId}</span></p>
                  <p>{order.packageName} • {order.diamonds} 💎 • <span className="text-primary">${order.price.toFixed(2)}</span></p>
                  <p className="text-xs">{new Date(order.createdAt).toLocaleString()}</p>
                </div>

                {order.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusChange(order.id, 'completed')}
                      className="flex-1 rounded-lg bg-green-500/20 py-2 text-xs font-medium text-green-400 hover:bg-green-500/30"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleStatusChange(order.id, 'failed')}
                      className="flex-1 rounded-lg bg-destructive/20 py-2 text-xs font-medium text-destructive hover:bg-destructive/30"
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">No orders found.</p>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Admin;
