import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 1. Validation Schema
const RequestSchema = z.object({
  action: z.string().optional(), // Added to match your frontend 'check_id' action
  gameId: z.string().min(1),
  userId: z.string().min(1),
  zoneId: z.string().optional(),
})

// 2. Configuration (RapidAPI)
const RAPIDAPI_KEY = "72a4fab20amsh9639b73f00486a2p14d42cjsn8ab8ac19c88a"
const RAPIDAPI_HOST = "id-game-checker.p.rapidapi.com"
const RAPIDAPI_URL = "https://id-game-checker.p.rapidapi.com/check"

/**
 * Normalizes game slugs to match what the API expects
 */
function getGameProvider(gameId: string): string {
  const id = gameId.toLowerCase();
  if (id.includes('mlbb') || id.includes('mobile-legends')) return 'mobilelegends'
  if (id.includes('ff') || id.includes('freefire')) return 'freefire'
  if (id.includes('hok') || id.includes('honor')) return 'honorofkings'
  if (id.includes('pubg')) return 'pubgm'
  if (id.includes('genshin')) return 'genshinimpact'
  return id
}

/**
 * Core Logic: Hits the external API to verify User ID
 */
async function verifyGameId(gameId: string, userId: string, zoneId?: string) {
  const provider = getGameProvider(gameId)
  
  const url = new URL(RAPIDAPI_URL)
  url.searchParams.append('game', provider)
  url.searchParams.append('id', userId)
  if (zoneId) url.searchParams.append('zoneId', zoneId)

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    })

    if (!response.ok) {
      console.error(`API Error: ${response.status}`)
      return null
    }

    const data = await response.json()

    // Most APIs return nickname, name, or username. We normalize it for your frontend.
    if (data && (data.nickname || data.name || data.username)) {
      return {
        found: true,
        username: data.nickname || data.name || data.username,
        level: data.level || null,
        region: data.region || data.server || 'Global',
      }
    }

    return { found: false }
  } catch (error) {
    console.error("External API connection failed:", error)
    return null 
  }
}

/**
 * Deno Serve Handler
 */
serve(async (req) => {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const parsed = RequestSchema.safeParse(body)

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid Input Parameters' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const { gameId, userId, zoneId } = parsed.data
    
    // Call the verification service
    const result = await verifyGameId(gameId, userId, zoneId)

    // Fallback logic: If external API is down or user not found
    if (!result) {
      return new Response(JSON.stringify({ 
        found: false, 
        message: 'System busy or ID not found. Please check manually.' 
      }), { 
        status: 200, // Return 200 so the frontend can handle the "not found" message
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Return the successful check
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
