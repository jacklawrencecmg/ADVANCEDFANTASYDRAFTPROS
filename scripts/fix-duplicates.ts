/**
 * Find and remove duplicate player rows in player_values_canonical.
 *   npx tsx scripts/fix-duplicates.ts
 *
 * Strategy: group by (player_name, format), keep the row with the highest
 * adjusted_value, delete the rest.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function main() {
  const { data: all, error } = await supabase
    .from('player_values_canonical')
    .select('player_id, player_name, position, adjusted_value, format')
    .eq('format', 'dynasty')
    .order('adjusted_value', { ascending: false });

  if (error || !all) { console.error('Fetch error:', error?.message); process.exit(1); }

  // Group by player_name (case-insensitive)
  const byName = new Map<string, typeof all>();
  for (const row of all) {
    const key = (row.player_name || '').toLowerCase().trim();
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key)!.push(row);
  }

  const toDelete: string[] = [];
  const dupes: Array<{ name: string; kept: string; removed: string[]; }> = [];

  for (const [, rows] of byName) {
    if (rows.length <= 1) continue;
    // rows are already sorted desc by adjusted_value — keep first, delete rest
    const [keep, ...rest] = rows;
    const removed = rest.map(r => r.player_id);
    toDelete.push(...removed);
    dupes.push({
      name: keep.player_name || '',
      kept: `${keep.player_id} (${keep.position} val=${keep.adjusted_value})`,
      removed: rest.map(r => `${r.player_id} (${r.position} val=${r.adjusted_value})`),
    });
  }

  if (toDelete.length === 0) {
    console.log('No duplicates found.');
    return;
  }

  console.log(`Found ${dupes.length} duplicated names → ${toDelete.length} rows to remove:\n`);
  for (const d of dupes) {
    console.log(`  ${d.name}`);
    console.log(`    keep:   ${d.kept}`);
    for (const r of d.removed) console.log(`    delete: ${r}`);
  }

  // Delete in batches
  let deleted = 0;
  for (let i = 0; i < toDelete.length; i += 50) {
    const batch = toDelete.slice(i, i + 50);
    const { error: delErr } = await supabase
      .from('player_values_canonical')
      .delete()
      .in('player_id', batch)
      .eq('format', 'dynasty');
    if (delErr) { console.error('Delete error:', delErr.message); }
    else deleted += batch.length;
  }

  console.log(`\nDeleted ${deleted} duplicate rows.`);

  // Recalculate ranks
  console.log('Recalculating overall ranks...');
  const { data: ranked } = await supabase
    .from('player_values_canonical')
    .select('player_id, adjusted_value')
    .eq('format', 'dynasty')
    .order('adjusted_value', { ascending: false });

  if (ranked) {
    for (let i = 0; i < ranked.length; i += 50) {
      const batch = ranked.slice(i, i + 50);
      for (const { player_id, rank_overall } of batch.map((r, j) => ({ player_id: r.player_id, rank_overall: i + j + 1 }))) {
        await supabase
          .from('player_values_canonical')
          .update({ rank_overall })
          .eq('player_id', player_id)
          .eq('format', 'dynasty');
      }
    }
    console.log(`Updated ranks for ${ranked.length} players.`);
  }

  console.log('\n✓ Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
