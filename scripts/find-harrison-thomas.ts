/**
 * Find Sleeper IDs for Harrison Jr and Thomas Jr via fuzzy search
 *   npx tsx scripts/find-harrison-thomas.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('Fetching Sleeper registry...');
const res = await fetch('https://api.sleeper.app/v1/players/nfl');
const players: Record<string, any> = await res.json();

// Search for Harrison receivers and Thomas receivers
console.log('\n=== All Harrison WRs/RBs ===');
for (const [id, p] of Object.entries(players)) {
  if (!p.full_name) continue;
  if (p.full_name.toLowerCase().includes('harrison') &&
      (p.position === 'WR' || p.position === 'RB')) {
    console.log(`  ${id.padEnd(8)} ${(p.full_name||'').padEnd(30)} ${p.position} ${p.team||'?'}`);
  }
}

console.log('\n=== All Thomas WRs ===');
for (const [id, p] of Object.entries(players)) {
  if (!p.full_name) continue;
  if (p.full_name.toLowerCase().includes('thomas') && p.position === 'WR') {
    console.log(`  ${id.padEnd(8)} ${(p.full_name||'').padEnd(30)} ${p.position} ${p.team||'?'}`);
  }
}
