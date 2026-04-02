const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const ADMIN_EMAIL = 'iqbalahmed88600@gmail.com'
const ADMIN_PASS = 'kira2024'

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
}

function verifyAdmin(req: Request): boolean {
  const authHeader = req.headers.get('x-admin-auth')
  if (!authHeader) return false
  try {
    const decoded = atob(authHeader)
    const [email, pass] = decoded.split(':')
    return email === ADMIN_EMAIL && pass === ADMIN_PASS
  } catch {
    return false
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!verifyAdmin(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = getSupabaseAdmin()

  try {
    const body = req.method !== 'GET' ? await req.json() : null
    const action = body?.action || new URL(req.url).searchParams.get('action')

    switch (action) {
      // ===== GAMES =====
      case 'update_game': {
        const { id, action: _a, ...fields } = body
        const { error } = await supabase.from('games').update(fields).eq('id', id)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // ===== PACKAGES =====
      case 'update_package': {
        const { id, action: _a, ...fields } = body
        const { error } = await supabase.from('game_packages').update(fields).eq('id', id)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'add_package': {
        const { error } = await supabase.from('game_packages').insert(body)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'delete_package': {
        const { id } = body
        const { error } = await supabase.from('game_packages').delete().eq('id', id)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'toggle_all_packages': {
        const { game_id, disabled } = body
        const { error } = await supabase.from('game_packages').update({ disabled }).eq('game_id', game_id)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // ===== ORDERS =====
      case 'update_order_status': {
        const { id, status, transaction_hash } = body
        const updates: Record<string, unknown> = { status }
        if (transaction_hash) updates.transaction_hash = transaction_hash
        const { error } = await supabase.from('orders').update(updates).eq('id', id)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'get_orders': {
        const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
        if (error) throw error
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'reset_products': {
        // This is handled by re-running seed - for now just return success
        return new Response(JSON.stringify({ success: true, message: 'Use migration to reset' }), {
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
    console.error('admin-products error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
