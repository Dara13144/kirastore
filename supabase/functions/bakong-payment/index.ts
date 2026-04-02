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

function getSupabase() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
}

// Generate KHQR QR string (EMV QR Code format)
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

// MD5 hash using Deno's std library (crypto.subtle doesn't support MD5)
async function generateMD5(input: string): Promise<string> {
  const { crypto: denoCrypto } = await import('https://deno.land/std@0.224.0/crypto/mod.ts')
  const data = new TextEncoder().encode(input)
  const hashBuffer = await denoCrypto.subtle.digest('MD5', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Check payment status via Bakong API
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, amount, orderId, md5 } = await req.json()

    switch (action) {
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

        return new Response(JSON.stringify({
          qr: khqrString,
          md5: qrMd5,
          merchant: RECEIVER_ACCOUNT,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'check_payment': {
        if (!md5) {
          return new Response(JSON.stringify({ error: 'Missing md5' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const result = await checkPaymentByMD5(md5)

        if (result.paid && orderId) {
          const supabase = getSupabase()
          await supabase.from('orders').update({
            status: 'completed',
            transaction_hash: result.hash || `BK_${Date.now().toString(36)}`,
          }).eq('id', orderId)
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
