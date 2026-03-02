/**
 * Check current player values in DB
 *   npx tsx scripts/check-values.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

const SPOT_NAMES = [
  'Patrick Mahomes', 'Josh Allen', 'Jalen Hurts', 'Lamar Jackson',
  'Joe Burrow', 'Drake Maye', 'Cam Ward', 'Jared Goff',
  'Baker Mayfield', 'Sam Darnold', 'Michael Penix',
  'CeeDee Lamb', "Ja'Marr Chase", 'Justin Jefferson',
  'AJ Brown', 'Davante Adams', 'Tee Higgins', 'Brian Thomas',
  'Tetairoa McMillan', 'Emeka Egbuka', 'Keon Coleman',
  'Terry McLaurin', 'Courtland Sutton', 'Christian Watson',
  'Christian McCaffrey', 'Bijan Robinson', "De'Von Achane",
  'James Cook', 'Chase Brown', 'Travis Etienne',
  'Quinshon Judkins', 'RJ Harvey', 'Cam Skattebo',
  'George Kittle', 'Sam LaPorta', 'Kyle Pitts',
  'Tyler Warren', 'Colston Loveland', 'Tucker Kraft', 'Dalton Kincaid',
];

async function main() {
  // Top 50 overall
  const { data: top50 } = await supabase
    .from('player_values_canonical')
    .select('player_name, position, adjusted_value, rank_overall, updated_at, format')
    .eq('format', 'dynasty')
    .order('adjusted_value', { ascending: false })
    .limit(50);

  const lastUpdate = top50?.[0]?.updated_at;
  console.log(`\nLast update: ${lastUpdate ? new Date(lastUpdate).toLocaleString() : 'unknown'}\n`);

  console.log('=== Top 50 Overall (dynasty) ===');
  top50?.forEach(r => {
    console.log(`  #${String(r.rank_overall ?? '?').padStart(3)}  ${(r.player_name ?? '').padEnd(26)}  ${r.position}  ${r.adjusted_value}`);
  });

  // Spot-check named players
  console.log('\n=== Spot Check ===');
  for (const name of SPOT_NAMES) {
    const last = name.split(' ').pop()!.toLowerCase();
    const first = name.split(' ')[0].toLowerCase();
    const { data } = await supabase
      .from('player_values_canonical')
      .select('player_name, position, adjusted_value, rank_overall')
      .eq('format', 'dynasty')
      .ilike('player_name', `%${last}%`)
      .order('adjusted_value', { ascending: false })
      .limit(3);
    const match = data?.find(r => (r.player_name ?? '').toLowerCase().includes(first));
    if (match) {
      console.log(`  #${String(match.rank_overall ?? '?').padStart(3)}  ${(match.player_name ?? '').padEnd(26)}  ${match.position}  ${match.adjusted_value}`);
    } else {
      console.log(`  ???  ${name.padEnd(26)}  NOT FOUND`);
    }
  }
}

main().catch(console.error);
