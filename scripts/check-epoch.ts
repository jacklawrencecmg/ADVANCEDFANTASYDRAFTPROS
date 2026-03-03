/**
 * Check epoch situation for Swift/Young rows.
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

// Check if value_epoch_id column exists and what value it has for Swift/Young
const { data: rows } = await supabase
  .from('player_values_canonical')
  .select('*')
  .or("player_name.ilike.D'Andre Swift,player_name.ilike.Bryce Young")
  .eq('format', 'dynasty');
console.log('=== Full rows (all columns) ===');
rows?.forEach(r => console.log(JSON.stringify(r, null, 2)));

// Check active epoch
const { data: epochs } = await supabase
  .from('value_epochs')
  .select('id, status, epoch_number, trigger_reason')
  .order('epoch_number', { ascending: false })
  .limit(5);
console.log('\n=== Recent epochs ===');
epochs?.forEach(e => console.log(`  ${e.id} status=${e.status} epoch=${e.epoch_number} reason=${e.trigger_reason}`));

// Try querying latest_player_values view directly for these players
const { data: latestSwift } = await supabase
  .from('latest_player_values')
  .select('player_id, player_name, adjusted_value, base_value, format')
  .ilike('player_name', '%swift%');
const { data: latestYoung } = await supabase
  .from('latest_player_values')
  .select('player_id, player_name, adjusted_value, base_value, format')
  .ilike('player_name', '%bryce young%');
console.log('\n=== latest_player_values for Swift ===');
latestSwift?.forEach(r => console.log(`  ${r.player_id} ${r.player_name} adj=${r.adjusted_value} base=${r.base_value}`));
console.log('\n=== latest_player_values for Young ===');
latestYoung?.forEach(r => console.log(`  ${r.player_id} ${r.player_name} adj=${r.adjusted_value} base=${r.base_value}`));
