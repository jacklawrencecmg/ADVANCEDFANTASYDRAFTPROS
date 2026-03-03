/**
 * Deep check — find ALL rows that could affect Swift/Young lookups.
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

// Get ALL dynasty rows and simulate exact app logic
const { data: all } = await supabase
  .from('player_values_canonical')
  .select('player_id, player_name, position, adjusted_value, base_value')
  .eq('format', 'dynasty')
  .order('adjusted_value', { ascending: false })
  .limit(2000);

// Build the same maps the app builds
const dbById = new Map<string, any>();
const dbByName = new Map<string, any>();
for (const row of all || []) {
  dbById.set(row.player_id, row);
  const key = (row.player_name || '').toLowerCase().trim().replace(/[^a-z0-9 ]/g, '');
  dbByName.set(key, row); // last inserted wins (Map behavior)
}

console.log(`Total rows: ${all?.length}`);
console.log(`dbById entries: ${dbById.size}`);
console.log(`dbByName entries: ${dbByName.size}`);

// Check specific lookups that the app would do
const SF_MULT: Record<string, number> = { QB: 1.35, RB: 1.15, WR: 1.0, TE: 1.10 };

function simulate(sleeperId: string, fullName: string, position: string, isSuperflex: boolean) {
  const normalizedName = fullName.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '');
  const byId = dbById.get(sleeperId);
  const idMatchesName = byId && (byId.player_name || '').toLowerCase().trim().replace(/[^a-z0-9 ]/g, '') === normalizedName;
  const dbValue = (idMatchesName ? byId : undefined) || dbByName.get(normalizedName);

  if (dbValue) {
    const base = typeof dbValue.base_value === 'number' ? dbValue.base_value : parseFloat(String(dbValue.base_value || 0));
    const fmt = isSuperflex ? 'dynasty_sf' : 'dynasty_1qb';
    const mult = SF_MULT[position] ?? 1.0;
    const value = Math.min(13500, Math.round(base * mult));
    console.log(`  ${fullName} (${sleeperId}): byId=${byId?.player_id}(${byId?.base_value}) idMatch=${idMatchesName} → using pid=${dbValue.player_id} base=${base} mult=${mult} → value=${value}`);
    return value;
  }
  console.log(`  ${fullName} (${sleeperId}): NOT FOUND in DB — fallback to position default`);
  return null;
}

console.log('\n=== Simulation (1QB mode) ===');
simulate('6790', "D'Andre Swift", 'RB', false);
simulate('9228', 'Bryce Young',   'QB', false);

console.log('\n=== Simulation (SF mode) ===');
simulate('6790', "D'Andre Swift", 'RB', true);
simulate('9228', 'Bryce Young',   'QB', true);

// Check for any rows that contain "swift" or "young" in their normalized name
console.log('\n=== All rows with "swift" or "young" in name ===');
for (const row of all || []) {
  const key = (row.player_name || '').toLowerCase();
  if (key.includes('swift') || (key.includes('young') && key.includes('bryce'))) {
    console.log(`  pid=${row.player_id} name="${row.player_name}" adj=${row.adjusted_value} base=${row.base_value}`);
  }
}
