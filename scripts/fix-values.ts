/**
 * Targeted value fix: insert missing players + correct stale values.
 *   npx tsx scripts/fix-values.ts
 *
 * Values are calibrated to match the existing DB scale:
 *   Top WR (Chase) = 9800,  Top QB (Lamar) = 9200,  Top RB (Bijan) = 8500
 *   Mid-starter range ≈ 5000–7000,  Fringe starter ≈ 3000–4500
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

// ─── Target corrections + additions ─────────────────────────────────────────
// Format: { name, sleeperId (null = look up), position, adj_value, reason }
// adj_value is the target dynasty value on the 0-10000 DB scale

const FIXES: Array<{
  name: string;
  sleeperId: string | null;  // null = search Sleeper by name
  position: 'QB' | 'RB' | 'WR' | 'TE';
  team: string;
  age: number;
  adj_value: number;
  note: string;
}> = [
  // ── MISSING PLAYERS ──────────────────────────────────────────────────────
  { name: 'A.J. Brown',          sleeperId: null, position: 'WR', team: 'PHI', age: 27, adj_value: 7500, note: 'elite WR1, age 27 prime' },
  { name: 'Tetairoa McMillan',   sleeperId: null, position: 'WR', team: 'CAR', age: 21, adj_value: 5800, note: '2025 top WR pick, starter' },
  { name: 'Emeka Egbuka',        sleeperId: null, position: 'WR', team: 'TB',  age: 23, adj_value: 5200, note: '2025 WR rookie, TB starter' },
  { name: 'Terry McLaurin',      sleeperId: null, position: 'WR', team: 'WAS', age: 29, adj_value: 5500, note: 'WAS WR1, prime age' },
  { name: 'Courtland Sutton',    sleeperId: null, position: 'WR', team: 'DEN', age: 29, adj_value: 4200, note: 'DEN WR1, age 29' },
  { name: 'Christian McCaffrey', sleeperId: null, position: 'RB', team: 'SF',  age: 28, adj_value: 5500, note: 'elite RB, injury history, age 28' },
  { name: 'RJ Harvey',           sleeperId: null, position: 'RB', team: 'CIN', age: 22, adj_value: 4800, note: '2025 RB rookie, CIN' },
  { name: 'Cam Skattebo',        sleeperId: null, position: 'RB', team: 'NYG', age: 23, adj_value: 3800, note: '2025 RB rookie, NYG' },
  { name: 'George Kittle',       sleeperId: null, position: 'TE', team: 'SF',  age: 31, adj_value: 5800, note: 'elite TE, age 31' },
  { name: 'Kyle Pitts',          sleeperId: null, position: 'TE', team: 'ATL', age: 24, adj_value: 5000, note: 'TE upside, ATL' },
  { name: 'Travis Etienne',      sleeperId: null, position: 'RB', team: 'JAX', age: 26, adj_value: 5500, note: 'JAX RB1, prime age' },
  { name: 'Davante Adams',       sleeperId: null, position: 'WR', team: 'FA',  age: 32, adj_value: 4200, note: 'elite WR, age 32 decline curve' },
  // ── WRONG VALUES (already in DB, need correction) ────────────────────────
  // Cam Ward: currently 3200 — too low for a young #1 overall pick starting
  { name: 'Cam Ward',            sleeperId: '11562', position: 'QB', team: 'CHI', age: 23, adj_value: 6200, note: '2025 #1 pick, young SF QB' },
  // Sam Darnold: currently 1200 — veteran starter should be ~3500-4000
  { name: 'Sam Darnold',         sleeperId: '6797', position: 'QB', team: 'MIN', age: 27, adj_value: 3800, note: 'starting QB, age 27' },
  // Christian Watson: currently 2000 — young WR2 with upside
  { name: 'Christian Watson',    sleeperId: '9499', position: 'WR', team: 'GB',  age: 25, adj_value: 3800, note: 'GB WR, injury history, age 25' },
  // Tyler Warren: currently 5200 — solid for a promising TE
  { name: 'Tyler Warren',        sleeperId: null, position: 'TE', team: 'IND', age: 23, adj_value: 5800, note: 'IND TE1, young upside' },
  // Dalton Kincaid: 4000 is about right, bump slightly
  { name: 'Dalton Kincaid',      sleeperId: null, position: 'TE', team: 'BUF', age: 26, adj_value: 4200, note: 'BUF TE, WR-style upside' },
  // Michael Penix Jr: 4800 seems reasonable, verify
  { name: 'Michael Penix Jr.',   sleeperId: null, position: 'QB', team: 'ATL', age: 25, adj_value: 5500, note: 'ATL starting QB, age 25 upside' },
  // Tyler Shough: needs value
  { name: 'Tyler Shough',        sleeperId: null, position: 'QB', team: 'NO',  age: 26, adj_value: 3200, note: 'NO starter, injury history' },
  // Jared Goff: currently 3500 — solid veteran starter in prime
  { name: 'Jared Goff',          sleeperId: null, position: 'QB', team: 'DET', age: 30, adj_value: 4500, note: 'DET QB1, elite offense' },
  // Baker Mayfield: currently 2500 — TB starter, should be higher
  { name: 'Baker Mayfield',      sleeperId: null, position: 'QB', team: 'TB',  age: 30, adj_value: 3800, note: 'TB starting QB' },
];

// ─── Lookup Sleeper IDs by name ───────────────────────────────────────────
async function getSleeperIds(names: string[]): Promise<Record<string, string>> {
  console.log('Fetching Sleeper player registry...');
  const res = await fetch('https://api.sleeper.app/v1/players/nfl');
  const players: Record<string, any> = await res.json();

  const result: Record<string, string> = {};
  for (const target of names) {
    const tLower = target.toLowerCase().replace(/[.']/g, '');
    let best: { id: string; score: number } | null = null;

    for (const [id, p] of Object.entries(players)) {
      if (!p.full_name) continue;
      const pLower = p.full_name.toLowerCase().replace(/[.']/g, '');
      if (pLower === tLower) { best = { id, score: 100 }; break; }
      if (pLower.includes(tLower) || tLower.includes(pLower)) {
        const score = Math.min(pLower.length, tLower.length) / Math.max(pLower.length, tLower.length) * 90;
        if (!best || score > best.score) best = { id, score };
      }
    }
    if (best) result[target] = best.id;
  }
  return result;
}

async function main() {
  const now = new Date().toISOString();

  // Gather names needing Sleeper ID lookup
  const lookupNames = FIXES.filter(f => !f.sleeperId).map(f => f.name);
  const idMap = await getSleeperIds(lookupNames);

  console.log('\n=== ID Lookup Results ===');
  for (const f of FIXES) {
    if (!f.sleeperId) {
      const found = idMap[f.name];
      f.sleeperId = found || null;
      console.log(`  ${f.name.padEnd(25)} → ${found ?? 'NOT FOUND'}`);
    }
  }

  // Build upsert rows
  const rows = FIXES
    .filter(f => f.sleeperId)
    .map(f => ({
      player_id: f.sleeperId!,
      player_name: f.name,
      position: f.position,
      team: f.team,
      format: 'dynasty',
      base_value: Math.round(f.adj_value * 0.95),
      adjusted_value: f.adj_value,
      market_value: f.adj_value,
      source: 'manual_fix_2026',
      updated_at: now,
    }));

  console.log(`\n=== Writing ${rows.length} rows to Supabase ===`);
  rows.forEach(r => console.log(`  ${r.player_name.padEnd(25)} ${r.position}  val=${r.adjusted_value}  id=${r.player_id}`));

  // Use UPDATE for existing rows, INSERT for new ones
  let updated = 0, inserted = 0, failed = 0;
  for (const row of rows) {
    // Try update first
    const { data: upd, error: updErr } = await supabase
      .from('player_values_canonical')
      .update({
        player_name: row.player_name,
        position: row.position,
        team: row.team,
        base_value: row.base_value,
        adjusted_value: row.adjusted_value,
        market_value: row.market_value,
        source: row.source,
        updated_at: row.updated_at,
      })
      .eq('player_id', row.player_id)
      .eq('format', row.format)
      .select('player_id');

    if (updErr) { console.error(`  UPDATE error for ${row.player_name}:`, updErr.message); failed++; continue; }

    if (upd && upd.length > 0) {
      updated++;
    } else {
      // Row didn't exist — insert it
      const { error: insErr } = await supabase
        .from('player_values_canonical')
        .insert(row);
      if (insErr) { console.error(`  INSERT error for ${row.player_name}:`, insErr.message); failed++; }
      else inserted++;
    }
  }
  console.log(`  Updated: ${updated}, Inserted: ${inserted}, Failed: ${failed}`);

  // Recalculate overall ranks
  console.log('\nRecalculating overall ranks...');
  const { data: all } = await supabase
    .from('player_values_canonical')
    .select('player_id, adjusted_value')
    .eq('format', 'dynasty')
    .order('adjusted_value', { ascending: false });

  if (all) {
    const rankUpdates = all.map((r, i) => ({ player_id: r.player_id, rank_overall: i + 1 }));
    // Update in batches
    for (let i = 0; i < rankUpdates.length; i += 50) {
      const batch = rankUpdates.slice(i, i + 50);
      for (const { player_id, rank_overall } of batch) {
        await supabase
          .from('player_values_canonical')
          .update({ rank_overall })
          .eq('player_id', player_id)
          .eq('format', 'dynasty');
      }
    }
    console.log(`  Updated ranks for ${all.length} players`);
  }

  // Spot-check final state
  console.log('\n=== Final spot check ===');
  const checkNames = ['Chase', 'Allen', 'Mahomes', 'Burrow', 'Maye', 'Ward', 'Darnold', 'Goff', 'Mayfield',
    'A.J. Brown', 'Jefferson', 'McMillan', 'McCaffrey', 'Etienne', 'Harvey', 'Kittle', 'Pitts', 'Warren'];

  for (const n of checkNames) {
    const { data } = await supabase
      .from('player_values_canonical')
      .select('player_name, position, adjusted_value, rank_overall')
      .eq('format', 'dynasty')
      .ilike('player_name', `%${n.split(' ').pop()!}%`)
      .order('adjusted_value', { ascending: false })
      .limit(1);
    if (data?.[0]) {
      const r = data[0];
      console.log(`  #${String(r.rank_overall ?? '?').padStart(3)}  ${(r.player_name ?? '').padEnd(25)}  ${r.position}  ${r.adjusted_value}`);
    } else {
      console.log(`  ???  ${n.padEnd(25)}  NOT FOUND`);
    }
  }

  console.log('\n✓ Done. Reload the Trade Analyzer to see updated values.');
}

main().catch(err => { console.error(err); process.exit(1); });
