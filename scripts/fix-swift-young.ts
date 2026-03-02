import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const now = new Date().toISOString();

const fixes = [
  // D'Andre Swift: CHI featured RB, age 26, solid 1000-yd starter
  { player_id: '6790', player_name: "D'Andre Swift", position: 'RB', team: 'CHI', adj_value: 4800 },
  // Bryce Young: #1 overall pick 2023, age 22, massive dynasty upside despite rocky start
  { player_id: '6768', player_name: 'Bryce Young', position: 'QB', team: 'CAR', adj_value: 4200 },
];

for (const f of fixes) {
  const { data, error } = await supabase
    .from('player_values_canonical')
    .update({
      player_name: f.player_name,
      position: f.position,
      team: f.team,
      base_value: Math.round(f.adj_value * 0.95),
      adjusted_value: f.adj_value,
      market_value: f.adj_value,
      source: 'manual_fix_2026',
      updated_at: now,
    })
    .eq('player_id', f.player_id)
    .eq('format', 'dynasty')
    .select('player_id');

  if (error) { console.error(`Error updating ${f.player_name}:`, error.message); }
  else if (data && data.length > 0) { console.log(`Updated ${f.player_name} → ${f.adj_value}`); }
  else { console.log(`${f.player_name} not found for update, inserting...`);
    const { error: insErr } = await supabase.from('player_values_canonical').insert({
      player_id: f.player_id, player_name: f.player_name, position: f.position,
      team: f.team, format: 'dynasty', base_value: Math.round(f.adj_value * 0.95),
      adjusted_value: f.adj_value, market_value: f.adj_value,
      source: 'manual_fix_2026', updated_at: now,
    });
    if (insErr) console.error(`Insert error:`, insErr.message);
    else console.log(`Inserted ${f.player_name} → ${f.adj_value}`);
  }
}

// Recalculate ranks
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
  console.log(`Ranks updated for ${all.length} players`);
}

// Verify
const { data: check } = await supabase
  .from('player_values_canonical')
  .select('player_name, position, adjusted_value, rank_overall')
  .eq('format', 'dynasty')
  .in('player_id', ['6790', '6768']);
check?.forEach(r => console.log(`  #${r.rank_overall}  ${(r.player_name||'').padEnd(25)} ${r.position}  ${r.adjusted_value}`));
