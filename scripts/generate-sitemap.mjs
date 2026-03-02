/**
 * Sitemap generator — runs at build time.
 * Queries Supabase for top 1000 players and generates player + comparison URLs.
 * Output: public/sitemap.xml
 *
 * Usage: node scripts/generate-sitemap.mjs
 * Requires: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY env vars (or .env file)
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env from .env if not already set
if (!process.env.VITE_SUPABASE_URL) {
  try {
    const { config } = await import('dotenv');
    config({ path: resolve(__dirname, '../.env') });
  } catch {
    // dotenv not available — rely on environment vars
  }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const BASE_URL = 'https://www.fantasydraftpros.com';
const TODAY = new Date().toISOString().split('T')[0];

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('[sitemap] Missing Supabase env vars — skipping dynamic player URLs');
}

function generatePlayerSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc, lastmod, changefreq, priority) {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function generateSitemap() {
  const urls = [];

  // ── Static core pages ──────────────────────────────────────────────────────
  urls.push(urlEntry(`${BASE_URL}/`, TODAY, 'daily', '1.0'));
  urls.push(urlEntry(`${BASE_URL}/dynasty-rankings`, TODAY, 'daily', '0.9'));
  urls.push(urlEntry(`${BASE_URL}/dynasty-superflex-rankings`, TODAY, 'daily', '0.9'));
  urls.push(urlEntry(`${BASE_URL}/dynasty-rookie-rankings`, TODAY, 'daily', '0.8'));
  urls.push(urlEntry(`${BASE_URL}/dynasty-idp-rankings`, TODAY, 'weekly', '0.8'));
  urls.push(urlEntry(`${BASE_URL}/top1000`, TODAY, 'daily', '0.8'));
  urls.push(urlEntry(`${BASE_URL}/news`, TODAY, 'daily', '0.7'));
  urls.push(urlEntry(`${BASE_URL}/faq`, TODAY, 'monthly', '0.7'));

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    buildXml(urls);
    return;
  }

  // ── Dynamic player pages ────────────────────────────────────────────────────
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: players, error } = await supabase
    .from('player_values_canonical')
    .select('player_id, player_name, position, base_value, updated_at')
    .eq('format', 'dynasty')
    .order('base_value', { ascending: false })
    .limit(1000);

  if (error) {
    console.error('[sitemap] Error fetching players:', error.message);
  }

  // Normalize to full_name for the rest of the script
  const playerList = (players || []).map(p => ({ ...p, full_name: p.player_name }));
  console.log(`[sitemap] Fetched ${playerList.length} players`);

  // Player value pages — top 1000
  for (const player of playerList) {
    if (!player.full_name) continue;
    const slug = generatePlayerSlug(player.full_name);
    const lastmod = player.updated_at
      ? player.updated_at.split('T')[0]
      : TODAY;
    urls.push(urlEntry(`${BASE_URL}/dynasty-value/${slug}`, lastmod, 'daily', '0.7'));
  }

  // ── Comparison pages — top 100 × closest same-position peers ───────────────
  const top100 = playerList.slice(0, 100);
  const comparisonSlugs = new Set();

  for (const player of top100) {
    if (!player.full_name || !player.position) continue;
    const slug1 = generatePlayerSlug(player.full_name);

    // Find up to 5 closest-value same-position players from the full list
    const peers = playerList
      .filter(p =>
        p.player_id !== player.player_id &&
        p.position === player.position &&
        p.full_name &&
        Math.abs((p.base_value || 0) - (player.base_value || 0)) < 2000
      )
      .slice(0, 5);

    for (const peer of peers) {
      const slug2 = generatePlayerSlug(peer.full_name);
      // Deduplicate by sorting slugs alphabetically
      const key = [slug1, slug2].sort().join('|');
      if (comparisonSlugs.has(key)) continue;
      comparisonSlugs.add(key);
      urls.push(urlEntry(
        `${BASE_URL}/compare/${slug1}-vs-${slug2}-dynasty`,
        TODAY,
        'weekly',
        '0.6'
      ));
    }
  }

  console.log(`[sitemap] Generated ${urls.length} total URLs (${comparisonSlugs.size} comparison pages)`);
  buildXml(urls);
}

function buildXml(urls) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  const outPath = resolve(__dirname, '../public/sitemap.xml');
  writeFileSync(outPath, xml, 'utf-8');
  console.log(`[sitemap] Written to ${outPath}`);
}

generateSitemap().catch(err => {
  console.error('[sitemap] Fatal error:', err);
  process.exit(1);
});
