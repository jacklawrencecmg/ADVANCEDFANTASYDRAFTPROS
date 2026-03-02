/**
 * Check specific missing players
 *   npx tsx scripts/check-missing-2.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

// Find Sleeper IDs for missing players
console.log('Fetching Sleeper registry...');
const res = await fetch('https://api.sleeper.app/v1/players/nfl');
const players: Record<string, any> = await res.json();

const targets = [
  'Braelon Allen',       // RB NYJ 2024
  'Jonathon Brooks',     // RB CAR 2024 ACL
  'Ricky Pearsall',      // WR SF 2024
  'Mike Evans',          // WR TB veteran
  'Adonai Mitchell',     // WR IND 2024
  'Keon Coleman',        // WR BUF 2024 (confirm)
  'J.J. McCarthy',       // QB MIN (confirm ID)
  'Trey McBride',        // TE ARI (confirm)
  'Sam LaPorta',         // TE DET (confirm)
  'Puka Nacua',          // WR LAR
  'Tank Dell',           // WR HOU
  'Rashee Rice',         // WR KC
  'Nico Collins',        // WR HOU
  'George Pickens',      // WR PIT
  'Evan McPherson',      // there is no football player named this
];

console.log('\n=== Sleeper ID Lookup ===');
for (const t of targets) {
  const key = t.toLowerCase().replace(/[.']/g, '');
  const found = Object.entries(players).find(([, p]) =>
    p.full_name && p.full_name.toLowerCase().replace(/[.']/g, '') === key
  );
  if (found) {
    const [id, p] = found;
    console.log(`  ${t.padEnd(28)} → ${id.padEnd(8)} ${p.position} ${p.team}`);
  } else {
    console.log(`  ${t.padEnd(28)} → NOT FOUND`);
  }
}

// Check which are in DB
console.log('\n=== DB Check ===');
const checkNames = ['Braelon Allen', 'Jonathon Brooks', 'Ricky Pearsall', 'Mike Evans', 'Adonai Mitchell',
  'Puka Nacua', 'Tank Dell', 'Rashee Rice', 'Nico Collins', 'George Pickens'];

for (const n of checkNames) {
  const { data } = await supabase
    .from('player_values_canonical')
    .select('player_id, player_name, adjusted_value, rank_overall')
    .ilike('player_name', n)
    .eq('format', 'dynasty');
  if (data && data.length > 0) {
    data.forEach(r => console.log(`  FOUND  : ${(r.player_name||'').padEnd(28)} val=${r.adjusted_value} #${r.rank_overall}`));
  } else {
    console.log(`  MISSING: ${n}`);
  }
}
