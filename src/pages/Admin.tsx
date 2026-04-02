import { useState, useEffect, useRef } from 'react';
import { Shield, CheckCircle, XCircle, Clock, RefreshCw, LogOut, Package, Settings, Plus, Trash2, Image, Edit3, Save, Upload, Send, Power, PowerOff, Eye, EyeOff } from 'lucide-react';
import { getOrders, updateOrderStatus, GAMES, type Order, type Game, type GamePackage } from '@/lib/store';
import { getTelegramChatId, setTelegramChatId, sendTelegramNotification } from '@/lib/telegram';

const ADMIN_EMAIL = 'iqbalahmed88600@gmail.com';
const ADMIN_PASS = 'kira2024';

const statusConfig = {
  pending: { icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
  completed: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
  failed: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  expired: { icon: XCircle, color: 'text-muted-foreground', bg: 'bg-muted' },
};

type Tab = 'orders' | 'products' | 'settings';

const Admin = () => {
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('all');
  const [tab, setTab] = useState<Tab>('orders');
  const [games, setGames] = useState<Game[]>([]);
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPublisher, setEditPublisher] = useState('');
  const iconInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const pkgImageInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{ gameId: string; field: 'icon' | 'banner' } | null>(null);
  const [pkgUploadTarget, setPkgUploadTarget] = useState<{ gameId: string; pkgId: string } | null>(null);

  useEffect(() => {
    const session = localStorage.getItem('kira_admin_session');
    if (session === ADMIN_EMAIL) {
      setAuthed(true);
      setOrders(getOrders());
      loadGames();
    }
  }, []);

  const loadGames = () => {
    const custom = localStorage.getItem('kira_custom_games');
    if (custom) setGames(JSON.parse(custom));
    else setGames([...GAMES]);
  };

  const login = () => {
    setLoginError('');
    if (email !== ADMIN_EMAIL) { setLoginError('អ៊ីមែលមិនត្រឹមត្រូវ។'); return; }
    if (pass !== ADMIN_PASS) { setLoginError('ពាក្យសម្ងាត់មិនត្រឹមត្រូវ។'); return; }
    setAuthed(true);
    localStorage.setItem('kira_admin_session', ADMIN_EMAIL);
    setOrders(getOrders());
    loadGames();
  };

  const logout = () => {
    setAuthed(false);
    localStorage.removeItem('kira_admin_session');
    setEmail(''); setPass('');
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

  const saveGames = (updatedGames: Game[]) => {
    setGames(updatedGames);
    localStorage.setItem('kira_custom_games', JSON.stringify(updatedGames));
  };

  const updateGameField = (gameId: string, field: keyof Game, value: any) => {
    const updated = games.map(g => g.id === gameId ? { ...g, [field]: value } : g);
    saveGames(updated);
  };

  const updatePackage = (gameId: string, pkgId: string, field: keyof GamePackage, value: any) => {
    const updated = games.map(g => {
      if (g.id !== gameId) return g;
      return { ...g, packages: g.packages.map(p => p.id === pkgId ? { ...p, [field]: value } : p) };
    });
    saveGames(updated);
  };

  const addPackage = (gameId: string) => {
    const newPkg: GamePackage = { id: `pkg-${Date.now()}`, name: 'កញ្ចប់ថ្មី', price: 0.99, category: 'normal' };
    const updated = games.map(g => g.id !== gameId ? g : { ...g, packages: [...g.packages, newPkg] });
    saveGames(updated);
  };

  const deletePackage = (gameId: string, pkgId: string) => {
    const updated = games.map(g => g.id !== gameId ? g : { ...g, packages: g.packages.filter(p => p.id !== pkgId) });
    saveGames(updated);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!uploadTarget || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      updateGameField(uploadTarget.gameId, uploadTarget.field, dataUrl);
      setUploadTarget(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePkgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!pkgUploadTarget || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      updatePackage(pkgUploadTarget.gameId, pkgUploadTarget.pkgId, 'image', dataUrl);
      setPkgUploadTarget(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const toggleAllPackages = (gameId: string, disabled: boolean) => {
    const updated = games.map(g => {
      if (g.id !== gameId) return g;
      return { ...g, packages: g.packages.map(p => ({ ...p, disabled })) };
    });
    saveGames(updated);
  };

  const startEdit = (game: Game) => {
    setEditingGameId(game.id);
    setEditName(game.name);
    setEditPublisher(game.publisher);
  };

  const saveEdit = (gameId: string) => {
    const updated = games.map(g => g.id === gameId ? { ...g, name: editName, publisher: editPublisher } : g);
    saveGames(updated);
    setEditingGameId(null);
  };

  // Login screen
  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-sm px-4 animate-scale-in">
          <div className="mb-6 flex flex-col items-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 animate-pulse-slow">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground">ផ្ទាំងគ្រប់គ្រង</h1>
            <p className="mt-1 text-sm text-muted-foreground">KIRA STORE Management</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">អ៊ីមែល</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} placeholder="admin@email.com"
                className="w-full rounded-xl border-2 border-input bg-card px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">ពាក្យសម្ងាត់</label>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} placeholder="ពាក្យសម្ងាត់..."
                className="w-full rounded-xl border-2 border-input bg-card px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors" />
            </div>
          </div>

          {loginError && <p className="mt-3 text-center text-sm font-medium text-destructive animate-shake">{loginError}</p>}

          <button onClick={login} className="mt-4 w-full rounded-xl bg-gradient-green py-3 font-heading text-sm font-bold text-primary-foreground shadow-green transition-transform hover:scale-[1.02]">
            ចូល
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hidden file inputs */}
      <input ref={iconInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      <input ref={pkgImageInputRef} type="file" accept="image/*" className="hidden" onChange={handlePkgImageUpload} />

      {/* Header */}
      <div className="bg-gradient-green px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="font-heading text-lg font-bold text-primary-foreground">KIRA STORE Admin</h1>
          <div className="flex items-center gap-2">
            <button onClick={loadOrders} className="rounded-lg bg-primary-foreground/15 p-2 text-primary-foreground hover:bg-primary-foreground/25 transition-colors">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button onClick={logout} className="rounded-lg bg-primary-foreground/15 p-2 text-primary-foreground hover:bg-primary-foreground/25 transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto animate-fade-in">
          {[
            { id: 'orders' as Tab, label: 'ការបញ្ជាទិញ', icon: Clock },
            { id: 'products' as Tab, label: 'ផលិតផល', icon: Package },
            { id: 'settings' as Tab, label: 'ការកំណត់', icon: Settings },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); if (t.id === 'orders') loadOrders(); if (t.id === 'products') loadGames(); }}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-all ${
                tab === t.id ? 'bg-primary text-primary-foreground scale-105' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Orders Tab */}
        {tab === 'orders' && (
          <div className="animate-fade-in">
            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: 'សរុប', value: stats.total, color: 'text-foreground' },
                { label: 'កំពុងរង់ចាំ', value: stats.pending, color: 'text-primary' },
                { label: 'បានបញ្ចប់', value: stats.completed, color: 'text-success' },
                { label: 'ចំណូល', value: `$${stats.revenue.toFixed(2)}`, color: 'text-primary' },
              ].map((s, i) => (
                <div key={s.label} className="rounded-xl border-2 border-border bg-card p-4 text-center transition-transform hover:scale-105" style={{ animationDelay: `${i * 100}ms` }}>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`font-heading text-xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="mb-4 flex gap-2 overflow-x-auto">
              {[
                { key: 'all', label: 'ទាំងអស់' },
                { key: 'pending', label: 'កំពុងរង់ចាំ' },
                { key: 'completed', label: 'បានបញ្ចប់' },
                { key: 'failed', label: 'បរាជ័យ' },
                { key: 'expired', label: 'ផុតកំណត់' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => { setFilter(f.key); loadOrders(); }}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-all ${
                    filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filtered.map((order, i) => {
                const cfg = statusConfig[order.status];
                const Icon = cfg.icon;
                return (
                  <div key={order.id} className="rounded-2xl border-2 border-border bg-card p-4 animate-fade-in transition-all hover:shadow-lg" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-sm text-foreground">{order.id}</span>
                      <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${cfg.color} ${cfg.bg}`}>
                        <Icon className="h-3 w-3" /> {order.status}
                      </span>
                    </div>
                    <div className="mb-3 text-sm text-muted-foreground">
                      <p>{order.gameName}</p>
                      <p>IDs: {Object.entries(order.playerIds).map(([k, v]) => `${k}: ${v}`).join(', ')}</p>
                      {order.playerName && <p>អ្នកលេង: <span className="text-success font-bold">{order.playerName}</span></p>}
                      <p>{order.packageName} • <span className="text-primary font-bold">${order.price.toFixed(2)}</span></p>
                      {order.transactionHash && <p className="text-xs">TX: <span className="font-mono">{order.transactionHash}</span></p>}
                      <p className="text-xs">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    {order.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleStatusChange(order.id, 'completed')} className="flex-1 rounded-lg bg-success/20 py-2 text-xs font-medium text-success hover:bg-success/30 transition-colors">
                          ✓ យល់ព្រម
                        </button>
                        <button onClick={() => handleStatusChange(order.id, 'failed')} className="flex-1 rounded-lg bg-destructive/20 py-2 text-xs font-medium text-destructive hover:bg-destructive/30 transition-colors">
                          ✗ បដិសេធ
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {filtered.length === 0 && <p className="py-12 text-center text-muted-foreground">មិនមានការបញ្ជាទិញ</p>}
            </div>
          </div>
        )}

        {/* Products Tab */}
        {tab === 'products' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="font-heading text-lg font-bold text-foreground">គ្រប់គ្រងផលិតផល</h2>
            {games.map((game, gi) => (
              <div key={game.id} className="rounded-2xl border-2 border-border bg-card p-4 animate-fade-in" style={{ animationDelay: `${gi * 80}ms` }}>
                {/* Game header with image management */}
                <div className="mb-3 flex items-start gap-3">
                  {/* Icon with upload */}
                  <div className="relative group">
                    <img src={game.icon} alt={game.name} className="h-14 w-14 rounded-xl object-contain" />
                    <button
                      onClick={() => {
                        setUploadTarget({ gameId: game.id, field: 'icon' });
                        iconInputRef.current?.click();
                      }}
                      className="absolute inset-0 flex items-center justify-center rounded-xl bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Upload className="h-5 w-5 text-primary-foreground" />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    {editingGameId === game.id ? (
                      <div className="space-y-1.5">
                        <input value={editName} onChange={e => setEditName(e.target.value)}
                          className="w-full rounded-lg bg-muted px-2 py-1 text-sm font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                        <input value={editPublisher} onChange={e => setEditPublisher(e.target.value)}
                          className="w-full rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                        <button onClick={() => saveEdit(game.id)} className="flex items-center gap-1 rounded-lg bg-success/20 px-2 py-1 text-xs text-success hover:bg-success/30">
                          <Save className="h-3 w-3" /> រក្សាទុក
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading text-sm font-bold text-foreground truncate">{game.name}</h3>
                          <button onClick={() => startEdit(game)} className="text-muted-foreground hover:text-primary">
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground">{game.publisher} • {game.region}</p>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={!!game.outOfStock} onChange={e => updateGameField(game.id, 'outOfStock', e.target.checked)} className="accent-destructive" />
                      <span className="text-muted-foreground">អស់ស្តុក</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={!!game.hot} onChange={e => updateGameField(game.id, 'hot', e.target.checked)} className="accent-accent" />
                      <span className="text-muted-foreground">HOT</span>
                    </label>
                  </div>
                </div>

                {/* Banner with upload */}
                <div className="relative group mb-3 overflow-hidden rounded-xl">
                  <img src={game.banner} alt="Banner" className="w-full h-24 object-cover rounded-xl" />
                  <button
                    onClick={() => {
                      setUploadTarget({ gameId: game.id, field: 'banner' });
                      bannerInputRef.current?.click();
                    }}
                    className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Image className="h-5 w-5 text-primary-foreground" />
                    <span className="text-sm font-medium text-primary-foreground">ផ្លាស់ប្តូរផ្ទាំងរូបភាព</span>
                  </button>
                </div>

                {/* Packages */}
                <div className="space-y-2">
                  {game.packages.map(pkg => (
                    <div key={pkg.id} className="flex items-center gap-2 rounded-lg bg-muted p-2">
                      <input value={pkg.name} onChange={e => updatePackage(game.id, pkg.id, 'name', e.target.value)}
                        className="flex-1 rounded bg-card px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                      <input type="number" step="0.01" value={pkg.price} onChange={e => updatePackage(game.id, pkg.id, 'price', parseFloat(e.target.value) || 0)}
                        className="w-20 rounded bg-card px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                      <select value={pkg.category} onChange={e => updatePackage(game.id, pkg.id, 'category', e.target.value)}
                        className="rounded bg-card px-2 py-1 text-xs text-foreground focus:outline-none">
                        <option value="normal">ធម្មតា</option>
                        <option value="best-seller">លក់ដាច់</option>
                      </select>
                      <input value={pkg.tag || ''} onChange={e => updatePackage(game.id, pkg.id, 'tag', e.target.value || undefined)}
                        placeholder="Tag"
                        className="w-16 rounded bg-card px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                      <button onClick={() => deletePackage(game.id, pkg.id)} className="rounded p-1 text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button onClick={() => addPackage(game.id)} className="mt-2 flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
                  <Plus className="h-3 w-3" /> បន្ថែមកញ្ចប់
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <div className="max-w-md space-y-4 animate-fade-in">
            <h2 className="font-heading text-lg font-bold text-foreground">ការកំណត់</h2>
            <div className="rounded-2xl border-2 border-border bg-card p-4">
              <h3 className="mb-3 font-heading text-sm font-bold text-foreground">ការកំណត់ការទូទាត់</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground">គណនី Bakong</label>
                  <p className="font-mono text-primary">nyx_shop@bkjr</p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground">ឈ្មោះហាង</label>
                  <p className="text-foreground">KiraStore</p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground">ចន្លោះពិនិត្យស្វ័យប្រវត្តិ</label>
                  <p className="text-foreground">រៀងរាល់ 2 នាទី</p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground">ផុតកំណត់ការទូទាត់</label>
                  <p className="text-foreground">5 នាទី</p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground">អ៊ីមែលអ្នកគ្រប់គ្រង</label>
                  <p className="text-foreground">{ADMIN_EMAIL}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-border bg-card p-4">
              <h3 className="mb-3 font-heading text-sm font-bold text-foreground">ស្ថានភាពប្រព័ន្ធ</h3>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'បង្កើត KHQR', status: 'សកម្ម' },
                  { label: 'ផ្ទៀងផ្ទាត់ MD5', status: 'សកម្ម' },
                  { label: 'ពិនិត្យការទូទាត់ស្វ័យប្រវត្តិ', status: 'រៀងរាល់ 2 នាទី' },
                  { label: 'ប្រព័ន្ធពិនិត្យ ID', status: 'សកម្ម' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="flex items-center gap-1 text-success"><CheckCircle className="h-3 w-3" /> {item.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => { localStorage.removeItem('kira_custom_games'); loadGames(); }}
              className="w-full rounded-xl bg-destructive/10 py-3 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors"
            >
              កំណត់ផលិតផលឡើងវិញទៅលំនាំដើម
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
