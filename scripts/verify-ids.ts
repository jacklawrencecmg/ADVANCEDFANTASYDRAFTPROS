/**
 * Verify player_ids in DB against Sleeper registry.
 *   npx tsx scripts/verify-ids.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

console.log('Fetching Sleeper registry...');
const res = await fetch('https://api.sleeper.app/v1/players/nfl');
const players: Record<string, any> = await res.json();

// Check specific IDs we're unsure about
const checkIds = ['11576', '11565', '11566', '11578', '11579', '11580', '11581', '11583', '11637', '11638', '11625', '8137', '2216'];

console.log('\n=== ID Verification (Sleeper registry) ===');
for (const id of checkIds) {
  const p = players[id];
  if (p) {
    console.log(`  ${id.padEnd(8)} → ${(p.full_name || 'no name').padEnd(28)} ${(p.position||'?').padEnd(5)} ${p.team || '?'}`);
  } else {
    console.log(`  ${id.padEnd(8)} → NOT IN REGISTRY`);
  }
}

// Check what our DB has for these IDs
console.log('\n=== DB rows for these IDs ===');
const { data } = await supabase
  .from('player_values_canonical')
  .select('player_id, player_name, position, team, adjusted_value')
  .in('player_id', checkIds)
  .eq('format', 'dynasty')
  .order('adjusted_value', { ascending: false });

data?.forEach(r => {
  const sleeperName = players[r.player_id]?.full_name || 'NOT IN SLEEPER';
  const match = sleeperName.toLowerCase() === (r.player_name || '').toLowerCase() ? '✓' : '✗ MISMATCH';
  console.log(`  ${(r.player_id||'').padEnd(8)} DB:"${(r.player_name||'').padEnd(28)}" Sleeper:"${sleeperName.padEnd(28)}" ${match}`);
});
