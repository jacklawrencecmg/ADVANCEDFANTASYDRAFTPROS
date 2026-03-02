/**
 * Adjust 2025 rookie values to end-of-season levels.
 * Risers = players who proved themselves; busts/backups adjusted down.
 *   npx tsx scripts/fix-2025-eoy-values.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const now = new Date().toISOString();

// End-of-2025-season dynasty values
// Risers: elite rookies who lived up to draft capital + proved it on the field
// Adjustments down: backup/limited-role players
const UPDATES = [
  // === RBs ===
  { player_id: '12527', name: 'Ashton Jeanty',      adj_value: 8500, note: 'Best rookie 2025, LV featured back, elite dynasty at age 22' },
  { player_id: '12507', name: 'Omarion Hampton',    adj_value: 7200, note: 'LAC RB1, strong year as starter, age 22' },
  { player_id: '12529', name: 'TreVeyon Henderson', adj_value: 4500, note: 'NE backfield competition, limited year 1 role' },
  { player_id: '12481', name: 'Cam Skattebo',       adj_value: 3000, note: 'NYG backup in year 1, limited role' },
  // === WRs ===
  { player_id: '12526', name: 'Tetairoa McMillan',  adj_value: 7200, note: 'CAR WR1 immediately, elite age-21 prospect proved worthy' },
  { player_id: '12514', name: 'Emeka Egbuka',       adj_value: 5500, note: 'TB WR, solid year alongside Evans/Godwin' },
  { player_id: '12519', name: 'Luther Burden III',  adj_value: 5000, note: 'CHI slot, strong year 1, age 22 ceiling' },
  { player_id: '12501', name: 'Matthew Golden',     adj_value: 4500, note: 'GB WR, showed promise in year 1, age 22' },
  // === TEs ===
  { player_id: '12518', name: 'Tyler Warren',       adj_value: 7200, note: 'IND TE1, dominant rookie year, top TE dynasty asset' },
  { player_id: '12517', name: 'Colston Loveland',   adj_value: 5800, note: 'CHI TE, solid year 1 with Williams at QB' },
  { player_id: '12506', name: 'Harold Fannin Jr.',  adj_value: 5000, note: 'CLE TE, best receiving TE in class, proved it in NFL' },
  { player_id: '12498', name: 'Mason Taylor',       adj_value: 3200, note: 'NYJ TE, limited role year 1 but upside remains' },
  // === QBs ===
  { player_id: '12522', name: 'Cam Ward',           adj_value: 6500, note: 'TEN #1 overall, solid year 1, age 22 upside' },
  { player_id: '12524', name: 'Shedeur Sanders',    adj_value: 4500, note: 'CLE QB, showed accuracy/IQ, building dynasty case' },
];

console.log('=== Applying end-of-2025-season value adjustments ===\n');
let updated = 0, failed = 0;

for (const f of UPDATES) {
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
  else { console.log(`  NOT FOUND: ${f.name} (${f.player_id})`); }
}
console.log(`\n  Updated: ${updated}, Failed: ${failed}`);

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

// Final spot check
console.log('\n=== 2025 Rookie EOY Rankings ===');
const allRookieIds = [
  '12522','12524','12486','12508',
  '12527','12507','12481','12512','12489','12529','12490','12462','12469',
  '12526','12514','12519','12501','12484','12482','12536','12485',
  '12518','12517','12506','12498','12521',
];
const { data: check } = await supabase
  .from('player_values_canonical')
  .select('player_name, position, team, adjusted_value, rank_overall')
  .eq('format', 'dynasty')
  .in('player_id', allRookieIds)
  .order('adjusted_value', { ascending: false });
check?.forEach(r => {
  console.log(`  #${String(r.rank_overall ?? '?').padStart(3)}  ${(r.player_name||'').padEnd(28)} ${(r.position||'').padEnd(4)} ${(r.team||'').padEnd(5)} ${r.adjusted_value}`);
});

console.log('\n✓ Done.');
