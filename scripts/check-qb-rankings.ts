import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const { data } = await supabase
  .from('player_values_canonical')
  .select('player_id, player_name, position, team, adjusted_value, base_value, rank_overall')
  .eq('format', 'dynasty')
  .eq('position', 'QB')
  .order('adjusted_value', { ascending: false })
  .limit(30);

console.log('=== QB Dynasty Rankings (top 30) ===');
data?.forEach((r, i) => {
  const sfVal = Math.min(13500, Math.round(r.base_value * 1.35));
  const qb1Val = r.base_value;
  console.log(`  ${String(i+1).padStart(2)}. ${(r.player_name||'').padEnd(24)} base=${String(r.base_value).padStart(5)}  SF=${sfVal}  1QB=${qb1Val}  rank=#${r.rank_overall}`);
});
console.log(`\nTotal QBs: ${data?.length}`);
