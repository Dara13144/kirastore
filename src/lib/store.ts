import mlbbIcon from '@/assets/mlbb-icon.png';
import freefireIcon from '@/assets/freefire-icon.png';
import hokIcon from '@/assets/hok-icon.png';
import magicchessIcon from '@/assets/magicchess-icon.png';
import mlbbBanner from '@/assets/mlbb-banner.jpg';
import freefireBanner from '@/assets/freefire-banner.jpg';

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

// Mock username database for ID checking (supports zone verification)
export interface MockUser {
  username: string;
  zoneId?: string;
  level?: number;
  server?: string;
}

export const MOCK_USERNAMES: Record<string, Record<string, MockUser>> = {
  'mlbb-kh': {
    '58647857': { username: 'ShadowHunter', zoneId: '56744', level: 45, server: 'Cambodia-1' },
    '12345678': { username: 'DragonKing', zoneId: '12001', level: 67, server: 'Cambodia-2' },
    '99887766': { username: 'MageMaster', zoneId: '56744', level: 32, server: 'Cambodia-1' },
    '11223344': { username: 'WarriorQueen', zoneId: '23456', level: 55, server: 'Cambodia-3' },
    '55667788': { username: 'NinjaStrike', zoneId: '56744', level: 78, server: 'Cambodia-1' },
  },
  'mlbb-ph': {
    '10001001': { username: 'PhilGamer', zoneId: '30001', level: 40, server: 'Philippines-1' },
    '10001002': { username: 'ManilaKing', zoneId: '30002', level: 52, server: 'Philippines-2' },
  },
  'mlbb-id': {
    '20001001': { username: 'IndoHero', zoneId: '40001', level: 60, server: 'Indonesia-1' },
    '20001002': { username: 'JakartaWarrior', zoneId: '40002', level: 38, server: 'Indonesia-2' },
  },
  'ff-kh': {
    '1234567890': { username: 'FireKhmer', level: 55, server: 'Garena-KH' },
    '9876543210': { username: 'BattleRoyal', level: 42, server: 'Garena-KH' },
    '1111222233': { username: 'StealthNinja', level: 30, server: 'Garena-KH' },
  },
  'ff-id': {
    '3000100100': { username: 'IndoFire', level: 48, server: 'Garena-ID' },
  },
  'ff-vn': {
    '4000100100': { username: 'VietFighter', level: 35, server: 'Garena-VN' },
  },
  'ff-tw': {
    '5000100100': { username: 'TaiwanFlame', level: 29, server: 'Garena-TW' },
  },
  'magic-chess': {
    '6000100100': { username: 'ChessMaster', level: 20, server: 'Global' },
  },
};

