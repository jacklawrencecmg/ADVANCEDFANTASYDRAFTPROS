/**
 * Direct KTC/FDP value sync — run with:
 *   npx tsx scripts/sync-values.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Value fetch & normalize ────────────────────────────────────────────────

interface RawPlayer {
  sleeperId: string;
  value: string;
  position: string;
  player: string;
  team: string;
}

interface Normalized {
  value: number;
  position: string;
  name: string;
  team: string;
}

function normalize(raw: number, min: number, max: number): number {
  if (max === min) return 5000;
  return Math.max(0, Math.min(10000, ((raw - min) / (max - min)) * 10000));
}

async function fetchValues(isSuperflex: boolean): Promise<Record<string, Normalized>> {
  const fmt = isSuperflex ? '2' : '1';
  const yr = new Date().getMonth() >= 8 ? new Date().getFullYear() + 1 : new Date().getFullYear();

  const sources = [
    `https://api.fantasydraftprospects.com/api/values/${yr}?format=${fmt}`,
    `https://api.keeptradecut.com/bff/dynasty/players?format=${fmt}`,
  ];

  for (const url of sources) {
    try {
      console.log(`  Trying: ${url}`);
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) { console.log(`  → HTTP ${res.status}, skipping`); continue; }

      const data: RawPlayer[] = await res.json();
      const raws: Array<{ id: string; value: number; position: string; name: string; team: string }> = [];

      for (const p of data) {
        if (!p.sleeperId || !p.value) continue;
        const v = parseInt(p.value, 10);
        if (v > 0) raws.push({ id: p.sleeperId, value: v, position: p.position, name: p.player, team: p.team ?? '' });
      }

      if (raws.length === 0) { console.log('  → 0 valid players, skipping'); continue; }

      const min = Math.min(...raws.map(r => r.value));
      const max = Math.max(...raws.map(r => r.value));
      console.log(`  → ${raws.length} players, raw range ${min}–${max}`);

      const out: Record<string, Normalized> = {};
      for (const r of raws) {
        out[r.id] = { value: normalize(r.value, min, max), position: r.position, name: r.name, team: r.team };
      }
      return out;
    } catch (e) {
      console.log(`  → Error: ${(e as Error).message}`);
    }
  }
  return {};
}

// ─── Adjustment logic (mirrors syncPlayerValues.ts) ─────────────────────────

const KNOWN_BACKUPS = new Set([
  'joe milton', 'trey lance', 'sam howell', 'tyler huntley', 'jake browning',
  'easton stick', 'cooper rush', 'taylor heinicke', 'jarrett stidham',
  'mitch trubisky', 'tyson bagent', 'joshua dobbs', 'clayton tune', 'davis mills',
  'aidan oconnell', 'stetson bennett', 'dorian thompson-robinson', 'malik willis',
]);

function adjust(baseVal: number, player: any, pos: string, rawVal: number, allQbRaw: number[]) {
  let v = baseVal;

  if (pos === 'QB') {
    const topQB = Math.max(...allQbRaw, 1);
    const rel = rawVal / topQB;
    const nameL = (player.full_name || '').toLowerCase();
    const isBackup = [...KNOWN_BACKUPS].some(n => nameL.includes(n));
    if (isBackup || rel < 0.05)      v *= 0.02;
    else if (rel < 0.10)             v *= 0.05;
    else if (rel < 0.20)             v *= 0.15;
    else if (rawVal < (allQbRaw[Math.floor(allQbRaw.length / 2)] || 1) * 0.30) v *= 0.25;
  }

  // Rookie penalty (non-QB, not elite)
  if ((player.years_exp ?? 0) === 0 && pos !== 'QB' && rawVal / (baseVal || 1) < 0.20) {
    v *= 0.85;
  }

  // Injury
  const injMult: Record<string, number> = { Out: 0.70, Doubtful: 0.85, Questionable: 0.95, IR: 0.50, PUP: 0.60, COV: 0.40, Sus: 0.30 };
  if (player.injury_status && injMult[player.injury_status]) v *= injMult[player.injury_status];

  if (player.status === 'Retired') v *= 0.10;

  const age = player.age ?? 0;
  if (age > 0) {
    if (pos === 'RB') {
      if (age >= 30) v *= 0.75; else if (age >= 28) v *= 0.85; else if (age <= 23) v *= 1.10;
    } else if (pos === 'WR') {
      if (age >= 32) v *= 0.80; else if (age >= 30) v *= 0.90; else if (age <= 24) v *= 1.05;
    } else if (pos === 'TE') {
      if (age >= 32) v *= 0.85; else if (age <= 24) v *= 1.05;
    } else if (pos === 'QB') {
      if (age >= 38) v *= 0.80; else if (age >= 35) v *= 0.90; else if (age >= 27 && age <= 32) v *= 1.05;
    }
  }

  return Math.max(0, v);
}

// ─── Main ────────────────────────────────────────────────────────────────────

const SPOT_CHECK = [
  'Patrick Mahomes', 'Joe Burrow', 'Josh Allen', 'Jalen Hurts', 'Drake Maye',
  'Cam Ward', 'Jared Goff', 'Baker Mayfield', 'Sam Darnold',
  'Justin Jefferson', 'CeeDee Lamb', 'Ja\'Marr Chase',
  'AJ Brown', 'Davante Adams', 'Tee Higgins', 'Brian Thomas',
  'Tetairoa McMillan', 'Emeka Egbuka', 'Keon Coleman',
  'Christian McCaffrey', 'Bijan Robinson', 'De\'Von Achane',
  'James Cook', 'Chase Brown', 'Quinshon Judkins', 'RJ Harvey', 'Cam Skattebo',
  'Travis Etienne', 'Christian Watson', 'Courtland Sutton', 'Terry McLaurin',
  'George Kittle', 'Sam LaPorta', 'Kyle Pitts', 'Tyler Warren', 'Colston Loveland',
  'Tucker Kraft', 'Dalton Kincaid',
];

async function main() {
  console.log('=== Direct KTC/FDP Value Sync ===\n');

  // 1. Fetch Sleeper players
  console.log('1) Fetching Sleeper player registry...');
  const sleeperRes = await fetch('https://api.sleeper.app/v1/players/nfl');
  if (!sleeperRes.ok) throw new Error('Failed to fetch Sleeper players');
  const sleeperPlayers: Record<string, any> = await sleeperRes.json();
  console.log(`   ${Object.keys(sleeperPlayers).length} players loaded\n`);

  // 2. Fetch dynasty SF values (broadest; calcFdpValue applies format multipliers on the fly)
  console.log('2) Fetching dynasty SF values...');
  const fdpValues = await fetchValues(true);
  if (Object.keys(fdpValues).length === 0) {
    console.error('   ERROR: No values returned from any source. Aborting.');
    process.exit(1);
  }
  console.log(`   ${Object.keys(fdpValues).length} player values fetched\n`);

  // 3. Build player value rows
  console.log('3) Building value rows...');
  const posGroups: Record<string, any[]> = { QB: [], RB: [], WR: [], TE: [] };
  const qbRaw: number[] = [];

  for (const [pid, pd] of Object.entries(sleeperPlayers)) {
    if (pd.position === 'QB' && fdpValues[pid]?.value > 0) qbRaw.push(fdpValues[pid].value);
  }

  for (const [pid, pd] of Object.entries(sleeperPlayers)) {
    if (!pd.position || !['QB', 'RB', 'WR', 'TE'].includes(pd.position)) continue;
    const fdp = fdpValues[pid];
    if (!fdp || fdp.value === 0) continue;

    const adjVal = adjust(fdp.value, pd, pd.position, fdp.value, qbRaw);
    posGroups[pd.position].push({
      player_id: pid,
      player_name: pd.full_name || `${pd.first_name} ${pd.last_name}`,
      position: pd.position,
      team: pd.team || null,
      format: 'dynasty',
      base_value: Math.round(adjVal * 0.95),
      adjusted_value: Math.round(adjVal),
      market_value: Math.round(adjVal),
      source: 'fantasy_draft_pros',
      updated_at: new Date().toISOString(),
    });
  }

  // Position multipliers + tier bonuses
  const posMult: Record<string, number> = { QB: 1.0, RB: 1.0, WR: 0.95, TE: 0.85 };
  const allRows: any[] = [];

  for (const [pos, group] of Object.entries(posGroups)) {
    group.sort((a, b) => b.adjusted_value - a.adjusted_value);
    const mult = posMult[pos] ?? 1.0;
    group.forEach((p, i) => {
      const tier = i < 5 ? 1.15 : i < 12 ? 1.10 : i < 24 ? 1.05 : 1.0;
      p.adjusted_value = Math.round(p.adjusted_value * mult * tier);
      p.market_value   = p.adjusted_value;
      p.base_value     = Math.round(p.adjusted_value * 0.95);
      p.rank_position  = i + 1;
      allRows.push(p);
    });
  }

  allRows.sort((a, b) => b.adjusted_value - a.adjusted_value);
  allRows.forEach((p, i) => { p.rank_overall = i + 1; });

  console.log(`   ${allRows.length} rows ready\n`);

  // 4. Spot-check values BEFORE writing
  console.log('4) Spot-check values (pre-write):');
  const nameMap: Record<string, any> = {};
  for (const r of allRows) nameMap[r.player_name?.toLowerCase() ?? ''] = r;

  for (const name of SPOT_CHECK) {
    // fuzzy match
    const key = name.toLowerCase();
    const match = Object.entries(nameMap).find(([k]) => k.includes(key.split(' ')[1] ?? key) && k.includes(key.split(' ')[0] ?? ''));
    if (match) {
      const r = match[1];
      console.log(`   ${r.player_name.padEnd(28)} ${r.position}  val=${r.adjusted_value.toString().padStart(5)}  rank=#${r.rank_overall}`);
    } else {
      console.log(`   ${name.padEnd(28)} *** NOT FOUND ***`);
    }
  }
  console.log('');

  // 5. Write to Supabase
  console.log('5) Writing to Supabase...');
  const BATCH = 200;
  let written = 0;
  for (let i = 0; i < allRows.length; i += BATCH) {
    const batch = allRows.slice(i, i + BATCH);
    const { error } = await supabase
      .from('player_values_canonical')
      .upsert(batch, { onConflict: 'player_id' });
    if (error) {
      console.error(`   Batch ${i}–${i + BATCH} error:`, error.message);
    } else {
      written += batch.length;
      process.stdout.write(`\r   Written: ${written}/${allRows.length}`);
    }
  }
  console.log('\n   Done!\n');

  // 6. Verify a few values from DB
  console.log('6) Verifying from DB (post-write spot check):');
  const { data: dbRows } = await supabase
    .from('player_values_canonical')
    .select('player_name, position, adjusted_value, rank_overall')
    .eq('format', 'dynasty')
    .order('adjusted_value', { ascending: false })
    .limit(30);

  if (dbRows) {
    console.log('\n   Top 30 in DB:');
    dbRows.forEach((r: any) => {
      console.log(`   #${String(r.rank_overall ?? '?').padStart(3)}  ${(r.player_name ?? '').padEnd(28)} ${r.position}  ${r.adjusted_value}`);
    });
  }

  console.log('\n=== Sync complete ===');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
