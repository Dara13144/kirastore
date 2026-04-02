const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts'
import { encodeHex } from 'https://deno.land/std@0.224.0/encoding/hex.ts'

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

// ========== MD5 Hash ==========

async function generateMD5(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const hashBuffer = await crypto.subtle.digest('MD5', data)
  return encodeHex(new Uint8Array(hashBuffer))
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
