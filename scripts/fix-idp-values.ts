/**
 * Add missing IDP players + correct stale values.
 *   npx tsx scripts/fix-idp-values.ts
 *
 * Dynasty IDP scale (same 0-10000 as offense):
 *   Elite DL/LB/DB (Parsons, T.J. Watt) = 5500
 *   Upper tier = 4000-5000
 *   Mid-starter = 2500-3800
 *   Young upside = 1800-2800
 *   Fringe starter = 800-1800
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

const FIXES: Array<{
  name: string;
  sleeperId: string | null;
  position: 'DL' | 'LB' | 'DB';
  team: string;
  age: number;
  adj_value: number;
  note: string;
}> = [
  // ── MISSING: 2024 Draft Class ─────────────────────────────────────────────
  { name: 'Jared Verse',            sleeperId: null, position: 'DL', team: 'LAR', age: 23, adj_value: 3800, note: '2024 1st, 8+ sacks, elite upside' },
  { name: 'Quinyon Mitchell',       sleeperId: null, position: 'DB', team: 'PHI', age: 22, adj_value: 3800, note: '2024 1st round CB, elite rookie year' },
  { name: 'Laiatu Latu',            sleeperId: null, position: 'DL', team: 'IND', age: 24, adj_value: 3000, note: '2024 1st round DL, IND' },
  { name: 'Dallas Turner',          sleeperId: null, position: 'DL', team: 'MIN', age: 22, adj_value: 3000, note: '2024 1st round edge, MIN' },
  { name: 'Cooper DeJean',          sleeperId: null, position: 'DB', team: 'PHI', age: 22, adj_value: 2800, note: '2024 1st round CB/S, PHI' },
  { name: 'Payton Wilson',          sleeperId: null, position: 'LB', team: 'PIT', age: 23, adj_value: 2800, note: '2024 1st round LB, tackle volume' },
  { name: 'Nate Wiggins',           sleeperId: null, position: 'DB', team: 'BAL', age: 22, adj_value: 2500, note: '2024 1st round CB, BAL' },
  { name: 'Chop Robinson',          sleeperId: null, position: 'DL', team: 'MIA', age: 22, adj_value: 2200, note: '2024 1st round edge, MIA' },
  { name: 'Edgerrin Cooper',        sleeperId: null, position: 'LB', team: 'GB',  age: 23, adj_value: 2200, note: '2024 2nd round LB, GB' },
  { name: 'Tyler Nubin',            sleeperId: null, position: 'DB', team: 'NYG', age: 23, adj_value: 2000, note: '2024 2nd round safety, NYG' },
  { name: 'Kool-Aid McKinstry',     sleeperId: null, position: 'DB', team: 'BAL', age: 22, adj_value: 2000, note: '2024 2nd round CB, BAL' },
  { name: 'Bralen Trice',           sleeperId: null, position: 'DL', team: 'SEA', age: 22, adj_value: 2000, note: '2024 2nd round edge, SEA' },
  { name: 'Kris Jenkins Jr.',       sleeperId: null, position: 'DL', team: 'DET', age: 22, adj_value: 1800, note: '2024 2nd round DT, DET' },
  { name: 'B.J. Thompson',          sleeperId: null, position: 'DL', team: 'PHI', age: 24, adj_value: 1800, note: '2024 5th round edge, PHI starter' },
  { name: 'Darius Muasau',          sleeperId: null, position: 'LB', team: 'LAR', age: 24, adj_value: 1600, note: '2024 LB, LAR' },

  // ── MISSING: 2023 Draft Class ─────────────────────────────────────────────
  { name: 'Felix Anudike-Uzomah',   sleeperId: null, position: 'DL', team: 'KC',  age: 23, adj_value: 2800, note: '2023 1st round edge, KC' },
  { name: 'Tuli Tuipulotu',         sleeperId: null, position: 'DL', team: 'LAC', age: 23, adj_value: 2500, note: '2023 2nd round DL, LAC' },
  { name: 'Nolan Smith Jr.',        sleeperId: null, position: 'DL', team: 'PHI', age: 23, adj_value: 2200, note: '2023 1st round edge, PHI' },
  { name: 'Lukas Van Ness',         sleeperId: null, position: 'DL', team: 'GB',  age: 23, adj_value: 2000, note: '2023 1st round DL, GB' },
  { name: 'Derick Hall',            sleeperId: null, position: 'DL', team: 'SEA', age: 25, adj_value: 2200, note: '2023 2nd round edge, SEA' },
  { name: 'Kitan Oladapo',          sleeperId: null, position: 'DB', team: 'GB',  age: 24, adj_value: 1500, note: '2023 DB, GB' },
  { name: 'Yaya Diaby',             sleeperId: null, position: 'DL', team: 'TB',  age: 24, adj_value: 2000, note: '2023 3rd round edge, TB' },
  { name: 'Zacch Pickens',          sleeperId: null, position: 'DL', team: 'CHI', age: 24, adj_value: 1800, note: '2023 2nd round DT, CHI' },

  // ── MISSING: Young established pass rushers ───────────────────────────────
  { name: 'Nik Bonitto',            sleeperId: null, position: 'DL', team: 'DEN', age: 24, adj_value: 4000, note: '11 sacks 2024, elite young pass rusher' },
  { name: 'Josh Uche',              sleeperId: null, position: 'DL', team: 'NE',  age: 26, adj_value: 2500, note: 'pass rush specialist, NE' },
  { name: 'Carl Granderson',        sleeperId: null, position: 'DL', team: 'GB',  age: 26, adj_value: 2200, note: 'GB edge, solid starter' },
  { name: 'Drake Jackson',          sleeperId: null, position: 'DL', team: 'SF',  age: 24, adj_value: 2000, note: 'SF edge, young upside' },
  { name: 'Sam Williams',           sleeperId: null, position: 'DL', team: 'DAL', age: 25, adj_value: 1800, note: 'DAL edge, injury history' },

  // ── MISSING: DB starters ──────────────────────────────────────────────────
  { name: 'Kelee Ringo',            sleeperId: null, position: 'DB', team: 'PHI', age: 23, adj_value: 2000, note: 'PHI CB, young starter' },
  { name: 'Devon Witherspoon',      sleeperId: null, position: 'DB', team: 'SEA', age: 23, adj_value: 3500, note: '2023 1st round CB, elite young corner' },
  { name: 'Joey Porter Jr.',        sleeperId: null, position: 'DB', team: 'PIT', age: 23, adj_value: 2800, note: '2023 1st round CB, PIT starter' },
  { name: 'Emmanuel Forbes Jr.',    sleeperId: null, position: 'DB', team: 'WAS', age: 23, adj_value: 2000, note: '2023 1st round CB, WAS' },
  { name: 'Deonte Banks',           sleeperId: null, position: 'DB', team: 'NYG', age: 23, adj_value: 2000, note: '2023 1st round CB, NYG' },
  { name: 'Clark Phillips III',     sleeperId: null, position: 'DB', team: 'CLE', age: 23, adj_value: 1800, note: '2023 4th round CB, CLE starter' },
  { name: 'Darius Rush',            sleeperId: null, position: 'DB', team: 'CAR', age: 24, adj_value: 1500, note: 'young CB, CAR' },

  // ── MISSING: LB starters ─────────────────────────────────────────────────
  { name: 'Trenton Simpson',        sleeperId: null, position: 'LB', team: 'BAL', age: 23, adj_value: 2000, note: '2023 3rd round LB, BAL' },
  { name: 'Drew Sanders',           sleeperId: null, position: 'LB', team: 'DEN', age: 24, adj_value: 1800, note: '2023 3rd round LB, DEN' },
  { name: 'Anfernee Jennings',      sleeperId: null, position: 'LB', team: 'TEN', age: 26, adj_value: 1500, note: 'TEN LB starter' },

  // ── VALUE CORRECTIONS (in DB but stale) ──────────────────────────────────
  // Josh Allen (DL, JAX) — torn ACL 2024 but age 27, should recover, value too low at 500
  { name: 'Josh Allen',             sleeperId: '5038', position: 'DL', team: 'JAX', age: 27, adj_value: 2800, note: 'JAX edge, ACL recovery, age 27 prime' },
  // Aidan Hutchinson — broken leg 2024, young (24), dynasty hold
  { name: 'Aidan Hutchinson',       sleeperId: '8151', position: 'DL', team: 'DET', age: 24, adj_value: 3500, note: 'DET edge, broken leg recovery, elite upside age 24' },
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

  const lookupNames = FIXES.filter(f => !f.sleeperId).map(f => f.name);
  const idMap = await getSleeperIds(lookupNames);

  console.log('\n=== ID Lookup Results ===');
  for (const f of FIXES) {
    if (!f.sleeperId) {
      const found = idMap[f.name];
      f.sleeperId = found || null;
      console.log(`  ${f.name.padEnd(28)} → ${found ?? 'NOT FOUND'}`);
    }
  }

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
  rows.forEach(r => console.log(`  ${r.player_name.padEnd(28)} ${r.position}  val=${r.adjusted_value}  id=${r.player_id}`));

  let updated = 0, inserted = 0, failed = 0;
  for (const row of rows) {
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
      const { error: insErr } = await supabase
        .from('player_values_canonical')
        .insert(row);
      if (insErr) { console.error(`  INSERT error for ${row.player_name}:`, insErr.message); failed++; }
      else inserted++;
    }
  }
  console.log(`\n  Updated: ${updated}, Inserted: ${inserted}, Failed: ${failed}`);

  // Recalculate overall ranks
  console.log('\nRecalculating overall ranks...');
  const { data: all } = await supabase
    .from('player_values_canonical')
    .select('player_id, adjusted_value')
    .eq('format', 'dynasty')
    .order('adjusted_value', { ascending: false });

  if (all) {
    for (let i = 0; i < all.length; i += 50) {
      const batch = all.slice(i, i + 50);
      for (const { player_id, rank_overall } of batch.map((r, j) => ({ player_id: r.player_id, rank_overall: i + j + 1 }))) {
        await supabase
          .from('player_values_canonical')
          .update({ rank_overall })
          .eq('player_id', player_id)
          .eq('format', 'dynasty');
      }
    }
    console.log(`  Updated ranks for ${all.length} players`);
  }

  console.log('\n✓ Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
