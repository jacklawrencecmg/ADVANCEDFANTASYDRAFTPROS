/**
 * Fix Marvin Harrison Jr and Brian Thomas Jr with verified Sleeper IDs.
 *   npx tsx scripts/fix-harrison-thomas.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const now = new Date().toISOString();

// Verified: Sleeper stores "Marvin Harrison" (no Jr.) → 11628, "Brian Thomas" (no Jr.) → 11631
const FIXES = [
  { player_id: '11628', name: 'Marvin Harrison Jr.', position: 'WR', team: 'ARI', adj_value: 7500 },
  { player_id: '11631', name: 'Brian Thomas Jr.',    position: 'WR', team: 'JAX', adj_value: 7200 },
];

// Verify against Sleeper
console.log('Fetching Sleeper registry to verify...');
const res = await fetch('https://api.sleeper.app/v1/players/nfl');
const players: Record<string, any> = await res.json();
console.log('\n=== ID Verification ===');
for (const f of FIXES) {
  const p = players[f.player_id];
  console.log(`  ${f.player_id.padEnd(8)} Sleeper:"${(p?.full_name||'NOT FOUND').padEnd(25)}" target:"${f.name}"`);
}

console.log('\n=== Applying fixes ===');
let updated = 0, inserted = 0, failed = 0;

for (const f of FIXES) {
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
  .in('player_id', FIXES.map(f => f.player_id))
  .order('adjusted_value', { ascending: false });
check?.forEach(r => {
  console.log(`  #${String(r.rank_overall ?? '?').padStart(3)}  ${(r.player_name||'').padEnd(28)} ${(r.position||'').padEnd(4)} ${(r.team||'').padEnd(5)} ${r.adjusted_value}`);
});

console.log('\n✓ Done.');
