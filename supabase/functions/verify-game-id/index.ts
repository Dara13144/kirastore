import { corsHeaders } from '@supabase/supabase-js/cors'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const RequestSchema = z.object({
  gameId: z.string().min(1).max(50),
  userId: z.string().min(1).max(50),
  zoneId: z.string().max(20).optional(),
})

// Mock database - used as fallback when no external API is configured
const MOCK_USERS: Record<string, Record<string, { username: string; zoneId?: string; level?: number; server?: string }>> = {
  'mlbb-kh': {
    '58647857': { username: 'ShadowHunter', zoneId: '56744', level: 45, server: 'Cambodia-1' },
    '12345678': { username: 'DragonKing', zoneId: '12001', level: 67, server: 'Cambodia-2' },
    '99887766': { username: 'MageMaster', zoneId: '56744', level: 32, server: 'Cambodia-1' },
    '11223344': { username: 'WarriorQueen', zoneId: '23456', level: 55, server: 'Cambodia-3' },
    '55667788': { username: 'NinjaStrike', zoneId: '56744', level: 78, server: 'Cambodia-1' },
  },
  'mlbb-ph': {
    '10001001': { username: 'PhilGamer', zoneId: '30001', level: 40, server: 'Philippines-1' },
    '10001002': { username: 'ManilaKing', zoneId: '30002', level: 52, server: 'Philippines-2' },
  },
  'mlbb-id': {
    '20001001': { username: 'IndoHero', zoneId: '40001', level: 60, server: 'Indonesia-1' },
    '20001002': { username: 'JakartaWarrior', zoneId: '40002', level: 38, server: 'Indonesia-2' },
  },
  'ff-kh': {
    '1234567890': { username: 'FireKhmer', level: 55, server: 'Garena-KH' },
    '9876543210': { username: 'BattleRoyal', level: 42, server: 'Garena-KH' },
    '1111222233': { username: 'StealthNinja', level: 30, server: 'Garena-KH' },
  },
  'ff-id': {
    '3000100100': { username: 'IndoFire', level: 48, server: 'Garena-ID' },
  },
  'ff-vn': {
    '4000100100': { username: 'VietFighter', level: 35, server: 'Garena-VN' },
  },
  'ff-tw': {
    '5000100100': { username: 'TaiwanFlame', level: 29, server: 'Garena-TW' },
  },
  'magic-chess': {
    '6000100100': { username: 'ChessMaster', level: 20, server: 'Global' },
  },
}

// Determine which external API to call based on game type
function getGameApiConfig(gameId: string) {
  const GAME_VERIFY_API_KEY = Deno.env.get('GAME_VERIFY_API_KEY')
  const GAME_VERIFY_API_URL = Deno.env.get('GAME_VERIFY_API_URL')

  if (!GAME_VERIFY_API_KEY || !GAME_VERIFY_API_URL) {
    return null // No external API configured, use mock
  }

  // MLBB games
  if (gameId.startsWith('mlbb')) {
    return {
      url: `${GAME_VERIFY_API_URL}/mlbb/verify`,
      apiKey: GAME_VERIFY_API_KEY,
      platform: 'mlbb',
    }
  }

  // Free Fire games
  if (gameId.startsWith('ff')) {
    return {
      url: `${GAME_VERIFY_API_URL}/freefire/verify`,
      apiKey: GAME_VERIFY_API_KEY,
      platform: 'freefire',
    }
  }

  return {
    url: `${GAME_VERIFY_API_URL}/generic/verify`,
    apiKey: GAME_VERIFY_API_KEY,
    platform: 'generic',
  }
}

async function verifyViaExternalApi(
  apiConfig: { url: string; apiKey: string; platform: string },
  userId: string,
  zoneId?: string,
): Promise<{ found: boolean; username: string; level?: number; server?: string; zoneMatch?: boolean }> {
  const body: Record<string, string> = { userId }
  if (zoneId) body.zoneId = zoneId

  const response = await fetch(apiConfig.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiConfig.apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    console.error(`External API error [${response.status}]: ${text}`)
    throw new Error(`External API returned ${response.status}`)
  }

  const data = await response.json()
  return {
    found: !!data.username || !!data.name,
    username: data.username || data.name || '',
    level: data.level,
    server: data.server || data.region,
    zoneMatch: zoneId ? (data.zoneId === zoneId || data.zone_id === zoneId) : true,
  }
}

function verifyViaMock(
  gameId: string,
  userId: string,
  zoneId?: string,
): { found: boolean; username: string; level?: number; server?: string; zoneMatch?: boolean; source: string } {
  const db = MOCK_USERS[gameId]
  if (!db) return { found: false, username: '', source: 'mock' }

  const user = db[userId]
  if (!user) return { found: false, username: '', source: 'mock' }

  const zoneMatch = user.zoneId ? (zoneId === user.zoneId) : true
  return {
    found: true,
    username: user.username,
    level: user.level,
    server: user.server,
    zoneMatch,
    source: 'mock',
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const rawBody = await req.json()
    const parsed = RequestSchema.safeParse(rawBody)

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { gameId, userId, zoneId } = parsed.data
    const apiConfig = getGameApiConfig(gameId)

    let result: { found: boolean; username: string; level?: number; server?: string; zoneMatch?: boolean; source?: string }

    if (apiConfig) {
      try {
        const apiResult = await verifyViaExternalApi(apiConfig, userId, zoneId)
        result = { ...apiResult, source: 'api' }
      } catch (err) {
        console.warn('External API failed, falling back to mock:', err)
        result = verifyViaMock(gameId, userId, zoneId)
      }
    } else {
      result = verifyViaMock(gameId, userId, zoneId)
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('verify-game-id error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
