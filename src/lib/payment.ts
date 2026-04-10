import { supabase } from '@/integrations/supabase/client';

export async function createBakongQR(amount: number, orderId: string): Promise<{ qrImage: string; md5: string }> {
  const { data, error } = await supabase.functions.invoke('bakong-payment', {
    body: { action: 'create_qr', amount, orderId },
  });

  if (error) throw error;

  // Generate QR image from the QR string using qrcode library
  const QRCode = await import('qrcode');
  const qrImage = await QRCode.toDataURL(data.qr, { width: 300, margin: 2 });

  // Use orderId as md5 identifier for payment checking
  const md5 = data.md5 || orderId;

  return { qrImage, md5 };
}

export async function checkBakongPayment(
  md5: string,
  orderId: string,
  createdAt: string
): Promise<{ paid: boolean; expired: boolean; txHash?: string }> {
  // Check expiry (5 minutes)
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  if (now - created > 5 * 60 * 1000) {
    return { paid: false, expired: true };
  }

  const { data, error } = await supabase.functions.invoke('bakong-payment', {
    body: { action: 'verify_payment', md5, orderId },
  });

  if (error) throw error;

  return {
    paid: data.paid || false,
    expired: false,
    txHash: data.hash,
  };
}
