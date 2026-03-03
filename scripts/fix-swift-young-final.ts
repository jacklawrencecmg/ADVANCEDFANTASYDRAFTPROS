/**
 * Final fix for D'Andre Swift and Bryce Young.
 * - Sets base_value = adjusted_value (migration format, avoids multiplier confusion)
 * - Fixes Bryce Young to use correct Sleeper ID 9228
 * - Verifies via full read-back
 *   npx tsx scripts/fix-swift-young-final.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const now = new Date().toISOString();

// Step 1: Delete wrong-ID rows for Bryce Young (6768 = Tua Tagovailoa in Sleeper)
// and any duplicate Swift rows
console.log('Step 1: Deleting wrong-ID Bryce Young row (6768)...');
const { error: delErr } = await supabase
  .from('player_values_canonical')
  .delete()
  .eq('player_id', '6768')
  .eq('format', 'dynasty');
if (delErr) console.error('  Delete error:', delErr.message);
else console.log('  Deleted OK (or nothing to delete)');

// Step 2: Upsert D'Andre Swift with correct values
// base_value = adjusted_value (same pattern as migration SQL, avoids multiplier issues)
console.log('\nStep 2: Setting D\'Andre Swift (6790)...');
const swiftRow = {
  player_name: "D'Andre Swift",
  position: 'RB',
  team: 'CHI',
  base_value: 4800,
  adjusted_value: 4800,
  market_value: 4800,
  source: 'manual_fix_2026',
  updated_at: now,
};

const { data: swiftUpd, error: swiftUpdErr } = await supabase
  .from('player_values_canonical')
  .update(swiftRow)
  .eq('player_id', '6790')
  .eq('format', 'dynasty')
  .select('player_id');

if (swiftUpdErr) { console.error('  Update error:', swiftUpdErr.message); }
else if (swiftUpd && swiftUpd.length > 0) { console.log('  Updated Swift OK'); }
else {
  // Insert if not exists
  const { error: insErr } = await supabase
    .from('player_values_canonical')
    .insert({ player_id: '6790', format: 'dynasty', ...swiftRow });
  if (insErr) console.error('  Insert error:', insErr.message);
  else console.log('  Inserted Swift OK');
}

// Step 3: Insert Bryce Young with CORRECT Sleeper ID 9228
console.log('\nStep 3: Setting Bryce Young (9228 = correct Sleeper ID)...');
const youngRow = {
  player_name: 'Bryce Young',
  position: 'QB',
  team: 'CAR',
  base_value: 4200,
  adjusted_value: 4200,
  market_value: 4200,
  source: 'manual_fix_2026',
  updated_at: now,
};

const { data: youngUpd, error: youngUpdErr } = await supabase
  .from('player_values_canonical')
  .update(youngRow)
  .eq('player_id', '9228')
  .eq('format', 'dynasty')
  .select('player_id');

if (youngUpdErr) { console.error('  Update error:', youngUpdErr.message); }
else if (youngUpd && youngUpd.length > 0) { console.log('  Updated Young OK'); }
else {
  const { error: insErr } = await supabase
    .from('player_values_canonical')
    .insert({ player_id: '9228', format: 'dynasty', ...youngRow });
  if (insErr) console.error('  Insert error:', insErr.message);
  else console.log('  Inserted Young OK');
}

// Step 4: Recalculate ranks
console.log('\nStep 4: Recalculating ranks...');
const { data: all } = await supabase
  .from('player_values_canonical')
  .select('player_id, adjusted_value')
  .eq('format', 'dynasty')
  .order('adjusted_value', { ascending: false });
if (all) {
  for (let i = 0; i < all.length; i += 50) {
    const batch = all.slice(i, i + 50);
    for (let j = 0; j < batch.length; j++) {
      await supabase.from('player_values_canonical')
        .update({ rank_overall: i + j + 1 })
        .eq('player_id', batch[j].player_id)
        .eq('format', 'dynasty');
    }
  }
  console.log(`  Ranks updated for ${all.length} players`);
}

// Step 5: Verify
console.log('\n=== Verification ===');
const { data: verify } = await supabase
  .from('player_values_canonical')
  .select('player_id, player_name, position, team, adjusted_value, base_value, rank_overall')
  .in('player_id', ['6790', '9228', '6768'])
  .eq('format', 'dynasty');
verify?.forEach(r => {
  console.log(`  ${(r.player_id||'').padEnd(8)} ${(r.player_name||'').padEnd(22)} adj=${r.adjusted_value} base=${r.base_value} rank=#${r.rank_overall}`);
});

// Check what app would compute
const SF_MULT: Record<string, number> = { QB: 1.35, RB: 1.15, WR: 1.0, TE: 1.10 };
console.log('\n=== What app displays (dynasty_sf) ===');
for (const r of verify || []) {
  const mult = SF_MULT[r.position] ?? 1.0;
  const displayed = Math.min(13500, Math.round(r.base_value * mult));
  console.log(`  ${(r.player_name||'').padEnd(22)} base=${r.base_value} × ${mult} = ${displayed}`);
}
console.log('\n=== What app displays (dynasty_1qb) ===');
const QB1_MULT: Record<string, number> = { QB: 1.0, RB: 1.18, WR: 1.0, TE: 1.10 };
for (const r of verify || []) {
  const mult = QB1_MULT[r.position] ?? 1.0;
  const displayed = Math.min(13500, Math.round(r.base_value * mult));
  console.log(`  ${(r.player_name||'').padEnd(22)} base=${r.base_value} × ${mult} = ${displayed}`);
}

console.log('\n✓ Done.');
