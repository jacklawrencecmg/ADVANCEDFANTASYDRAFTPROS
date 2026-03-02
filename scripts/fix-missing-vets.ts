/**
 * Fix remaining veterans not found by hardcoded IDs.
 *   npx tsx scripts/fix-missing-vets.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const now = new Date().toISOString();

// Find correct player_ids by name in DB
const searches = ['tagovailoa', 'kittle', 'adams'];
console.log('=== Finding IDs in DB ===');
for (const n of searches) {
  const { data } = await supabase
    .from('player_values_canonical')
    .select('player_id, player_name, adjusted_value')
    .ilike('player_name', `%${n}%`)
    .eq('format', 'dynasty');
  data?.forEach(r => console.log(`  ${(r.player_id||'').padEnd(16)} ${(r.player_name||'').padEnd(25)} val=${r.adjusted_value}`));
}

// Fetch Sleeper registry for correct IDs
console.log('\nFetching Sleeper registry...');
const res = await fetch('https://api.sleeper.app/v1/players/nfl');
const players: Record<string, any> = await res.json();

const targets = ['Tua Tagovailoa', 'George Kittle', 'Davante Adams'];
console.log('\n=== Sleeper IDs ===');
for (const t of targets) {
  const key = t.toLowerCase().replace(/[.']/g, '');
  const found = Object.entries(players).find(([, p]) =>
    p.full_name && p.full_name.toLowerCase().replace(/[.']/g, '') === key
  );
  if (found) {
    const [id, p] = found;
    console.log(`  ${t.padEnd(25)} → ${id} ${p.position} ${p.team||'?'}`);
  } else {
    console.log(`  ${t.padEnd(25)} → NOT FOUND`);
  }
}

// Apply fixes using name-based lookup
const FIXES = [
  { name: 'Tua Tagovailoa', adj_value: 3800 },
  { name: 'George Kittle',  adj_value: 4500 },
  { name: 'Davante Adams',  adj_value: 1500 },
];

console.log('\n=== Applying fixes ===');
for (const f of FIXES) {
  // Find by name in DB and update
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
  else console.log(`  Updated: ${f.name.padEnd(25)} (${pid}) → ${f.adj_value}`);
}

// Rerank
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
console.log('\n✓ Done.');