export const GAMES: Game[] = [
  {
    id: 'mlbb-kh',
    name: 'MOBILE LEGENDS | KHMER',
    publisher: 'Moonton',
    icon: mlbbIcon,
    banner: mlbbBanner,
    region: '🇰🇭',
    hot: true,
    idFields: [
      { label: 'USER ID', placeholder: '58647857', key: 'userId' },
      { label: 'ZONE ID', placeholder: '56744', key: 'zoneId' },
    ],
    packages: [
      { id: 'mlkh-1', name: '150x2', price: 2.38, category: 'best-seller', tag: 'First Recharge' },
      { id: 'mlkh-2', name: '50x2', price: 0.91, category: 'best-seller', tag: 'First Recharge' },
      { id: 'mlkh-3', name: '250x2', price: 3.79, category: 'best-seller', tag: 'First Recharge' },
      { id: 'mlkh-4', name: '500x2', price: 7.60, category: 'best-seller', tag: 'First Recharge' },
      { id: 'mlkh-5', name: '172+wkp', price: 4.05, category: 'best-seller' },
      { id: 'mlkh-6', name: '257+wkp', price: 5.07, category: 'best-seller', tag: 'Full Ticket' },
      { id: 'mlkh-7', name: 'Weekly Elite Bundle', price: 0.92, category: 'best-seller' },
      { id: 'mlkh-8', name: 'Monthly Epic Bundle', price: 3.99, category: 'best-seller' },
      { id: 'mlkh-9', name: '11 Diamonds', price: 0.25, category: 'normal' },
      { id: 'mlkh-10', name: '22 Diamonds', price: 0.49, category: 'normal' },
      { id: 'mlkh-11', name: '55 Diamonds', price: 0.92, category: 'normal', tag: 'Try' },
      { id: 'mlkh-12', name: '86 Diamonds', price: 1.29, category: 'normal' },
      { id: 'mlkh-13', name: '172 Diamonds', price: 2.53, category: 'normal' },
      { id: 'mlkh-14', name: '257 Diamonds', price: 3.79, category: 'normal' },
      { id: 'mlkh-15', name: '344 Diamonds', price: 5.06, category: 'normal' },
      { id: 'mlkh-16', name: '429 Diamonds', price: 6.32, category: 'normal' },
      { id: 'mlkh-17', name: '514 Diamonds', price: 7.59, category: 'normal' },
      { id: 'mlkh-18', name: '706 Diamonds', price: 10.11, category: 'normal' },
    ],
  },
  {
    id: 'mlbb-ph',
    name: 'MOBILE LEGENDS | PHILIPPINES',
    publisher: 'Moonton',
    icon: mlbbIcon,
    banner: mlbbBanner,
    region: '🇵🇭',
    idFields: [
      { label: 'USER ID', placeholder: '58647857', key: 'userId' },
      { label: 'ZONE ID', placeholder: '56744', key: 'zoneId' },
    ],
    packages: [
      { id: 'mlph-1', name: '56 Diamonds', price: 0.99, category: 'normal' },
      { id: 'mlph-2', name: '112 Diamonds', price: 1.99, category: 'normal' },
      { id: 'mlph-3', name: '224 Diamonds', price: 3.99, category: 'normal' },
    ],
  },
  {
    id: 'mlbb-id',
    name: 'MOBILE LEGENDS | INDONESIA',
    publisher: 'Moonton',
    icon: mlbbIcon,
    banner: mlbbBanner,
    region: '🇮🇩',
    idFields: [
      { label: 'USER ID', placeholder: '58647857', key: 'userId' },
      { label: 'ZONE ID', placeholder: '56744', key: 'zoneId' },
    ],
    packages: [
      { id: 'mlid-1', name: '86 Diamonds', price: 1.29, category: 'normal' },
      { id: 'mlid-2', name: '172 Diamonds', price: 2.53, category: 'normal' },
      { id: 'mlid-3', name: '257 Diamonds', price: 3.79, category: 'normal' },
    ],
  },
  {
    id: 'ff-kh',
    name: 'FREE FIRE | KHMER',
    publisher: 'Garena',
    icon: freefireIcon,
    banner: freefireBanner,
    region: '🇰🇭',
    hot: true,
    idFields: [
      { label: 'PLAYER ID', placeholder: '1234567890', key: 'playerId' },
    ],
    packages: [
      { id: 'ffkh-1', name: 'Evo3D', price: 0.82, category: 'best-seller' },
      { id: 'ffkh-2', name: 'Evo7D', price: 0.97, category: 'best-seller' },
      { id: 'ffkh-3', name: 'Evo30D', price: 2.49, category: 'best-seller' },
      { id: 'ffkh-4', name: 'WeeklyLite', price: 0.49, category: 'best-seller', tag: 'Get 20💎' },
      { id: 'ffkh-5', name: 'Good luck', price: 0.57, category: 'best-seller', tag: 'One day, by chance.' },
      { id: 'ffkh-6', name: 'lvp6', price: 0.42, category: 'best-seller' },
      { id: 'ffkh-7', name: 'lvp10', price: 0.79, category: 'best-seller' },
      { id: 'ffkh-8', name: 'lvp15', price: 0.79, category: 'best-seller' },
      { id: 'ffkh-9', name: '25 Diamonds', price: 0.29, category: 'normal', tag: 'Try' },
      { id: 'ffkh-10', name: '100 Diamonds', price: 0.95, category: 'normal' },
      { id: 'ffkh-11', name: '310 Diamonds', price: 2.85, category: 'normal' },
      { id: 'ffkh-12', name: '520 Diamonds', price: 4.75, category: 'normal' },
      { id: 'ffkh-13', name: '1060 Diamonds', price: 9.50, category: 'normal' },
    ],
  },
  {
    id: 'ff-id',
    name: 'FREE FIRE | INDONESIA',
    publisher: 'Garena',
    icon: freefireIcon,
    banner: freefireBanner,
    region: '🇮🇩',
    idFields: [
      { label: 'PLAYER ID', placeholder: '1234567890', key: 'playerId' },
    ],
    packages: [
      { id: 'ffid-1', name: '100 Diamonds', price: 0.99, category: 'normal' },
      { id: 'ffid-2', name: '310 Diamonds', price: 2.99, category: 'normal' },
    ],
  },
  {
    id: 'ff-vn',
    name: 'FREE FIRE | VIETNAM',
    publisher: 'Garena',
    icon: freefireIcon,
    banner: freefireBanner,
    region: '🇻🇳',
    idFields: [
      { label: 'PLAYER ID', placeholder: '1234567890', key: 'playerId' },
    ],
    packages: [
      { id: 'ffvn-1', name: '100 Diamonds', price: 0.99, category: 'normal' },
      { id: 'ffvn-2', name: '310 Diamonds', price: 2.99, category: 'normal' },
    ],
  },
  {
    id: 'ff-tw',
    name: 'FREE FIRE | TAIWAN',
    publisher: 'Garena',
    icon: freefireIcon,
    banner: freefireBanner,
    region: '🇹🇼',
    idFields: [
      { label: 'PLAYER ID', placeholder: '1234567890', key: 'playerId' },
    ],
    packages: [
      { id: 'fftw-1', name: '100 Diamonds', price: 0.99, category: 'normal' },
    ],
  },
  {
    id: 'magic-chess',
    name: 'MAGIC CHESS GOGO',
    publisher: 'Moonton',
    icon: magicchessIcon,
    banner: mlbbBanner,
    region: '',
    idFields: [
      { label: 'USER ID', placeholder: '58647857', key: 'userId' },
    ],
    packages: [
      { id: 'mc-1', name: '60 Diamonds', price: 0.99, category: 'normal' },
      { id: 'mc-2', name: '180 Diamonds', price: 2.99, category: 'normal' },
    ],
  },
  {
    id: 'hok',
    name: 'HONOR OF KINGS',
    publisher: 'TiMi Studio',
    icon: hokIcon,
    banner: mlbbBanner,
    region: '',
    outOfStock: true,
    idFields: [
      { label: 'USER ID', placeholder: '12345678', key: 'userId' },
    ],
    packages: [],
  },
];

const ORDERS_KEY = 'kira_store_orders';

export function getOrders(): Order[] {
  const raw = localStorage.getItem(ORDERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function addOrder(order: Order): void {
  const orders = getOrders();
  orders.unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function updateOrderStatus(orderId: string, status: Order['status'], txHash?: string): void {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx >= 0) {
    orders[idx].status = status;
    if (txHash) orders[idx].transactionHash = txHash;
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }
}

export function generateOrderId(): string {
  return 'KS-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}

export interface CheckResult {
  found: boolean;
  username: string;
  level?: number;
  server?: string;
  zoneMatch?: boolean;
}

export function checkGameUsername(gameId: string, mainId: string, zoneId?: string): CheckResult {
  const db = MOCK_USERNAMES[gameId];
  if (!db) return { found: false, username: '' };
  const user = db[mainId];
  if (!user) return { found: false, username: '' };
  
  // If game requires zone and zone was provided, verify it matches
  const zoneMatch = user.zoneId ? (zoneId === user.zoneId) : true;
  
  return {
    found: true,
    username: user.username,
    level: user.level,
    server: user.server,
    zoneMatch,
  };
}
