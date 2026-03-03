/**
 * Checks rankings by querying player_values_canonical directly (mirrors UnifiedRankings).
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const SF_MULT: Record<string, number> = { QB: 1.35, RB: 1.15, WR: 1.0, TE: 1.10 };
const QB1_MULT: Record<string, number> = { QB: 1.0, RB: 1.18, WR: 1.0, TE: 1.10 };

for (const pos of ['QB', 'RB', 'WR', 'TE']) {
  const { data, error } = await supabase
    .from('player_values_canonical')
    .select('player_id, player_name, position, team, base_value, updated_at')
    .eq('format', 'dynasty')
    .eq('position', pos)
    .order('base_value', { ascending: false })
    .limit(10);

  if (error) { console.error(`${pos} error:`, error.message); continue; }

  const sfMult = SF_MULT[pos] ?? 1.0;
  const qb1Mult = QB1_MULT[pos] ?? 1.0;

  console.log(`\n=== ${pos} Rankings — ${data?.length ?? 0} players (top 10) ===`);
  data?.forEach((r, i) => {
    const sf = Math.min(13500, Math.round((r.base_value || 0) * sfMult));
    const qb1 = Math.min(10000, Math.round((r.base_value || 0) * qb1Mult));
    console.log(`  ${String(i+1).padStart(2)}. ${(r.player_name||'').padEnd(24)} ${(r.team||'FA').padEnd(5)} base=${r.base_value}  SF=${sf}  1QB=${qb1}`);
  });
}
