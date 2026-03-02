/**
 * Find Sleeper IDs for 2025 rookie class.
 *   npx tsx scripts/find-2025-rookies.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('Fetching Sleeper registry...');
const res = await fetch('https://api.sleeper.app/v1/players/nfl');
const players: Record<string, any> = await res.json();

// 2025 draft class targets
const targets = [
  // QBs
  'Cam Ward',          // #1 overall, MIA
  'Shedeur Sanders',   // CLE
  'Dillon Gabriel',    // CLE or elsewhere
  'Tyler Shough',      // NO
  'Jaxson Dart',       // NYG
  // RBs
  'Ashton Jeanty',     // LV
  'Omarion Hampton',   // LAC
  'Cam Skattebo',      // NYG
  'Quinshon Judkins',  // CLE
  'RJ Harvey',         // CIN
  'TreVeyon Henderson',// NE
  'Dylan Sampson',     // TEN
  'Kaleb Johnson',     // PIT (already in DB)
  'Bhayshul Tuten',    // JAX
  'Damien Martinez',   // MIA
  // WRs
  'Tetairoa McMillan', // CAR
  'Emeka Egbuka',      // TB
  'Luther Burden III', // CHI
  'Matthew Golden',    // GB
  'Jayden Higgins',    // HOU
  'Jaylin Noel',       // HOU
  'Tez Johnson',       // DET
  'Savion Williams',   // GB
  'Dont',              // fuzzy for Dontayvion Wicks or similar
  // TEs
  'Tyler Warren',      // IND
  'Colston Loveland',  // CHI
  'Mason Taylor',      // NYJ
  'Harold Fannin Jr.', // CLE
  'Elijah Arroyo',     // SEA
];

console.log('\n=== Sleeper ID Lookup ===');
for (const t of targets) {
  const key = t.toLowerCase().replace(/[.']/g, '');
  const found = Object.entries(players).find(([, p]) =>
    p.full_name && p.full_name.toLowerCase().replace(/[.']/g, '') === key
  );
  if (found) {
    const [id, p] = found;
    console.log(`  FOUND  ${t.padEnd(28)} → ${id.padEnd(8)} ${p.position} ${p.team||'?'}`);
  } else {
    // Try partial match
    const partial = Object.entries(players).find(([, p]) => {
      if (!p.full_name) return false;
      const fn = p.full_name.toLowerCase().replace(/[.']/g, '');
      return fn.includes(key.split(' ')[0]) && fn.includes(key.split(' ')[1] || '');
    });
    if (partial) {
      const [id, p] = partial;
      console.log(`  PARTIAL ${t.padEnd(28)} → ${id.padEnd(8)} ${p.full_name} ${p.position} ${p.team||'?'}`);
    } else {
      console.log(`  MISSING ${t}`);
    }
  }
}
