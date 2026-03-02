import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const { data } = await supabase
  .from('player_values_canonical')
  .select('player_name, position, adjusted_value, rank_overall')
  .eq('format', 'dynasty')
  .not('position', 'in', '(QB,RB,WR,TE)')
  .order('adjusted_value', { ascending: false });

console.log('Defensive players in DB:', data?.length ?? 0);
data?.forEach(r => {
  console.log(`  ${(r.player_name || '').padEnd(28)} ${r.position}  ${r.adjusted_value}  #${r.rank_overall}`);
});
