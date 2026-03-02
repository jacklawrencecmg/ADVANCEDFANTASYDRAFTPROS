import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

// Check player_id 7564 — did it get corrupted?
console.log('=== Checking potentially corrupted rows ===');
const { data: rows } = await supabase
  .from('player_values_canonical')
  .select('player_id, player_name, position, team, adjusted_value, format')
  .in('player_id', ['7564', '7572', '7526', '7547', '3197', '4866']);
rows?.forEach(r => console.log(`  ${r.player_id.padEnd(12)} ${(r.format||'').padEnd(10)} ${(r.position||'').padEnd(5)} ${(r.player_name||'').padEnd(28)} val=${r.adjusted_value} team=${r.team}`));

// Check Ja'Marr Chase's real entry
console.log('\n=== Ja\'Marr Chase in DB ===');
const { data: chase } = await supabase
  .from('player_values_canonical')
  .select('player_id, player_name, position, team, adjusted_value, format')
  .ilike('player_name', '%chase%')
  .eq('format', 'dynasty');
chase?.forEach(r => console.log(`  ${r.player_id.padEnd(12)} ${(r.player_name||'').padEnd(28)} val=${r.adjusted_value}`));

// Find real Sleeper IDs via name lookup
console.log('\n=== Looking up correct Sleeper IDs ===');
const res = await fetch('https://api.sleeper.app/v1/players/nfl');
const players: Record<string, any> = await res.json();
const targets = ['Jordan Love', 'Jaylen Waddle', 'Trevor Lawrence', 'Tony Pollard', 'Kirk Cousins', "Ja'Marr Chase", 'Saquon Barkley'];
for (const t of targets) {
  const tl = t.toLowerCase().replace(/[.']/g, '');
  for (const [id, p] of Object.entries(players)) {
    if (!p.full_name) continue;
    if (p.full_name.toLowerCase().replace(/[.']/g, '') === tl) {
      console.log(`  ${t.padEnd(28)} → ${id}  (${p.position}, ${p.team})`);
      break;
    }
  }
}
