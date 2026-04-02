import QRCode from 'qrcode';
import { supabase } from '@/integrations/supabase/client';

const BAKONG_MERCHANT_ID = 'nyx_shop@bkjr';
const STORE_NAME = 'KiraStore';

// Call Bakong edge function to create real KHQR QR data and get MD5
export async function createBakongQR(amount: number, orderId: string): Promise<{ qr: string; md5: string; qrImage: string }> {
  const { data, error } = await supabase.functions.invoke('bakong-payment', {
    body: { action: 'create_qr', amount, orderId },
  });

  if (error) {
    console.error('Failed to create Bakong QR:', error);
    const fallbackQr = await generateLocalKHQRCode(amount, orderId);
    return { qr: '', md5: '', qrImage: fallbackQr };
  }

  // Generate QR image from the KHQR string
  const qrImage = await QRCode.toDataURL(data.qr, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' },
    errorCorrectionLevel: 'M',
  });

  return { qr: data.qr, md5: data.md5, qrImage };
}

// Check payment status via Bakong API (real MD5 verification) with backend expiry check
export async function checkBakongPayment(
  md5: string,
  orderId: string,
  createdAt?: string
): Promise<{ paid: boolean; txHash?: string; expired?: boolean }> {
  const { data, error } = await supabase.functions.invoke('bakong-payment', {
    body: { action: 'check_payment', md5, orderId, createdAt },
  });

  if (error) {
    console.error('Payment check failed:', error);
    return { paid: false };
  }

  return {
    paid: data.paid || false,
    txHash: data.hash,
    expired: data.expired || false,
  };
}

// Fallback local QR code generation
async function generateLocalKHQRCode(amount: number, orderId: string): Promise<string> {
  const payload = `bakong://pay?merchant=${BAKONG_MERCHANT_ID}&amount=${amount.toFixed(2)}&currency=USD&memo=${orderId}&store=${STORE_NAME}`;
  return QRCode.toDataURL(payload, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' },
    errorCorrectionLevel: 'M',
  });
}

export { BAKONG_MERCHANT_ID, STORE_NAME };
