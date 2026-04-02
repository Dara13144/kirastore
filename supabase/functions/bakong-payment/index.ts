const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const RECEIVER_ACCOUNT = 'nyx_shop@bkjr'
const MERCHANT_NAME = 'KiraStore'
const CHECK_API_URL = 'https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5'
const TELEGRAM_GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram'
const EXPIRY_SECONDS = 300 // 5 minutes

function getSupabase() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
}

// ========== KHQR Generation ==========

function generateKHQRString(amount: number, billNumber: string): string {
  const tags: [string, string][] = [
    ['00', '01'],
    ['01', '12'],
    ['29', buildMerchantAccount()],
    ['52', '5999'],
    ['53', '840'],
    ['54', amount.toFixed(2)],
    ['58', 'KH'],
    ['59', MERCHANT_NAME],
    ['60', 'Phnom Penh'],
    ['62', buildAdditionalData(billNumber)],
  ]

  let payload = ''
  for (const [id, value] of tags) {
    payload += id + String(value.length).padStart(2, '0') + value
  }

  payload += '6304'
  const crc = computeCRC16(payload)
  return payload + crc
}

function buildMerchantAccount(): string {
  let sub = ''
  sub += '00' + String('bakong'.length).padStart(2, '0') + 'bakong'
  sub += '01' + String(RECEIVER_ACCOUNT.length).padStart(2, '0') + RECEIVER_ACCOUNT
  sub += '02' + String('JTR'.length).padStart(2, '0') + 'JTR'
  return sub
}

function buildAdditionalData(billNumber: string): string {
  return '01' + String(billNumber.length).padStart(2, '0') + billNumber
}

function computeCRC16(str: string): string {
  let crc = 0xFFFF
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc <<= 1
      }
      crc &= 0xFFFF
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

// ========== Pure JS MD5 Hash (no crypto.subtle) ==========

function md5(string: string): string {
  function md5cycle(x: number[], k: number[]) {
    let a = x[0], b = x[1], c = x[2], d = x[3];
    a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329);
    a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734);
    a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651);
    a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551);
    x[0] = add32(a, x[0]); x[1] = add32(b, x[1]); x[2] = add32(c, x[2]); x[3] = add32(d, x[3]);
  }
  function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cmn(b ^ c ^ d, a, b, x, s, t); }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }
  function md51(s: string) {
    const n = s.length;
    let state = [1732584193, -271733879, -1732584194, 271733878];
    let i: number;
    for (i = 64; i <= n; i += 64) {
      md5cycle(state, md5blk(s.substring(i - 64, i)));
    }
    s = s.substring(i - 64);
    const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (i = 0; i < s.length; i++) tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
    tail[i >> 2] |= 0x80 << ((i % 4) << 3);
    if (i > 55) { md5cycle(state, tail); for (i = 0; i < 16; i++) tail[i] = 0; }
    tail[14] = n * 8;
    md5cycle(state, tail);
    return state;
  }
  function md5blk(s: string) {
    const md5blks: number[] = [];
    for (let i = 0; i < 64; i += 4) {
      md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
    }
    return md5blks;
  }
  const hex_chr = '0123456789abcdef'.split('');
  function rhex(n: number) {
    let s = '';
    for (let j = 0; j < 4; j++) s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
    return s;
  }
  function hex(x: number[]) { for (let i = 0; i < x.length; i++) x[i] = rhex(x[i]); return (x as unknown as string[]).join(''); }
  function add32(a: number, b: number) { return (a + b) & 0xFFFFFFFF; }
  return hex(md51(string)) as unknown as string;
}

function generateMD5(input: string): string {
  return md5(input);
}

// ========== Bakong Payment Check ==========

