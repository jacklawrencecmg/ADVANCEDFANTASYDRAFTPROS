/**
 * Emergency fix: wrong IDs corrupted Jalen Hurts and Justin Herbert.
 * Restores them and correctly updates Justin Fields.
 *   npx tsx scripts/fix-hurts-herbert.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const now = new Date().toISOString();

// Find correct player_ids via name lookup
const names = ['jalen hurts', 'justin herbert', 'justin fields', 'jared goff'];
console.log('=== Current DB state ===');
for (const n of names) {
  const { data } = await supabase
    .from('player_values_canonical')
    .select('player_id, player_name, adjusted_value')
    .ilike('player_name', n)
    .eq('format', 'dynasty');
  data?.forEach(r => console.log(`  ${(r.player_id||'').padEnd(14)} ${(r.player_name||'').padEnd(22)} val=${r.adjusted_value}`));
}

// Use name-based lookup from Sleeper to find correct IDs
console.log('\nFetching Sleeper registry...');
const res = await fetch('https://api.sleeper.app/v1/players/nfl');
const players: Record<string, any> = await res.json();
const nameToId: Record<string, string> = {};
for (const [id, p] of Object.entries(players)) {
  if (p.full_name) nameToId[p.full_name.toLowerCase().replace(/[.']/g, '')] = id;
}

const FIXES = [
  { name: 'Jalen Hurts',    adj_value: 8500, note: 'PHI QB1, age 27, elite dynasty asset' },
  { name: 'Justin Herbert', adj_value: 7500, note: 'LAC QB1, age 27, elite arm talent' },
  { name: 'Justin Fields',  adj_value: 800,  note: 'PIT backup, minimal dynasty value' },
];

console.log('\n=== Applying correct values ===');
for (const f of FIXES) {
  // Find by name in DB
  const { data: found } = await supabase
    .from('player_values_canonical')
    .select('player_id')
    .ilike('player_name', f.name)
    .eq('format', 'dynasty')
    .limit(1);

  if (!found || found.length === 0) {
    console.log(`  NOT IN DB: ${f.name}`);
    continue;
  }

  const pid = found[0].player_id;
  const { error } = await supabase
    .from('player_values_canonical')
    .update({
      adjusted_value: f.adj_value,
      base_value: Math.round(f.adj_value * 0.95),
      market_value: f.adj_value,
      updated_at: now,
    })
    .eq('player_id', pid)
    .eq('format', 'dynasty');

  if (error) console.error(`  Error ${f.name}:`, error.message);
  else console.log(`  Fixed: ${f.name.padEnd(22)} (${pid}) → ${f.adj_value}`);
}

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
console.log('\n=== Verify ===');
for (const n of ['jalen hurts', 'justin herbert', 'justin fields']) {
  const { data } = await supabase
    .from('player_values_canonical')
    .select('player_id, player_name, adjusted_value, rank_overall')
    .ilike('player_name', n)
    .eq('format', 'dynasty');
  data?.forEach(r => console.log(`  #${String(r.rank_overall||'?').padStart(3)}  ${(r.player_name||'').padEnd(22)} val=${r.adjusted_value}`));
}
console.log('\n✓ Done.');
