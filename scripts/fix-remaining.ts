/**
 * Fix remaining value outliers — uses Sleeper name lookup to get correct IDs.
 *   npx tsx scripts/fix-remaining.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const FIXES = [
  // Clear fixes
  { name: 'T.J. Hockenson',      position: 'TE', team: 'MIN', adj_value: 3800, note: 'age 27, ACL recovery, young TE upside' },
  { name: 'Evan Engram',         position: 'TE', team: 'JAX', adj_value: 1500, note: 'active JAX starter, age 30' },
  { name: 'Najee Harris',        position: 'RB', team: 'PIT', adj_value: 3000, note: 'PIT featured back, age 27' },
  { name: 'Anthony Richardson',  position: 'QB', team: 'IND', adj_value: 4800, note: 'IND starter, massive upside age 22, injury history' },
  // Borderline
  { name: 'DJ Moore',            position: 'WR', team: 'CHI', adj_value: 5000, note: 'CHI WR1, age 27' },
  { name: 'Treylon Burks',       position: 'WR', team: 'TEN', adj_value: 1200, note: 'TEN WR, age 24, injury history' },
];

async function main() {
  const now = new Date().toISOString();

  // Fetch Sleeper registry for name-based ID lookup
  console.log('Fetching Sleeper registry...');
  const res = await fetch('https://api.sleeper.app/v1/players/nfl');
  const players: Record<string, any> = await res.json();

  // Build name → id map
  const nameToId: Record<string, string> = {};
  for (const [id, p] of Object.entries(players)) {
    if (p.full_name) nameToId[p.full_name.toLowerCase().replace(/[.']/g, '')] = id;
  }

  console.log('\n=== ID Lookup ===');
  const resolved: Array<typeof FIXES[0] & { player_id: string }> = [];
  for (const f of FIXES) {
    const key = f.name.toLowerCase().replace(/[.']/g, '');
    const id = nameToId[key];
    console.log(`  ${f.name.padEnd(28)} → ${id ?? 'NOT FOUND'}`);
    if (id) resolved.push({ ...f, player_id: id });
  }

  console.log('\n=== Applying fixes ===');
  let updated = 0, inserted = 0, failed = 0;

  for (const f of resolved) {
    const row = {
      player_name: f.name,
      position: f.position,
      team: f.team,
      base_value: Math.round(f.adj_value * 0.95),
      adjusted_value: f.adj_value,
      market_value: f.adj_value,
      source: 'manual_fix_2026',
      updated_at: now,
    };

    const { data: upd, error: updErr } = await supabase
      .from('player_values_canonical')
      .update(row)
      .eq('player_id', f.player_id)
      .eq('format', 'dynasty')
      .select('player_id');

    if (updErr) { console.error(`  UPDATE error ${f.name}:`, updErr.message); failed++; continue; }

    if (upd && upd.length > 0) {
      console.log(`  Updated : ${f.name.padEnd(28)} → ${f.adj_value}`);
      updated++;
    } else {
      const { error: insErr } = await supabase
        .from('player_values_canonical')
        .insert({ player_id: f.player_id, format: 'dynasty', ...row });
      if (insErr) { console.error(`  INSERT error ${f.name}:`, insErr.message); failed++; }
      else { console.log(`  Inserted: ${f.name.padEnd(28)} → ${f.adj_value}`); inserted++; }
    }
  }
  console.log(`\n  Updated: ${updated}, Inserted: ${inserted}, Failed: ${failed}`);

  // Recalculate ranks
  console.log('\nRecalculating ranks...');
  const { data: all } = await supabase
    .from('player_values_canonical')
    .select('player_id, adjusted_value')
    .eq('format', 'dynasty')
    .order('adjusted_value', { ascending: false });

  if (all) {
    for (let i = 0; i < all.length; i += 50) {
      const batch = all.slice(i, i + 50);
      for (let j = 0; j < batch.length; j++) {
        await supabase.from('player_values_canonical')
          .update({ rank_overall: i + j + 1 })
          .eq('player_id', batch[j].player_id)
          .eq('format', 'dynasty');
      }
    }
    console.log(`  Ranks updated for ${all.length} players`);
  }

  // Spot check
  console.log('\n=== Final spot check ===');
  const { data: check } = await supabase
    .from('player_values_canonical')
    .select('player_name, position, team, adjusted_value, rank_overall')
    .eq('format', 'dynasty')
    .in('player_id', resolved.map(f => f.player_id))
    .order('adjusted_value', { ascending: false });
  check?.forEach(r => {
    console.log(`  #${String(r.rank_overall ?? '?').padStart(3)}  ${(r.player_name||'').padEnd(28)} ${(r.position||'').padEnd(4)} ${(r.team||'').padEnd(5)} ${r.adjusted_value}`);
  });

  console.log('\n✓ Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
