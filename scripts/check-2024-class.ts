/**
 * Check 2024 top draft picks for correct values.
 *   npx tsx scripts/check-2024-class.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

// Top 2024 picks to check
const searches = [
  'williams',   // Caleb Williams QB CHI
  'maye',       // Drake Maye QB NE
  'mccarthy',   // JJ McCarthy QB MIN
  'daniels',    // Jayden Daniels QB WAS
  'johnson',    // Brian Thomas Jr WR JAX, Braelon Allen RB NYJ
  'thomas',
  'allen',
  'henry',      // Jonathon Brooks, Will Campbell
  'tucker',
  'worthy',
  'sam',
  'laporte',
  'branch',
];

for (const n of searches) {
  const { data } = await supabase
    .from('player_values_canonical')
    .select('player_id, player_name, position, team, adjusted_value, rank_overall')
    .ilike('player_name', '%' + n + '%')
    .eq('format', 'dynasty')
    .order('adjusted_value', { ascending: false })
    .limit(5);
  if (data && data.length > 0) {
    console.log('--- ' + n + ' ---');
    data.forEach(r => {
      const id = (r.player_id || '').padEnd(12);
      const pos = (r.position || '').padEnd(5);
      const name = (r.player_name || '').padEnd(28);
      console.log(`  ${id} ${pos} ${name} val=${r.adjusted_value}  #${r.rank_overall}`);
    });
  }
}
