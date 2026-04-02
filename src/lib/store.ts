export interface DiamondPackage {
  id: string;
  name: string;
  diamonds: number;
  price: number; // in USD
  priceKHR: number; // in KHR
  popular?: boolean;
  bonus?: number;
}

export interface Order {
  id: string;
  playerId: string;
  playerName?: string;
  packageId: string;
  packageName: string;
  diamonds: number;
  price: number;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  createdAt: string;
  transactionHash?: string;
}

export const DIAMOND_PACKAGES: DiamondPackage[] = [
  { id: '1', name: '56 Diamonds', diamonds: 56, price: 1.00, priceKHR: 4100 },
  { id: '2', name: '112 Diamonds', diamonds: 112, price: 2.00, priceKHR: 8200 },
  { id: '3', name: '224 Diamonds', diamonds: 224, price: 3.99, priceKHR: 16359, popular: true },
  { id: '4', name: '336 Diamonds', diamonds: 336, price: 5.99, priceKHR: 24559 },
  { id: '5', name: '514 Diamonds', diamonds: 514, price: 8.99, priceKHR: 36859, bonus: 25 },
  { id: '6', name: '706 Diamonds', diamonds: 706, price: 11.99, priceKHR: 49159, popular: true, bonus: 50 },
  { id: '7', name: '1412 Diamonds', diamonds: 1412, price: 22.99, priceKHR: 94259, bonus: 100 },
  { id: '8', name: '2195 Diamonds', diamonds: 2195, price: 34.99, priceKHR: 143459, bonus: 200 },
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
