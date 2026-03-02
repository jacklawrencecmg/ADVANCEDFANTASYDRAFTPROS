/**
 * Fix 2024 rookie class — wrong IDs in DB, add missing players.
 *   npx tsx scripts/fix-2024-class.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const now = new Date().toISOString();

// Fetch Sleeper registry for name-based ID lookup
console.log('Fetching Sleeper registry...');
const res = await fetch('https://api.sleeper.app/v1/players/nfl');
const players: Record<string, any> = await res.json();
const nameToId: Record<string, string> = {};
for (const [id, p] of Object.entries(players)) {
  if (p.full_name) nameToId[p.full_name.toLowerCase().replace(/[.']/g, '')] = id;
}

// Players to fix/add — using name-based lookup for safety
const TARGETS = [
  // Currently in DB with WRONG IDs (wrong ID rows will be deleted, correct ones upserted)
  { name: 'Marvin Harrison Jr.',  position: 'WR', team: 'ARI', adj_value: 7500, note: '2024 #4 overall, ARI WR1, age 22' },
  { name: 'Brian Thomas Jr.',     position: 'WR', team: 'JAX', adj_value: 7200, note: '2024 JAX WR1, breakout rookie age 22' },
  { name: 'Bucky Irving',         position: 'RB', team: 'TB',  adj_value: 6200, note: 'TB starter 2024, age 23, explosive' },
  { name: 'Xavier Worthy',        position: 'WR', team: 'KC',  adj_value: 5800, note: 'KC WR, elite speed, age 22' },
  { name: 'Kaleb Johnson',        position: 'RB', team: 'PIT', adj_value: 3800, note: '2025 PIT RB, age 21' },
  // Missing players to add
  { name: 'Braelon Allen',        position: 'RB', team: 'NYJ', adj_value: 4200, note: '2024 NYJ RB, age 21' },
  { name: 'Jonathon Brooks',      position: 'RB', team: 'CAR', adj_value: 4500, note: '2024 CAR RB, ACL but dynasty upside age 22' },
  { name: 'Ricky Pearsall',       position: 'WR', team: 'SF',  adj_value: 2200, note: '2024 SF WR, age 24' },
  { name: 'Mike Evans',           position: 'WR', team: 'TB',  adj_value: 3200, note: 'TB WR1, age 32, still productive' },
  { name: 'Adonai Mitchell',      position: 'WR', team: 'IND', adj_value: 4800, note: '2024 IND WR, age 22, high ceiling' },
  { name: 'George Pickens',       position: 'WR', team: 'DAL', adj_value: 5500, note: 'DAL WR1, age 24, elite talent' },
];

// IDs currently in DB that are wrong (need to delete these)
const BAD_IDS = ['11578', '11579', '11580', '11581', '11576'];

// Step 1: Resolve correct IDs
console.log('\n=== ID Lookup ===');
const resolved: Array<typeof TARGETS[0] & { player_id: string }> = [];
for (const t of TARGETS) {
  const key = t.name.toLowerCase().replace(/[.']/g, '');
  const id = nameToId[key];
  const sleeperInfo = id ? `${players[id]?.position} ${players[id]?.team}` : '';
  console.log(`  ${t.name.padEnd(28)} → ${id ?? 'NOT FOUND'} ${sleeperInfo}`);
  if (id) resolved.push({ ...t, player_id: id });
}

// Step 2: Delete bad rows
console.log('\n=== Deleting wrong-ID rows ===');
const { error: delErr } = await supabase
  .from('player_values_canonical')
  .delete()
  .in('player_id', BAD_IDS)
  .eq('format', 'dynasty');
if (delErr) console.error('Delete error:', delErr.message);
else console.log(`  Deleted rows with IDs: ${BAD_IDS.join(', ')}`);

// Step 3: Upsert correct rows
console.log('\n=== Applying correct values ===');
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

// Step 4: Recalculate ranks
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

// Step 5: Spot check
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
