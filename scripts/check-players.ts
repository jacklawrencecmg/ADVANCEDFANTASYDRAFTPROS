import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const names = ['swift', 'young'];
for (const n of names) {
  const { data } = await supabase
    .from('player_values_canonical')
    .select('player_id, player_name, position, team, adjusted_value, rank_overall, format')
    .ilike('player_name', '%' + n + '%')
    .order('adjusted_value', { ascending: false });
  console.log('--- ' + n + ' ---');
  data?.forEach(r => {
    const id = (r.player_id || '').padEnd(12);
    const fmt = (r.format || '').padEnd(10);
    const pos = (r.position || '').padEnd(5);
    const name = (r.player_name || '').padEnd(25);
    console.log(`  ${id} ${fmt} ${pos} ${name} val=${r.adjusted_value}  #${r.rank_overall}`);
  });
}
