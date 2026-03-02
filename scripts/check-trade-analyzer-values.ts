/**
 * Simulate what values the Trade Analyzer would display.
 * base_value × format multipliers = displayed value.
 *   npx tsx scripts/check-trade-analyzer-values.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

// Same multipliers as src/lib/fdp/formatMultipliers.ts
const SF_MULT: Record<string, number> = { QB: 1.35, RB: 1.15, WR: 1.0, TE: 1.10 };

const { data } = await supabase
  .from('player_values_canonical')
  .select('player_name, position, team, base_value, adjusted_value, rank_overall')
  .eq('format', 'dynasty')
  .order('adjusted_value', { ascending: false })
  .limit(40);

console.log('=== Trade Analyzer values (dynasty_sf) vs Rankings ===');
console.log('  Name                          Pos  Rank  Rankings  TradeAnalyzer');
data?.forEach(r => {
  const mult = SF_MULT[r.position] ?? 1.0;
  const base = r.base_value || 0;
  const tradeVal = Math.min(13500, Math.round(base * mult));
  const rankVal = r.adjusted_value || 0;
  const flag = Math.abs(tradeVal - rankVal) > 1000 ? ' ← BIG DIFF' : '';
  console.log(`  ${(r.player_name||'').padEnd(28)} ${(r.position||'').padEnd(5)}${String(r.rank_overall||'?').padStart(4)}  ${String(rankVal).padStart(6)}    ${String(tradeVal).padStart(6)}${flag}`);
});
