import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const SLEEPER_BASE_URL = 'https://api.sleeper.app/v1';

let sleeperPlayersCache: Record<string, any> | null = null;
let sleeperPlayersCacheTime = 0;
const SLEEPER_CACHE_TTL = 30 * 60 * 1000;

async function getSleeperPlayers(): Promise<Record<string, any>> {
  const now = Date.now();
  if (sleeperPlayersCache && now - sleeperPlayersCacheTime < SLEEPER_CACHE_TTL) {
    return sleeperPlayersCache;
  }
  try {
    const res = await fetch(`${SLEEPER_BASE_URL}/players/nfl`);
    if (!res.ok) return sleeperPlayersCache || {};
    const data = await res.json();
    sleeperPlayersCache = data;
    sleeperPlayersCacheTime = now;
    return data;
  } catch {
    return sleeperPlayersCache || {};
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const leagueId = url.searchParams.get('league_id');

    if (!leagueId) {
      return new Response(
        JSON.stringify({ ok: false, error: 'league_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const [rostersRes, usersRes] = await Promise.all([
      fetch(`${SLEEPER_BASE_URL}/league/${leagueId}/rosters`),
      fetch(`${SLEEPER_BASE_URL}/league/${leagueId}/users`),
    ]);

    if (!rostersRes.ok || !usersRes.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to fetch league data from Sleeper' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rosters = await rostersRes.json();
    const users = await usersRes.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Sleeper roster player IDs are Sleeper IDs; latest_player_values uses DB/KTC IDs.
    // They don't match, so we load all dynasty players and look up by normalized name instead.
    const [dbResult, sleeperPlayers] = await Promise.all([
      supabase
        .from('latest_player_values')
        .select('player_id, player_name, position, team, adjusted_value')
        .eq('format', 'dynasty')
        .in('position', ['QB', 'RB', 'WR', 'TE', 'LB', 'DL', 'DB'])
        .limit(1500),
      getSleeperPlayers(),
    ]);

    // Build a normalized name → DB record map for matching
    function normalizeName(name: string): string {
      return name.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
    }

    const nameToDbPlayer = new Map<string, any>();
    for (const p of dbResult.data || []) {
      if (p.player_name) {
        nameToDbPlayer.set(normalizeName(p.player_name), p);
      }
    }

    const userMap = new Map(users.map((u: any) => [u.user_id, u]));

    const enrichedRosters = rosters.map((roster: any) => {
      const owner = userMap.get(roster.owner_id);
      const players = (roster.players || []).map((playerId: string) => {
        const sleeperPlayer = sleeperPlayers[playerId];
        const liveTeam = sleeperPlayer?.team || null;

        const fullName = sleeperPlayer
          ? (sleeperPlayer.full_name || `${sleeperPlayer.first_name || ''} ${sleeperPlayer.last_name || ''}`.trim())
          : '';

        // Look up by normalized name since Sleeper IDs ≠ DB/KTC IDs in latest_player_values
        const dbPlayer = fullName ? nameToDbPlayer.get(normalizeName(fullName)) : undefined;

        if (dbPlayer) {
          return {
            player_id: playerId,
            name: dbPlayer.player_name,
            position: dbPlayer.position,
            team: liveTeam ?? dbPlayer.team ?? null,
            fdp_value: dbPlayer.adjusted_value || 0,
            is_starter: (roster.starters || []).includes(playerId),
            headshot_url: `https://sleepercdn.com/content/nfl/players/thumb/${playerId}.jpg`,
          };
        }

        if (sleeperPlayer) {
          return {
            player_id: playerId,
            name: fullName || playerId,
            position: sleeperPlayer.position || 'N/A',
            team: liveTeam,
            fdp_value: 0,
            is_starter: (roster.starters || []).includes(playerId),
            headshot_url: `https://sleepercdn.com/content/nfl/players/thumb/${playerId}.jpg`,
          };
        }

        return {
          player_id: playerId,
          name: 'Unknown Player',
          position: 'N/A',
          team: null,
          fdp_value: 0,
          is_starter: (roster.starters || []).includes(playerId),
          headshot_url: `https://sleepercdn.com/content/nfl/players/thumb/${playerId}.jpg`,
        };
      });

      const totalValue = players.reduce((sum: number, p: any) => sum + p.fdp_value, 0);

      return {
        roster_id: roster.roster_id,
        team_name: `Team ${roster.roster_id}`,
        owner_name: owner?.metadata?.team_name || owner?.display_name || owner?.username || 'Unknown',
        owner_id: roster.owner_id,
        players,
        total_value: Math.round(totalValue),
        record: {
          wins: roster.settings?.wins || 0,
          losses: roster.settings?.losses || 0,
          ties: roster.settings?.ties || 0,
        },
      };
    });

    return new Response(
      JSON.stringify({ ok: true, league_id: leagueId, rosters: enrichedRosters }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in league-rosters function:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
