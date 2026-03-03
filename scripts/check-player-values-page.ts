/**
 * Mirrors what PlayerValues page fetches and displays.
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const SF_MULT: Record<string, number> = { QB: 1.35, RB: 1.15, WR: 1.0, TE: 1.10 };
const QB1_MULT: Record<string, number> = { QB: 1.0, RB: 1.18, WR: 1.0, TE: 1.10 };

function calcSF(base: number, pos: string) { return Math.min(13500, Math.round(base * (SF_MULT[pos] ?? 1.0))); }
function calc1QB(base: number, pos: string) { return Math.min(10000, Math.round(base * (QB1_MULT[pos] ?? 1.0))); }

// Mirrors playerValuesApi.getPlayerValues(undefined, 500)
const { data, error } = await supabase
  .from('player_values_canonical')
  .select('player_id, player_name, position, team, base_value, adjusted_value, rank_overall')
  .eq('format', 'dynasty')
  .order('adjusted_value', { ascending: false })
  .limit(30);

if (error) { console.error('Error:', error.message); process.exit(1); }

console.log(`Total fetched: ${data?.length} players\n`);
console.log('=== Top 30 (dynasty, SF format) ===');
console.log('  Rank  Player                   Pos  Team   Base    SF      1QB');
console.log('  ----  -----------------------  ---  -----  ------  ------  ------');
data?.forEach((r, i) => {
  const sf = calcSF(r.base_value || 0, r.position || '');
  const qb1 = calc1QB(r.base_value || 0, r.position || '');
  console.log(
    `  ${String(i+1).padStart(4)}  ${(r.player_name||'').padEnd(23)}  ${(r.position||'').padEnd(3)}  ${(r.team||'FA').padEnd(5)}  ${String(r.base_value||0).padStart(6)}  ${String(sf).padStart(6)}  ${String(qb1).padStart(6)}`
  );
});

// Check for any zero/null base_values
const { data: zeroes } = await supabase
  .from('player_values_canonical')
  .select('player_id, player_name, position, base_value')
  .eq('format', 'dynasty')
  .or('base_value.is.null,base_value.eq.0')
  .limit(20);

if (zeroes && zeroes.length > 0) {
  console.log(`\n⚠️  Players with zero/null base_value: ${zeroes.length}`);
  zeroes.forEach(r => console.log(`  ${r.player_id} ${r.player_name} (${r.position})`));
} else {
  console.log('\n✓ No players with zero/null base_value');
}
