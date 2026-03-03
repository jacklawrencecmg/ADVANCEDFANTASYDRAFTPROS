/**
 * Check Sleeper IDs vs DB IDs for problem players.
 *   npx tsx scripts/check-id-mismatch.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

console.log('Fetching Sleeper registry...');
const res = await fetch('https://api.sleeper.app/v1/players/nfl');
const players: Record<string, any> = await res.json();

const targets = ["D'Andre Swift", 'Bryce Young'];

console.log('\n=== Sleeper registry lookup ===');
for (const t of targets) {
  const key = t.toLowerCase().replace(/[.']/g, '');
  const found = Object.entries(players).find(([, p]) =>
    p.full_name && p.full_name.toLowerCase().replace(/[.']/g, '') === key
  );
  if (found) {
    const [id, p] = found;
    console.log(`  ${t.padEnd(25)} Sleeper ID: ${id}  pos=${p.position} team=${p.team}`);
  } else {
    console.log(`  ${t.padEnd(25)} NOT FOUND in Sleeper`);
  }
}

console.log('\n=== DB rows ===');
const { data } = await supabase
  .from('player_values_canonical')
  .select('player_id, player_name, adjusted_value, format')
  .or("player_name.ilike.%swift%,player_name.ilike.%bryce young%")
  .order('adjusted_value', { ascending: false });
data?.forEach(r => console.log(`  ${(r.player_id||'').padEnd(14)} ${(r.format||'').padEnd(10)} ${(r.player_name||'').padEnd(25)} val=${r.adjusted_value}`));

// Also check what value sleeperApi would use for these IDs
console.log('\n=== What Sleeper ID resolves to ===');
const swiftSleeperId = Object.entries(players).find(([, p]) =>
  p.full_name?.toLowerCase().replace(/[.']/g, '') === "dandre swift"
)?.[0];
const youngSleeperId = Object.entries(players).find(([, p]) =>
  p.full_name?.toLowerCase().replace(/[.']/g, '') === "bryce young"
)?.[0];

console.log(`  D'Andre Swift Sleeper ID: ${swiftSleeperId}`);
console.log(`  Bryce Young Sleeper ID:   ${youngSleeperId}`);
