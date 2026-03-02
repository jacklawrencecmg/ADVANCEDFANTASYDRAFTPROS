/**
 * Fix outlier values using correct Sleeper IDs (verified from registry).
 *   npx tsx scripts/fix-outliers-v2.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const now = new Date().toISOString();

// IDs verified against Sleeper registry in check-damage.ts
const FIXES = [
  { player_id: '4866', name: 'Saquon Barkley',  position: 'RB', team: 'PHI', adj_value: 7000 },
  { player_id: '6804', name: 'Jordan Love',      position: 'QB', team: 'GB',  adj_value: 5800 },
  { player_id: '7526', name: 'Jaylen Waddle',    position: 'WR', team: 'MIA', adj_value: 5200 },
  { player_id: '7523', name: 'Trevor Lawrence',  position: 'QB', team: 'JAX', adj_value: 4800 },
  { player_id: '5967', name: 'Tony Pollard',     position: 'RB', team: 'TEN', adj_value: 2500 },
  { player_id: '1166', name: 'Kirk Cousins',     position: 'QB', team: 'ATL', adj_value: 1500 },
];

// Bad rows inserted with wrong IDs — delete these first
const BAD_IDS = ['7564', '7572', '7547', '3197'];

async function main() {
  // 1. Delete bad rows
  console.log('Deleting bad rows with wrong IDs:', BAD_IDS);
  const { error: delErr } = await supabase
    .from('player_values_canonical')
    .delete()
    .in('player_id', BAD_IDS)
    .eq('format', 'dynasty');
  if (delErr) console.error('Delete error:', delErr.message);
  else console.log('  Deleted OK');

  // 2. Upsert correct rows using UPDATE → INSERT pattern
  console.log('\nApplying correct values:');
  let updated = 0, inserted = 0, failed = 0;

  for (const f of FIXES) {
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

    if (updErr) { console.error(`  UPDATE error for ${f.name}:`, updErr.message); failed++; continue; }

    if (upd && upd.length > 0) {
      console.log(`  Updated : ${f.name.padEnd(28)} ${f.player_id}  → ${f.adj_value}`);
      updated++;
    } else {
      const { error: insErr } = await supabase
        .from('player_values_canonical')
        .insert({ player_id: f.player_id, format: 'dynasty', ...row });
      if (insErr) { console.error(`  INSERT error for ${f.name}:`, insErr.message); failed++; }
      else { console.log(`  Inserted: ${f.name.padEnd(28)} ${f.player_id}  → ${f.adj_value}`); inserted++; }
    }
  }
  console.log(`\n  Updated: ${updated}, Inserted: ${inserted}, Failed: ${failed}`);

  // 3. Recalculate ranks
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

  // 4. Spot check
  console.log('\n=== Final spot check ===');
  const { data: check } = await supabase
    .from('player_values_canonical')
    .select('player_name, position, team, adjusted_value, rank_overall')
    .eq('format', 'dynasty')
    .in('player_id', FIXES.map(f => f.player_id))
    .order('adjusted_value', { ascending: false });
  check?.forEach(r => {
    console.log(`  #${String(r.rank_overall ?? '?').padStart(3)}  ${(r.player_name||'').padEnd(28)} ${(r.position||'').padEnd(4)} ${(r.team||'').padEnd(5)} ${r.adjusted_value}`);
  });

  // Verify Chase is untouched
  const { data: chase } = await supabase
    .from('player_values_canonical')
    .select('player_name, adjusted_value, rank_overall')
    .eq('player_id', '9508')
    .eq('format', 'dynasty')
    .single();
  console.log(`\n  Ja'Marr Chase check: val=${chase?.adjusted_value} rank=#${chase?.rank_overall} ✓`);

  console.log('\n✓ Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
