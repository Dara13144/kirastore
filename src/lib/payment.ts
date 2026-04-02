import QRCode from 'qrcode';
import md5 from 'md5';

const BAKONG_MERCHANT_ID = 'nyx_shop@bkjr';
const BAKONG_API_TOKEN = 'rbkUyfi6Vs2hNb7jBYreOQW7E--qmeFknBwsBYfoTWJ7bs';
const STORE_NAME = 'KiraStore';

// Generate MD5 hash for transaction verification
export function generateTransactionMd5(transactionId: string, amount: number): string {
  const raw = `${transactionId}|${amount}|${BAKONG_API_TOKEN}`;
  return md5(raw);
}

// Verify MD5 hash
export function verifyTransactionMd5(transactionId: string, amount: number, hash: string): boolean {
  const expected = generateTransactionMd5(transactionId, amount);
  return expected === hash;
}

// Generate KHQR data string (Bakong format)
function buildKHQRPayload(amount: number, orderId: string): string {
  return JSON.stringify({
    merchant: BAKONG_MERCHANT_ID,
    amount: amount.toFixed(2),
    currency: 'USD',
    store: STORE_NAME,
    orderId,
    memo: orderId,
  });
}

// Generate QR code as data URL
export async function generateKHQRCode(amount: number, orderId: string): Promise<string> {
  const payload = `bakong://pay?merchant=${BAKONG_MERCHANT_ID}&amount=${amount.toFixed(2)}&currency=USD&memo=${orderId}&store=${STORE_NAME}`;
  
  const qrDataUrl = await QRCode.toDataURL(payload, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  });
  
  return qrDataUrl;
}

// Simulate checking payment status against Bakong API
export async function checkPaymentWithMd5(
  transactionId: string,
  amount: number,
  storedHash: string
): Promise<{ paid: boolean; txHash?: string }> {
  // Simulate API delay
  await new Promise(r => setTimeout(r, 500));

  // Verify MD5 integrity
  const isValid = verifyTransactionMd5(transactionId, amount, storedHash);
  if (!isValid) {
    return { paid: false };
  }

  // Simulate: check if payment was received
  // In production, this would call Bakong API:
  // const response = await fetch(`https://api.bakong.com.kh/v1/check/${transactionId}`, { ... });
  
  // For demo: auto-confirm after some time has passed (random chance increases over time)
  const orderData = localStorage.getItem('kira_store_orders');
  if (orderData) {
    const orders = JSON.parse(orderData);
    const order = orders.find((o: any) => o.id === transactionId);
    if (order) {
      const elapsed = (Date.now() - new Date(order.createdAt).getTime()) / 1000;
      // Increase confirmation chance over time
      const chance = Math.min(0.8, elapsed / 300); // Max 80% after 5 min
      if (Math.random() < chance) {
        return { paid: true, txHash: `BK_${Date.now().toString(36).toUpperCase()}` };
      }
    }
  }

  return { paid: false };
}

export { BAKONG_MERCHANT_ID, STORE_NAME };
