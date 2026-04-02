import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { getOrders, updateOrderStatus, type Order } from '@/lib/store';

const ADMIN_PASS = 'kira2024';

const statusConfig = {
  pending: { icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
  completed: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
  failed: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  expired: { icon: XCircle, color: 'text-muted-foreground', bg: 'bg-muted' },
};

const Admin = () => {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('all');

  const login = () => {
    if (pass === ADMIN_PASS) {
      setAuthed(true);
      setOrders(getOrders());
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-sm px-4">
          <div className="mb-6 flex flex-col items-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-heading text-xl font-bold text-foreground">Admin Panel</h1>
          </div>
          <input
            type="password"
            value={pass}
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            placeholder="Password..."
            className="mb-4 w-full rounded-xl border-2 border-input bg-card px-4 py-3 text-foreground focus:border-primary focus:outline-none"
          />
          <button onClick={login} className="w-full rounded-xl bg-gradient-green py-3 font-heading text-sm font-bold text-primary-foreground">
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-green px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="font-heading text-lg font-bold text-primary-foreground">KIRA STORE Admin</h1>
          <button onClick={loadOrders} className="rounded-lg bg-primary-foreground/15 p-2 text-primary-foreground">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: 'Total', value: stats.total, color: 'text-foreground' },
            { label: 'Pending', value: stats.pending, color: 'text-primary' },
            { label: 'Completed', value: stats.completed, color: 'text-success' },
            { label: 'Revenue', value: `$${stats.revenue.toFixed(2)}`, color: 'text-primary' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border-2 border-border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`font-heading text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto">
          {['all', 'pending', 'completed', 'failed', 'expired'].map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); loadOrders(); }}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium capitalize ${
                filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map(order => {
            const cfg = statusConfig[order.status];
            const Icon = cfg.icon;
            return (
              <div key={order.id} className="rounded-2xl border-2 border-border bg-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-sm text-foreground">{order.id}</span>
                  <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${cfg.color} ${cfg.bg}`}>
                    <Icon className="h-3 w-3" /> {order.status}
                  </span>
                </div>
                <div className="mb-3 text-sm text-muted-foreground">
                  <p>{order.gameName}</p>
                  <p>IDs: {Object.entries(order.playerIds).map(([k, v]) => `${k}: ${v}`).join(', ')}</p>
                  {order.playerName && <p>Player: <span className="text-success font-bold">{order.playerName}</span></p>}
                  <p>{order.packageName} • <span className="text-primary font-bold">${order.price.toFixed(2)}</span></p>
                  <p className="text-xs">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                {order.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusChange(order.id, 'completed')}
                      className="flex-1 rounded-lg bg-success/20 py-2 text-xs font-medium text-success hover:bg-success/30"
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
          {filtered.length === 0 && <p className="py-12 text-center text-muted-foreground">No orders</p>}
        </div>
      </div>
    </div>
  );
};

export default Admin;
