/**
 * Update ALL players to end-of-2025-season dynasty values.
 * Accounts for: year-2 breakouts, aging curves, role changes, injuries.
 *   npx tsx scripts/fix-eoy-2025-all.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const now = new Date().toISOString();

// player_id → new value. Only players needing adjustment from current.
const UPDATES: Array<{ player_id: string; name: string; adj_value: number; reason: string }> = [
  // === QBs — rising year 2 guys ===
  { player_id: '11566', name: 'Jayden Daniels',    adj_value: 8500, reason: 'Year 2 MVP contender, WAS, age 24' },
  { player_id: '11565', name: 'J.J. McCarthy',     adj_value: 5800, reason: 'Healthy year 2, MIN starter, age 23' },
  { player_id: '11560', name: 'Caleb Williams',    adj_value: 7200, reason: 'CHI year 2 breakout, age 23' },
  { player_id: '11567', name: 'Drake Maye',        adj_value: 7200, reason: 'NE year 2, emerging franchise QB, age 23' },
  // === QBs — declining/role changes ===
  { player_id: '6797',  name: 'Sam Darnold',       adj_value: 1500, reason: 'JJ McCarthy reclaimed MIN job, Darnold now backup' },
  { player_id: '5849',  name: 'Jared Goff',        adj_value: 3500, reason: 'DET, age 31, dynasty value declining' },
  { player_id: '6904',  name: 'Justin Fields',     adj_value: 800,  reason: 'PIT backup, no path to starting, dynasty irrelevant' },
  { player_id: '4881',  name: 'Tua Tagovailoa',    adj_value: 3800, reason: 'MIA, concussion history, dynasty concerns' },
  // === RBs — aging/role changes ===
  { player_id: '4866',  name: 'Saquon Barkley',    adj_value: 6500, reason: 'PHI, age 28, coming off big year but RB age curve' },
  { player_id: '8112',  name: "De'Von Achane",     adj_value: 7000, reason: 'MIA, injury history, still elite when healthy age 24' },
  { player_id: '4034',  name: 'Christian McCaffrey',adj_value: 4500, reason: 'SF, age 29, injury history, declining dynasty value' },
  // === RBs — year 2 risers ===
  { player_id: '9493',  name: 'Jahmyr Gibbs',      adj_value: 8500, reason: 'DET, massive year 2, age 23 elite dynasty asset' },
  { player_id: '7523',  name: 'Trevor Lawrence',   adj_value: 4500, reason: 'JAX offense improved year 3, age 26, regained upside' },
  // === WRs — year 2 risers ===
  { player_id: '9502',  name: 'Malik Nabers',      adj_value: 8500, reason: 'NYG, elite year 2, age 23, top WR dynasty asset' },
  { player_id: '11567', name: 'Drake Maye',        adj_value: 7200, reason: 'already updated above' },  // dup skip
  { player_id: '9503',  name: 'Rome Odunze',       adj_value: 6500, reason: 'CHI, year 2 breakout with Williams, age 24' },
  { player_id: '10229', name: 'Rashee Rice',       adj_value: 6800, reason: 'KC, full healthy year 2, WR1 role age 24' },
  { player_id: '8137',  name: 'George Pickens',    adj_value: 5800, reason: 'DAL, year 2 on better team, age 25 prime' },
  { player_id: '11580', name: 'Brian Thomas Jr.',  adj_value: 7500, reason: 'JAX, year 2 jump, established WR1 age 23' },
  // === WRs — aging/declining ===
  { player_id: '2216',  name: 'Mike Evans',        adj_value: 2000, reason: 'TB, age 33, dynasty value minimal' },
  { player_id: 'cooper_kupp', name: 'Cooper Kupp', adj_value: 1200, reason: 'LAR, age 33, injury prone, dynasty sell' },
  { player_id: '3197',  name: 'Davante Adams',     adj_value: 1500, reason: 'Free agent, age 33, dynasty irrelevant' },
  // === TEs — year 2 risers ===
  { player_id: '10859', name: 'Sam LaPorta',       adj_value: 6800, reason: 'DET, year 2 ascent, elite target share age 25' },
  // === TEs — aging ===
  { player_id: '4017',  name: 'George Kittle',     adj_value: 4500, reason: 'SF, age 32, dynasty value declining' },
  { player_id: '6803',  name: 'Travis Kelce',      adj_value: 1000, reason: 'KC, age 36, final year dynasty value' },
];

// Remove duplicates (Brian Thomas has wrong player_id here — use correct one)
// Brian Thomas Jr. correct player_id is 11631 (from fix-harrison-thomas.ts)
const DEDUPED = UPDATES.filter((u, i, arr) =>
  arr.findIndex(x => x.player_id === u.player_id) === i
).filter(u => u.player_id !== '11580'); // remove wrong Brian Thomas entry

// Add Brian Thomas Jr with correct ID
DEDUPED.push({ player_id: '11631', name: 'Brian Thomas Jr.', adj_value: 7500, reason: 'JAX, year 2 jump, established WR1 age 23' });

console.log(`Applying ${DEDUPED.length} value updates...\n`);
let updated = 0, notFound = 0, failed = 0;

for (const f of DEDUPED) {
  if (f.reason === 'already updated above') continue;

  const { data: upd, error } = await supabase
    .from('player_values_canonical')
    .update({
      adjusted_value: f.adj_value,
      base_value: Math.round(f.adj_value * 0.95),
      market_value: f.adj_value,
      updated_at: now,
    })
    .eq('player_id', f.player_id)
    .eq('format', 'dynasty')
    .select('player_id');

  if (error) { console.error(`  Error ${f.name}:`, error.message); failed++; }
  else if (upd && upd.length > 0) { console.log(`  Updated: ${f.name.padEnd(28)} → ${f.adj_value}`); updated++; }
  else { console.log(`  NOT FOUND: ${f.name} (${f.player_id})`); notFound++; }
}
console.log(`\n  Updated: ${updated}, Not found: ${notFound}, Failed: ${failed}`);

// Also need to look up correct player_ids for a few players by name
// Davante Adams — might be in DB by slug
console.log('\n=== Checking slug-based IDs ===');
const slugChecks = ['cooper_kupp', 'davante_adams'];
for (const slug of slugChecks) {
  const { data } = await supabase
    .from('player_values_canonical')
    .select('player_id, player_name, adjusted_value')
    .eq('player_id', slug)
    .eq('format', 'dynasty');
  if (data && data.length > 0) {
    console.log(`  Found slug: ${slug} → ${data[0].player_name} val=${data[0].adjusted_value}`);
  }
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

console.log('\n✓ Done.');
