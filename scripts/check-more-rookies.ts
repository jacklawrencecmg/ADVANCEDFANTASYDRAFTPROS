/**
 * Check for missing/low 2024 rookies.
 *   npx tsx scripts/check-more-rookies.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const searches = [
  'braelon',   // Braelon Allen RB NYJ
  'brooks',    // Jonathon Brooks RB CAR
  'mitchell',  // Adonai Mitchell WR IND
  'coleman',   // Keon Coleman WR BUF
  'pearsall',  // Ricky Pearsall WR SF
  'conway',    // Trey' Quan Smith or Laiatu Latu -- Joe Milton QB, Blake Corum RB
  'corum',     // Blake Corum RB LAR
  'achane',    // De'Von Achane RB MIA
  'gibbs',     // Jahmyr Gibbs RB DET
  'evans',     // Mike Evans WR TB
  'kupp',      // Cooper Kupp WR LAR
  'kelce',     // Travis Kelce TE KC
  'waller',
];

for (const n of searches) {
  const { data } = await supabase
    .from('player_values_canonical')
    .select('player_id, player_name, position, team, adjusted_value, rank_overall')
    .ilike('player_name', '%' + n + '%')
    .eq('format', 'dynasty')
    .order('adjusted_value', { ascending: false })
    .limit(3);
  if (data && data.length > 0) {
    data.forEach(r => {
      const id = (r.player_id || '').padEnd(12);
      const pos = (r.position || '').padEnd(5);
      const name = (r.player_name || '').padEnd(28);
      console.log(`  ${id} ${pos} ${name} val=${r.adjusted_value}  #${r.rank_overall}`);
    });
  } else {
    console.log(`  *** ${n} — NOT FOUND ***`);
  }
}
