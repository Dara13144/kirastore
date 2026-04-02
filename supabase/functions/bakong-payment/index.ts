const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const BAKONG_TOKEN = Deno.env.get('BAKONG_TOKEN')!
const RECEIVER_ACCOUNT = 'nyx_shop@bkjr'
const MERCHANT_NAME = 'KiraStore'
const CHECK_API_URL = 'https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5'

function getSupabase() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
}

// Generate KHQR QR string manually (EMV QR Code format)
function generateKHQRString(amount: number, billNumber: string): string {
  const tags: [string, string][] = [
    ['00', '01'],                          // Payload Format Indicator
    ['01', '12'],                          // Point of Initiation (dynamic)
    ['29', buildMerchantAccount()],         // Merchant Account (tag 29 for Bakong)
    ['52', '5999'],                         // Merchant Category Code
    ['53', '840'],                          // Transaction Currency (USD)
    ['54', amount.toFixed(2)],              // Transaction Amount
    ['58', 'KH'],                           // Country Code
    ['59', MERCHANT_NAME],                  // Merchant Name
    ['60', 'Phnom Penh'],                   // Merchant City
    ['62', buildAdditionalData(billNumber)], // Additional Data
  ]

  let payload = ''
  for (const [id, value] of tags) {
    payload += id + String(value.length).padStart(2, '0') + value
  }

  // Add CRC placeholder
  payload += '6304'
  const crc = computeCRC16(payload)
  return payload + crc
}

function buildMerchantAccount(): string {
  const bakongId = RECEIVER_ACCOUNT
  const acqBank = 'JTR'
  let sub = ''
  sub += '00' + String('bakong'.length).padStart(2, '0') + 'bakong'
  sub += '01' + String(bakongId.length).padStart(2, '0') + bakongId
  sub += '02' + String(acqBank.length).padStart(2, '0') + acqBank
  return sub
}

function buildAdditionalData(billNumber: string): string {
  let sub = ''
  sub += '01' + String(billNumber.length).padStart(2, '0') + billNumber
  return sub
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

// Generate MD5 hash of the QR string
async function generateMD5(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('MD5', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Check payment status via Bakong API
async function checkPaymentByMD5(md5: string): Promise<{ paid: boolean; hash?: string; data?: any }> {
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
    
    // responseCode 0 = success/paid, 1 = not found/pending
    if (result.responseCode === 0 && result.data) {
      return {
        paid: true,
        hash: result.data.hash || result.data.txHash || `BK_${Date.now().toString(36).toUpperCase()}`,
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

        // Store MD5 in the order record
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

        // If paid, update order status
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