async function checkPaymentByMD5(md5: string): Promise<{ paid: boolean; hash?: string; data?: any }> {
  const BAKONG_TOKEN = Deno.env.get('BAKONG_TOKEN')
  if (!BAKONG_TOKEN) {
    console.error('BAKONG_TOKEN not configured')
    return { paid: false }
  }

  try {
    const response = await fetch(CHECK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BAKONG_TOKEN}`,
      },
      body: JSON.stringify({ md5 }),
    })

    const result = await response.json()

    if (result.responseCode === 0 && result.data) {
      return {
        paid: true,
        hash: result.data.hash || `BK_${Date.now().toString(36).toUpperCase()}`,
        data: result.data,
      }
    }

    return { paid: false }
  } catch (err) {
    console.error('Bakong API check error:', err)
    return { paid: false }
  }
}

// ========== Telegram Notification ==========

async function sendTelegramNotification(
  type: 'new_order' | 'payment_confirmed' | 'payment_expired',
  order: any,
  txHash?: string,
): Promise<void> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY')

  if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY) {
    console.warn('Telegram keys not configured, skipping notification')
    return
  }

  // Get admin chat ID from order metadata or env
  const supabase = getSupabase()
  // Try to find chat_id - we'll use a hardcoded admin chat for now
  // In production, store this in a settings table
  const ADMIN_CHAT_ID = '5169380878'

  let message = ''
  const time = new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' })

  if (type === 'payment_confirmed') {
    message = [
      '💰 <b>ការបង់ប្រាក់ថ្មីពី Website!</b>',
      '━━━━━━━━━━━━━━━',
      `📋 Order: <code>${order.id}</code>`,
      `🎮 ហ្គេម: ${order.game_name}`,
      `📦 កញ្ចប់: ${order.package_name}`,
      `💵 ចំនួន: <b>$${Number(order.price).toFixed(2)}</b>`,
      `👤 អ្នកលេង: ${order.player_name || 'N/A'}`,
      txHash ? `🔗 TX: <code>${txHash}</code>` : '',
      `⏰ ${time}`,
      '━━━━━━━━━━━━━━━',
      '✅ <b>ស្ថានភាព: បង់រួចរាល់ (PAID)</b>',
    ].filter(Boolean).join('\n')
  } else if (type === 'new_order') {
    message = [
      '🛒 <b>ការបញ្ជាទិញថ្មី!</b>',
      '',
      `📋 Order: <code>${order.id}</code>`,
      `🎮 ហ្គេម: ${order.game_name}`,
      `📦 កញ្ចប់: ${order.package_name}`,
      `💵 ចំនួន: <b>$${Number(order.price).toFixed(2)}</b>`,
      `👤 អ្នកលេង: ${order.player_name || 'N/A'}`,
      `⏰ ${time}`,
      '',
      '⏳ កំពុងរង់ចាំការទូទាត់...',
    ].join('\n')
  } else if (type === 'payment_expired') {
    message = [
      '❌ <b>ការទូទាត់ផុតកំណត់</b>',
      '',
      `📋 Order: <code>${order.id}</code>`,
      `🎮 ហ្គេម: ${order.game_name}`,
      `💵 ចំនួន: $${Number(order.price).toFixed(2)}`,
      `⏰ ${time}`,
    ].join('\n')
  }

  try {
    await fetch(`${TELEGRAM_GATEWAY_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TELEGRAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    })
  } catch (err) {
    console.error('Telegram notification failed:', err)
  }
}

// ========== Main Handler ==========

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, amount, orderId, md5, createdAt } = await req.json()

    switch (action) {
      // ===== Create QR Code =====
      case 'create_qr': {
        if (!amount || !orderId) {
          return new Response(JSON.stringify({ error: 'Missing amount or orderId' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const khqrString = generateKHQRString(Number(amount), orderId)
        const qrMd5 = await generateMD5(khqrString)

        const supabase = getSupabase()
        await supabase.from('orders').update({ transaction_hash: `md5:${qrMd5}` }).eq('id', orderId)

        // Fetch order for Telegram notification
        const { data: orderData } = await supabase.from('orders').select('*').eq('id', orderId).single()
        if (orderData) {
          sendTelegramNotification('new_order', orderData)
        }

        return new Response(JSON.stringify({
          qr: khqrString,
          md5: qrMd5,
          merchant: RECEIVER_ACCOUNT,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // ===== Check Payment Status =====
      case 'check_payment': {
        if (!md5) {
          return new Response(JSON.stringify({ error: 'Missing md5' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Backend-side expiry check (5 minutes)
        if (createdAt) {
          const now = Math.floor(Date.now() / 1000)
          const created = Math.floor(new Date(createdAt).getTime() / 1000)
          if (now - created > EXPIRY_SECONDS) {
            // Mark as expired in DB
            if (orderId) {
              const supabase = getSupabase()
              const { data: orderData } = await supabase.from('orders').select('*').eq('id', orderId).single()
              if (orderData && orderData.status === 'pending') {
                await supabase.from('orders').update({ status: 'expired' }).eq('id', orderId)
                sendTelegramNotification('payment_expired', orderData)
              }
            }
            return new Response(JSON.stringify({ paid: false, expired: true, message: 'QR Code ផុតកំណត់ហើយ' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }
        }

        // Check with Bakong API
        const result = await checkPaymentByMD5(md5)

        if (result.paid && orderId) {
          const supabase = getSupabase()
          const txHash = result.hash || `BK_${Date.now().toString(36).toUpperCase()}`

          await supabase.from('orders').update({
            status: 'completed',
            transaction_hash: txHash,
          }).eq('id', orderId)

          // Send Telegram notification for successful payment
          const { data: orderData } = await supabase.from('orders').select('*').eq('id', orderId).single()
          if (orderData) {
            sendTelegramNotification('payment_confirmed', orderData, txHash)
          }
        }

        return new Response(JSON.stringify({
          paid: result.paid,
          hash: result.hash,
          data: result.data,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
  } catch (err) {
    console.error('bakong-payment error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
