const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const RequestSchema = z.object({
  gameId: z.string().min(1).max(50),
  userId: z.string().min(1).max(50),
  zoneId: z.string().max(20).optional(),
})

const RAPIDAPI_URL = 'https://id-game-checker.p.rapidapi.com/check'

// Mock database - fallback when API fails
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

// Determine game type for RapidAPI
function getGameType(gameId: string): string {
  if (gameId.startsWith('mlbb')) return 'mlbb'
  if (gameId.startsWith('ff')) return 'ff'
  if (gameId === 'magic-chess') return 'mlbb'
  if (gameId === 'hok') return 'hok'
  return 'mlbb'
}

// Verify via RapidAPI id-game-checker
async function verifyViaRapidAPI(
  gameId: string,
  userId: string,
  zoneId?: string,
): Promise<{ found: boolean; username: string; level?: number; server?: string; zoneMatch?: boolean }> {
  const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY')
  if (!RAPIDAPI_KEY) throw new Error('RAPIDAPI_KEY not configured')

  const gameType = getGameType(gameId)
  
  const params = new URLSearchParams({
    game: gameType,
    id: userId,
  })
  
  // Add zoneId for MLBB
  if (gameType === 'mlbb' && zoneId) {
    params.set('zoneId', zoneId)
  }

  // Set region based on game variant
  if (gameId.includes('-kh') || gameId.includes('-vn') || gameId.includes('-tw')) {
    params.set('region', 'sg')
  } else if (gameId.includes('-id')) {
    params.set('region', 'id')
  } else if (gameId.includes('-ph')) {
    params.set('region', 'ph')
  }

  const response = await fetch(`${RAPIDAPI_URL}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'id-game-checker.p.rapidapi.com',
    },
  })

  if (!response.ok) {
    const text = await response.text()
    console.error(`RapidAPI error [${response.status}]: ${text}`)
    throw new Error(`RapidAPI returned ${response.status}`)
  }

  const data = await response.json()
  
  return {
    found: !!(data.nickname || data.name || data.username),
    username: data.nickname || data.name || data.username || '',
    level: data.level,
    server: data.server || data.region,
    zoneMatch: zoneId ? true : true,
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
  return { found: true, username: user.username, level: user.level, server: user.server, zoneMatch, source: 'mock' }
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
    let result: { found: boolean; username: string; level?: number; server?: string; zoneMatch?: boolean; source?: string }

    // Try RapidAPI first, fall back to mock
    try {
      const apiResult = await verifyViaRapidAPI(gameId, userId, zoneId)
      result = { ...apiResult, source: 'api' }
    } catch (err) {
      console.warn('RapidAPI failed, falling back to mock:', err)
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
