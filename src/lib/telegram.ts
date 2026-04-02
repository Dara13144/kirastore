import { supabase } from '@/integrations/supabase/client';

const TELEGRAM_CHAT_ID_KEY = 'kira_telegram_chat_id';

export function getTelegramChatId(): string {
  return localStorage.getItem(TELEGRAM_CHAT_ID_KEY) || '';
}

export function setTelegramChatId(chatId: string): void {
  localStorage.setItem(TELEGRAM_CHAT_ID_KEY, chatId);
}

export async function sendTelegramNotification(
  type: 'new_order' | 'payment_confirmed' | 'payment_failed',
  order: {
    id: string;
    gameName: string;
    packageName: string;
    price: number;
    playerName?: string;
    playerIds?: Record<string, string>;
    transactionHash?: string;
  }
): Promise<boolean> {
  const chatId = getTelegramChatId();
  if (!chatId) {
    console.log('No Telegram chat ID configured, skipping notification');
    return false;
  }

  try {
    const { data, error } = await supabase.functions.invoke('telegram-notify', {
      body: { chat_id: chatId, type, order },
    });

    if (error) {
      console.error('Telegram notification error:', error);
      return false;
    }

    console.log('Telegram notification sent:', data);
    return true;
  } catch (err) {
    console.error('Failed to send Telegram notification:', err);
    return false;
  }
}
