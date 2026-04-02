import { corsHeaders } from '@supabase/supabase-js/cors';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY is not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
  if (!TELEGRAM_API_KEY) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_API_KEY is not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { chat_id, type, order } = body;

    if (!chat_id || !type || !order) {
      return new Response(JSON.stringify({ error: 'Missing required fields: chat_id, type, order' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let message = '';

    if (type === 'new_order') {
      message = [
        '🛒 <b>ការបញ្ជាទិញថ្មី!</b>',
        '',
        `📋 Order ID: <code>${order.id}</code>`,
        `🎮 ហ្គេម: ${order.gameName}`,
        `📦 កញ្ចប់: ${order.packageName}`,
        `💰 តម្លៃ: <b>$${order.price?.toFixed(2)}</b>`,
        `👤 អ្នកលេង: ${order.playerName || 'N/A'}`,
        `🆔 IDs: ${order.playerIds ? Object.entries(order.playerIds).map(([k, v]) => `${k}: ${v}`).join(', ') : 'N/A'}`,
        '',
        `⏰ ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' })}`,
        '',
        '⏳ កំពុងរង់ចាំការទូទាត់...',
      ].join('\n');
    } else if (type === 'payment_confirmed') {
      message = [
        '✅ <b>ការទូទាត់បានបញ្ជាក់!</b>',
        '',
        `📋 Order ID: <code>${order.id}</code>`,
        `🎮 ហ្គេម: ${order.gameName}`,
        `📦 កញ្ចប់: ${order.packageName}`,
        `💰 តម្លៃ: <b>$${order.price?.toFixed(2)}</b>`,
        `👤 អ្នកលេង: ${order.playerName || 'N/A'}`,
        order.transactionHash ? `🔗 TX: <code>${order.transactionHash}</code>` : '',
        '',
        `⏰ ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' })}`,
      ].filter(Boolean).join('\n');
    } else if (type === 'payment_failed') {
      message = [
        '❌ <b>ការទូទាត់បរាជ័យ/ផុតកំណត់</b>',
        '',
        `📋 Order ID: <code>${order.id}</code>`,
        `🎮 ហ្គេម: ${order.gameName}`,
        `💰 តម្លៃ: $${order.price?.toFixed(2)}`,
        '',
        `⏰ ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' })}`,
      ].join('\n');
    } else {
      return new Response(JSON.stringify({ error: 'Invalid notification type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TELEGRAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Telegram API call failed [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true, message_id: data.result?.message_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error sending Telegram notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
