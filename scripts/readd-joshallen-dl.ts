import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const now = new Date().toISOString();
const { error } = await supabase.from('player_values_canonical').insert({
  player_id: '5038',
  player_name: 'Josh Allen',
  position: 'DL',
  team: 'JAX',
  format: 'dynasty',
  base_value: 2660,
  adjusted_value: 2800,
  market_value: 2800,
  source: 'manual_fix_2026',
  updated_at: now,
});

console.log('insert error:', error?.message ?? 'none (success)');

// Verify
const { data } = await supabase
  .from('player_values_canonical')
  .select('player_id, player_name, position, adjusted_value')
  .eq('format', 'dynasty')
  .ilike('player_name', '%josh allen%');
console.log('Josh Allen rows in DB:');
data?.forEach(r => console.log(`  ${r.player_id.padEnd(20)} ${r.position}  ${r.player_name}  ${r.adjusted_value}`));
