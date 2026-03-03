/**
 * Full DB audit for Swift and Young across all formats + Sleeper ID check.
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

// All rows for these players, all formats
const { data } = await supabase
  .from('player_values_canonical')
  .select('player_id, player_name, position, team, adjusted_value, base_value, format')
  .or("player_name.ilike.%swift%,player_name.ilike.%bryce young%")
  .order('player_name');
console.log('=== All DB rows (all formats) ===');
data?.forEach(r => console.log(`  ${(r.player_id||'').padEnd(14)} ${(r.format||'').padEnd(10)} ${(r.player_name||'').padEnd(25)} adj=${r.adjusted_value} base=${r.base_value}`));

// Also check what player_id 9228 maps to (Bryce Young's actual Sleeper ID)
const { data: byId } = await supabase
  .from('player_values_canonical')
  .select('player_id, player_name, adjusted_value, format')
  .in('player_id', ['9228', '6768', '6790']);
console.log('\n=== Rows by these specific IDs ===');
byId?.forEach(r => console.log(`  ${(r.player_id||'').padEnd(10)} ${(r.format||'').padEnd(10)} ${(r.player_name||'').padEnd(25)} adj=${r.adjusted_value}`));

// Check what player_id 6768 maps to in Sleeper
console.log('\nFetching Sleeper registry...');
const res = await fetch('https://api.sleeper.app/v1/players/nfl');
const players: Record<string, any> = await res.json();
for (const id of ['6768', '6790', '9228']) {
  const p = players[id];
  console.log(`  Sleeper ${id}: ${p?.full_name ?? 'NOT FOUND'} ${p?.position ?? ''} ${p?.team ?? ''}`);
}
