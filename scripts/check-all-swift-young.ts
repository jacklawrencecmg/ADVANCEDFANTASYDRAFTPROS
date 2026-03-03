/**
 * Check ALL rows for Swift and Young including non-dynasty formats.
 * Also checks what the name-based lookup map would resolve to.
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

// Get ALL rows for these players across all formats, no filters
const { data: all } = await supabase
  .from('player_values_canonical')
  .select('player_id, player_name, position, team, adjusted_value, base_value, format, updated_at')
  .or("player_name.ilike.%swift%,player_name.ilike.%bryce young%")
  .order('adjusted_value', { ascending: false });

console.log('=== ALL rows for Swift / Bryce Young (all formats) ===');
all?.forEach(r => {
  console.log(`  ${(r.player_id||'').padEnd(16)} ${(r.format||'').padEnd(10)} ${(r.player_name||'').padEnd(26)} adj=${r.adjusted_value} base=${r.base_value} updated=${(r.updated_at||'').substring(0,10)}`);
});

// Now simulate what the app's name-based lookup would find
// sleeperApi builds: new Map(mapped.map(v => [normalize(player_name), v]))
// The ORDER is by adjusted_value DESC, so highest-value row is inserted first,
// but Map keeps LAST inserted value for duplicate keys.
// So if there are 2 "D'Andre Swift" rows, the LOWER value one (last in the array)
// would win in the name map.
console.log('\n=== Name-map simulation (dynasty only, ordered by adj_value DESC) ===');
const { data: dynasty } = await supabase
  .from('player_values_canonical')
  .select('player_id, player_name, adjusted_value, base_value')
  .eq('format', 'dynasty')
  .order('adjusted_value', { ascending: false })
  .limit(2000);

const nameMap = new Map<string, any>();
dynasty?.forEach(r => {
  const key = (r.player_name || '').toLowerCase().trim().replace(/[^a-z0-9 ]/g, '');
  nameMap.set(key, r); // last one wins
});

for (const name of ['dandre swift', 'bryce young']) {
  const found = nameMap.get(name);
  console.log(`  "${name}" → player_id=${found?.player_id} adj=${found?.adjusted_value} base=${found?.base_value}`);
}
