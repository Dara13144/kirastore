import { supabase } from '@/integrations/supabase/client';
import mlbbIcon from '@/assets/mlbb-icon.png';
import freefireIcon from '@/assets/freefire-icon.png';
import hokIcon from '@/assets/hok-icon.png';
import magicchessIcon from '@/assets/magicchess-icon.png';
import mlbbBanner from '@/assets/mlbb-banner.jpg';
import freefireBanner from '@/assets/freefire-banner.jpg';

// Default asset mappings by game ID prefix
const DEFAULT_ICONS: Record<string, string> = {
  'mlbb': mlbbIcon,
  'ff': freefireIcon,
  'hok': hokIcon,
  'magic': magicchessIcon,
};

const DEFAULT_BANNERS: Record<string, string> = {
  'mlbb': mlbbBanner,
  'ff': freefireBanner,
  'hok': mlbbBanner,
  'magic': mlbbBanner,
};

export function getDefaultIcon(gameId: string): string {
  for (const [prefix, icon] of Object.entries(DEFAULT_ICONS)) {
    if (gameId.startsWith(prefix)) return icon;
  }
  return mlbbIcon;
}

export function getDefaultBanner(gameId: string): string {
  for (const [prefix, banner] of Object.entries(DEFAULT_BANNERS)) {
    if (gameId.startsWith(prefix)) return banner;
  }
  return mlbbBanner;
}

export interface Game {
  id: string;
  name: string;
  publisher: string;
  icon: string;
  banner: string;
  region: string;
  hot?: boolean;
  outOfStock?: boolean;
  idFields: { label: string; placeholder: string; key: string }[];
  packages: GamePackage[];
}

export interface GamePackage {
  id: string;
  name: string;
  price: number;
  category: 'best-seller' | 'normal';
  tag?: string;
  image?: string;
  disabled?: boolean;
}

export interface Order {
  id: string;
  gameId: string;
  gameName: string;
  playerIds: Record<string, string>;
  playerName?: string;
  packageId: string;
  packageName: string;
  price: number;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  createdAt: string;
  transactionHash?: string;
}

export interface CheckResult {
  found: boolean;
  username: string;
  level?: number;
  server?: string;
  zoneMatch?: boolean;
}

// ========== Database query functions ==========

export async function fetchGamesWithPackages(): Promise<Game[]> {
  const { data: gamesData, error: gamesError } = await supabase
    .from('games')
    .select('*')
    .order('sort_order');

  if (gamesError) {
    console.error('Error fetching games:', gamesError);
    return [];
  }

  const { data: packagesData, error: pkgError } = await supabase
    .from('game_packages')
    .select('*')
    .order('sort_order');

  if (pkgError) {
    console.error('Error fetching packages:', pkgError);
    return [];
  }

  return (gamesData || []).map((g: any) => ({
    id: g.id,
    name: g.name,
    publisher: g.publisher,
    icon: g.icon_url || getDefaultIcon(g.id),
    banner: g.banner_url || getDefaultBanner(g.id),
    region: g.region || '',
    hot: g.hot || false,
    outOfStock: g.out_of_stock || false,
    idFields: (g.id_fields as any[]) || [],
    packages: (packagesData || [])
      .filter((p: any) => p.game_id === g.id)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        category: p.category as 'best-seller' | 'normal',
        tag: p.tag || undefined,
        image: p.image_url || undefined,
        disabled: p.disabled || false,
      })),
  }));
}

export async function fetchGameById(gameId: string): Promise<Game | null> {
  const { data: g, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (error || !g) return null;

  const { data: pkgs } = await supabase
    .from('game_packages')
    .select('*')
    .eq('game_id', gameId)
    .order('sort_order');

  return {
    id: g.id,
    name: g.name,
    publisher: g.publisher,
    icon: g.icon_url || getDefaultIcon(g.id),
    banner: g.banner_url || getDefaultBanner(g.id),
    region: g.region || '',
    hot: g.hot || false,
    outOfStock: g.out_of_stock || false,
    idFields: (g.id_fields as any[]) || [],
    packages: (pkgs || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      category: p.category as 'best-seller' | 'normal',
      tag: p.tag || undefined,
      image: p.image_url || undefined,
      disabled: p.disabled || false,
    })),
  };
}

// ========== Order functions (now using DB) ==========

export async function addOrder(order: Order): Promise<void> {
  const { error } = await supabase.from('orders').insert({
    id: order.id,
    game_id: order.gameId,
    game_name: order.gameName,
    player_ids: order.playerIds,
    player_name: order.playerName || null,
    package_id: order.packageId,
    package_name: order.packageName,
    price: order.price,
    status: order.status,
    created_at: order.createdAt,
  });
  if (error) console.error('Error adding order:', error);
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error || !data) return null;
  return mapDbOrder(data);
}

export async function searchOrders(query: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .or(`id.ilike.%${query}%,player_name.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error searching orders:', error);
    return [];
  }
  return (data || []).map(mapDbOrder);
}

export async function updateOrderStatus(orderId: string, status: Order['status'], txHash?: string): Promise<void> {
  const updates: Record<string, unknown> = { status };
  if (txHash) updates.transaction_hash = txHash;
  
  const { error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId);
  
  // Fallback: also try via admin edge function (for non-anon updates)
  if (error) {
    console.warn('Direct update failed, trying admin endpoint:', error);
    try {
      await adminApiCall('update_order_status', { id: orderId, status, transaction_hash: txHash });
    } catch (e) {
      console.error('Admin update also failed:', e);
    }
  }
}

function mapDbOrder(data: any): Order {
  return {
    id: data.id,
    gameId: data.game_id,
    gameName: data.game_name,
    playerIds: data.player_ids as Record<string, string>,
    playerName: data.player_name || undefined,
    packageId: data.package_id,
    packageName: data.package_name,
    price: Number(data.price),
    status: data.status as Order['status'],
    createdAt: data.created_at,
    transactionHash: data.transaction_hash || undefined,
  };
}

export function generateOrderId(): string {
  return 'KS-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}

// ========== Admin API helper ==========

export async function adminApiCall(action: string, body?: any): Promise<any> {
  const adminAuth = localStorage.getItem('kira_admin_auth');
  if (!adminAuth) throw new Error('Not authenticated as admin');

  const { data, error } = await supabase.functions.invoke('admin-products', {
    body: body || {},
    headers: {
      'x-admin-auth': adminAuth,
    },
  });

  if (error) throw error;
  return data;
}

// Keep for backward compat but mark deprecated
export const GAMES: Game[] = [];

// Mock username data kept for verify-game-id edge function reference
export const MOCK_USERNAMES: Record<string, Record<string, any>> = {};

export function checkGameUsername(gameId: string, mainId: string, zoneId?: string): CheckResult {
  return { found: false, username: '' };
}
