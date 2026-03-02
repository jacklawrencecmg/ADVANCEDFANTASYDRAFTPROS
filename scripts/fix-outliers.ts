/**
 * Fix value outliers identified in audit.
 *   npx tsx scripts/fix-outliers.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const FIXES = [
  // Saquon Barkley: led NFL in rushing 2024, Super Bowl, age 27 — 4500 is way too low
  { player_id: '4866', name: 'Saquon Barkley',   position: 'RB', team: 'PHI', adj_value: 7000, note: '2024 NFL rushing leader, SB champ, age 27' },
  // Jordan Love: age 26 GB starter, came off injury — 4500 too low for young starter
  { player_id: '7572', name: 'Jordan Love',       position: 'QB', team: 'GB',  adj_value: 5800, note: 'GB starter, age 26, strong upside' },
  // Jaylen Waddle: age 26, MIA WR1, 3500 too low
  { player_id: '7564', name: 'Jaylen Waddle',     position: 'WR', team: 'MIA', adj_value: 5200, note: 'MIA WR1, age 26, elite speed' },
  // Trevor Lawrence: #1 overall pick 2021, age 25, JAX struggles but young talent
  { player_id: '7526', name: 'Trevor Lawrence',   position: 'QB', team: 'JAX', adj_value: 4800, note: '#1 overall 2021, age 25, dynasty upside' },
  // Tony Pollard: featured starter at 27, 1500 too low
  { player_id: '7547', name: 'Tony Pollard',      position: 'RB', team: 'TEN', adj_value: 2500, note: 'TEN featured back, age 27' },
  // Kirk Cousins: ATL starter, age 36 — 500 is too low even for veteran
  { player_id: '3197', name: 'Kirk Cousins',      position: 'QB', team: 'ATL', adj_value: 1500, note: 'ATL starter, limited dynasty value at 36' },
];

// Lookup any player_ids we're not sure about via Sleeper name search
async function findId(name: string): Promise<string | null> {
  const res = await fetch('https://api.sleeper.app/v1/players/nfl');
  const players: Record<string, any> = await res.json();
  const target = name.toLowerCase().replace(/[.']/g, '');
  for (const [id, p] of Object.entries(players)) {
    if (!p.full_name) continue;
    if (p.full_name.toLowerCase().replace(/[.']/g, '') === target) return id;
  }
  return null;
}

async function main() {
  const now = new Date().toISOString();

  console.log('Fetching Sleeper registry to verify IDs...');
  const res = await fetch('https://api.sleeper.app/v1/players/nfl');
  const players: Record<string, any> = await res.json();

  // Verify each player_id maps to the right name
  console.log('\n=== ID Verification ===');
  for (const f of FIXES) {
    const p = players[f.player_id];
    const found = p?.full_name ?? 'NOT FOUND';
    console.log(`  ${f.player_id.padEnd(10)} ${found.padEnd(28)} → target: ${f.name}`);
  }

  console.log('\n=== Applying fixes ===');
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
      console.log(`  Updated: ${f.name.padEnd(28)} → ${f.adj_value}`);
      updated++;
    } else {
      const { error: insErr } = await supabase
        .from('player_values_canonical')
        .insert({ player_id: f.player_id, format: 'dynasty', ...row });
      if (insErr) { console.error(`  INSERT error for ${f.name}:`, insErr.message); failed++; }
      else { console.log(`  Inserted: ${f.name.padEnd(28)} → ${f.adj_value}`); inserted++; }
    }
  }

  console.log(`\n  Updated: ${updated}, Inserted: ${inserted}, Failed: ${failed}`);

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

  // Spot check
  console.log('\n=== Final spot check ===');
  const ids = FIXES.map(f => f.player_id);
  const { data: check } = await supabase
    .from('player_values_canonical')
    .select('player_name, position, team, adjusted_value, rank_overall')
    .eq('format', 'dynasty')
    .in('player_id', ids)
    .order('adjusted_value', { ascending: false });
  check?.forEach(r => {
    console.log(`  #${String(r.rank_overall ?? '?').padStart(3)}  ${(r.player_name||'').padEnd(28)} ${(r.position||'').padEnd(4)} ${(r.team||'').padEnd(5)} ${r.adjusted_value}`);
  });

  console.log('\n✓ Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
