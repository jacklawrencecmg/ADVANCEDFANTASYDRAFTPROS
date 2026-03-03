/**
 * Simulates what the UnifiedRankings component fetches for each position/format.
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

async function fetchRankings(position: string, format: string) {
  const url = `${SUPABASE_URL}/functions/v1/ktc-rankings?position=${position}&format=${format}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`  ERROR ${res.status}: ${body.slice(0, 200)}`);
    return [];
  }
  return res.json();
}

const positions = ['QB', 'RB', 'WR', 'TE'];
const format = 'dynasty_sf';

for (const pos of positions) {
  const data = await fetchRankings(pos, format);
  if (!Array.isArray(data)) {
    console.log(`${pos}: unexpected response →`, data);
    continue;
  }
  console.log(`\n=== ${pos} Rankings (${format}) — ${data.length} players ===`);
  data.slice(0, 5).forEach((p: any) => {
    console.log(`  ${String(p.position_rank).padStart(2)}. ${(p.full_name || '').padEnd(24)} ${p.team || 'FA'} val=${p.fdp_value}`);
  });
  if (data.length > 5) console.log(`  ... +${data.length - 5} more`);
}
