import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

for (const pos of ['QB', 'RB', 'WR', 'TE']) {
  const { data } = await supabase
    .from('player_values_canonical')
    .select('player_id, player_name, team, adjusted_value, rank_overall')
    .eq('format', 'dynasty')
    .eq('position', pos)
    .order('adjusted_value', { ascending: false })
    .limit(40);
  console.log('\n=== ' + pos + ' ===');
  data?.forEach(r => {
    const rank = String(r.rank_overall ?? '?').padStart(3);
    const name = (r.player_name || '').padEnd(28);
    const team = (r.team || '??').padEnd(5);
    console.log(`  #${rank}  ${name} ${team} ${r.adjusted_value}`);
  });
}
