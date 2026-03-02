/**
 * Verify 2025 rookie class IDs in DB against Sleeper registry.
 *   npx tsx scripts/verify-2025-class.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

console.log('Fetching Sleeper registry...');
const res = await fetch('https://api.sleeper.app/v1/players/nfl');
const players: Record<string, any> = await res.json();

// Correct IDs from find-2025-rookies.ts
const CORRECT_IDS: Record<string, { name: string; pos: string; team: string }> = {
  '12522': { name: 'Cam Ward',          pos: 'QB', team: 'TEN' },
  '12524': { name: 'Shedeur Sanders',   pos: 'QB', team: 'CLE' },
  '12486': { name: 'Dillon Gabriel',    pos: 'QB', team: 'CLE' },
  '12545': { name: 'Tyler Shough',      pos: 'QB', team: 'NO'  },
  '12508': { name: 'Jaxson Dart',       pos: 'QB', team: 'NYG' },
  '12527': { name: 'Ashton Jeanty',     pos: 'RB', team: 'LV'  },
  '12507': { name: 'Omarion Hampton',   pos: 'RB', team: 'LAC' },
  '12481': { name: 'Cam Skattebo',      pos: 'RB', team: 'NYG' },
  '12512': { name: 'Quinshon Judkins',  pos: 'RB', team: 'CLE' },
  '12489': { name: 'RJ Harvey',         pos: 'RB', team: 'DEN' },
  '12529': { name: 'TreVeyon Henderson',pos: 'RB', team: 'NE'  },
  '12469': { name: 'Dylan Sampson',     pos: 'RB', team: 'TEN' },
  '12490': { name: 'Bhayshul Tuten',    pos: 'RB', team: 'JAX' },
  '12462': { name: 'Damien Martinez',   pos: 'RB', team: 'GB'  },
  '12526': { name: 'Tetairoa McMillan', pos: 'WR', team: 'CAR' },
  '12514': { name: 'Emeka Egbuka',      pos: 'WR', team: 'TB'  },
  '12519': { name: 'Luther Burden III', pos: 'WR', team: 'CHI' },
  '12501': { name: 'Matthew Golden',    pos: 'WR', team: 'GB'  },
  '12484': { name: 'Jayden Higgins',    pos: 'WR', team: 'HOU' },
  '12536': { name: 'Jaylin Noel',       pos: 'WR', team: 'HOU' },
  '12485': { name: 'Tez Johnson',       pos: 'WR', team: 'DET' },
  '12482': { name: 'Savion Williams',   pos: 'WR', team: 'GB'  },
  '12518': { name: 'Tyler Warren',      pos: 'TE', team: 'IND' },
  '12517': { name: 'Colston Loveland',  pos: 'TE', team: 'CHI' },
  '12498': { name: 'Mason Taylor',      pos: 'TE', team: 'NYJ' },
  '12506': { name: 'Harold Fannin Jr.', pos: 'TE', team: 'CLE' },
  '12521': { name: 'Elijah Arroyo',     pos: 'TE', team: 'SEA' },
};

// Also check by name for existing DB rows
const names = Object.values(CORRECT_IDS).map(v => v.name);

console.log('\n=== DB lookup by name ===');
const { data: dbRows } = await supabase
  .from('player_values_canonical')
  .select('player_id, player_name, position, team, adjusted_value')
  .eq('format', 'dynasty')
  .order('adjusted_value', { ascending: false });

const dbByName: Record<string, any[]> = {};
for (const row of dbRows || []) {
  const key = (row.player_name || '').toLowerCase();
  if (!dbByName[key]) dbByName[key] = [];
  dbByName[key].push(row);
}

const correctIds = new Set(Object.keys(CORRECT_IDS));

for (const [correctId, info] of Object.entries(CORRECT_IDS)) {
  const nameKey = info.name.toLowerCase();
  const dbMatches = dbByName[nameKey] || [];
  const hasCorrectId = dbMatches.some(r => r.player_id === correctId);
  const wrongRows = dbMatches.filter(r => r.player_id !== correctId);

  if (hasCorrectId) {
    const row = dbMatches.find(r => r.player_id === correctId)!;
    console.log(`  OK     ${info.name.padEnd(28)} ${correctId.padEnd(8)} val=${row.adjusted_value}`);
  } else if (wrongRows.length > 0) {
    console.log(`  WRONG_ID ${info.name.padEnd(26)} DB:${wrongRows.map(r => r.player_id).join(',')} → correct:${correctId}`);
  } else {
    console.log(`  MISSING ${info.name.padEnd(26)} correct:${correctId} ${info.pos} ${info.team}`);
  }
}
