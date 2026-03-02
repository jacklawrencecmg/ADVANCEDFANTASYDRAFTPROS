/**
 * Fix 2025 rookie class — correct wrong IDs, add missing players.
 *   npx tsx scripts/fix-2025-class.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const now = new Date().toISOString();

// Bad IDs in DB that need to be deleted before re-inserting with correct IDs
const BAD_IDS = [
  '11562', // Cam Ward (wrong)
  '11563', // Shedeur Sanders (wrong)
  '11573', // Omarion Hampton (wrong)
  '11574', // TreVeyon Henderson (wrong)
  '11575', // Quinshon Judkins (wrong)
  '11582', // Colston Loveland (wrong)
];

// All 2025 rookies with verified Sleeper IDs + dynasty values
const ROOKIES = [
  // QBs
  { player_id: '12522', name: 'Cam Ward',           position: 'QB', team: 'TEN', adj_value: 6200, note: '#1 overall 2025, TEN, age 22' },
  { player_id: '12524', name: 'Shedeur Sanders',    position: 'QB', team: 'CLE', adj_value: 4500, note: '#2 overall 2025, CLE, age 22' },
  { player_id: '12486', name: 'Dillon Gabriel',     position: 'QB', team: 'CLE', adj_value: 1800, note: 'CLE backup QB, age 24' },
  { player_id: '12508', name: 'Jaxson Dart',        position: 'QB', team: 'NYG', adj_value: 3000, note: 'NYG QB 2025, age 22' },
  // RBs
  { player_id: '12527', name: 'Ashton Jeanty',      position: 'RB', team: 'LV',  adj_value: 7500, note: '#6 overall 2025, elite prospect age 21' },
  { player_id: '12507', name: 'Omarion Hampton',    position: 'RB', team: 'LAC', adj_value: 6800, note: 'top-10 pick 2025, LAC, age 21' },
  { player_id: '12481', name: 'Cam Skattebo',       position: 'RB', team: 'NYG', adj_value: 3800, note: 'NYG RB 2025, age 22' },
  { player_id: '12512', name: 'Quinshon Judkins',   position: 'RB', team: 'CLE', adj_value: 4800, note: '2025 top-15 RB pick, age 21' },
  { player_id: '12489', name: 'RJ Harvey',          position: 'RB', team: 'DEN', adj_value: 4800, note: 'DEN RB 2025, age 22' },
  { player_id: '12529', name: 'TreVeyon Henderson', position: 'RB', team: 'NE',  adj_value: 5000, note: 'NE RB 2025, 2nd round, age 22' },
  { player_id: '12490', name: 'Bhayshul Tuten',     position: 'RB', team: 'JAX', adj_value: 2000, note: 'JAX RB 2025, 3rd round, age 23' },
  { player_id: '12462', name: 'Damien Martinez',    position: 'RB', team: 'MIA', adj_value: 2200, note: 'MIA RB 2025, 3rd round, age 22' },
  { player_id: '12469', name: 'Dylan Sampson',      position: 'RB', team: 'TEN', adj_value: 1200, note: 'TEN RB 2025, late round, age 22' },
  // WRs
  { player_id: '12526', name: 'Tetairoa McMillan',  position: 'WR', team: 'CAR', adj_value: 5800, note: '#8 overall 2025, CAR WR, age 21' },
  { player_id: '12514', name: 'Emeka Egbuka',       position: 'WR', team: 'TB',  adj_value: 5200, note: 'TB WR 2025, top-15 pick, age 22' },
  { player_id: '12519', name: 'Luther Burden III',  position: 'WR', team: 'CHI', adj_value: 4500, note: 'CHI WR 2025, 2nd round, elite talent age 21' },
  { player_id: '12501', name: 'Matthew Golden',     position: 'WR', team: 'GB',  adj_value: 4000, note: 'GB WR 2025, 1st round, age 21' },
  { player_id: '12484', name: 'Jayden Higgins',     position: 'WR', team: 'HOU', adj_value: 3000, note: 'HOU WR 2025, 2nd round, age 22' },
  { player_id: '12482', name: 'Savion Williams',    position: 'WR', team: 'GB',  adj_value: 1000, note: 'GB WR 2025, late round, age 22' },
  { player_id: '12536', name: 'Jaylin Noel',        position: 'WR', team: 'HOU', adj_value: 1800, note: 'HOU WR 2025, 3rd round, age 22' },
  { player_id: '12485', name: 'Tez Johnson',        position: 'WR', team: 'DET', adj_value: 1500, note: 'DET WR 2025, late round, age 22' },
  // TEs
  { player_id: '12518', name: 'Tyler Warren',       position: 'TE', team: 'IND', adj_value: 5800, note: '#14 overall 2025, IND TE, age 22' },
  { player_id: '12517', name: 'Colston Loveland',   position: 'TE', team: 'CHI', adj_value: 5500, note: '1st round 2025, CHI TE, age 22' },
  { player_id: '12506', name: 'Harold Fannin Jr.',  position: 'TE', team: 'CLE', adj_value: 4000, note: 'CLE TE 2025, 2nd round, age 21' },
  { player_id: '12498', name: 'Mason Taylor',       position: 'TE', team: 'NYJ', adj_value: 3000, note: 'NYJ TE 2025, 2nd round, age 21' },
  { player_id: '12521', name: 'Elijah Arroyo',      position: 'TE', team: 'SEA', adj_value: 2200, note: 'SEA TE 2025, 3rd round, age 22' },
];

// Step 1: Delete bad rows
console.log('Deleting wrong-ID rows:', BAD_IDS.join(', '));
const { error: delErr } = await supabase
  .from('player_values_canonical')
  .delete()
  .in('player_id', BAD_IDS)
  .eq('format', 'dynasty');
if (delErr) console.error('Delete error:', delErr.message);
else console.log('  Deleted OK');

// Step 2: Upsert all rookies
console.log('\n=== Applying 2025 rookie values ===');
let updated = 0, inserted = 0, failed = 0;

for (const f of ROOKIES) {
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
    console.log(`  Updated : ${f.name.padEnd(28)} ${f.player_id}  → ${f.adj_value}`);
    updated++;
  } else {
    const { error: insErr } = await supabase
      .from('player_values_canonical')
      .insert({ player_id: f.player_id, format: 'dynasty', ...row });
    if (insErr) { console.error(`  INSERT error ${f.name}:`, insErr.message); failed++; }
    else { console.log(`  Inserted: ${f.name.padEnd(28)} ${f.player_id}  → ${f.adj_value}`); inserted++; }
  }
}
console.log(`\n  Updated: ${updated}, Inserted: ${inserted}, Failed: ${failed}`);

// Step 3: Recalculate ranks
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

// Step 4: Spot check by position
for (const pos of ['QB', 'RB', 'WR', 'TE']) {
  const rookiesInPos = ROOKIES.filter(r => r.position === pos);
  const { data: check } = await supabase
    .from('player_values_canonical')
    .select('player_name, position, team, adjusted_value, rank_overall')
    .eq('format', 'dynasty')
    .in('player_id', rookiesInPos.map(r => r.player_id))
    .order('adjusted_value', { ascending: false });
  console.log(`\n=== 2025 ${pos}s ===`);
  check?.forEach(r => {
    console.log(`  #${String(r.rank_overall ?? '?').padStart(3)}  ${(r.player_name||'').padEnd(28)} ${(r.team||'').padEnd(5)} ${r.adjusted_value}`);
  });
}

console.log('\n✓ Done.');
