export interface MetaTagsConfig {
  title: string;
  description: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

export function generateMetaTags(config: MetaTagsConfig): void {
  document.title = config.title;

  setMetaTag('description', config.description);

  // Always set canonical — critical for avoiding duplicate content
  const canonicalHref = config.canonical || window.location.href.split('?')[0];
  setLinkTag('canonical', canonicalHref);

  setMetaTag('og:title', config.ogTitle || config.title, 'property');
  setMetaTag('og:description', config.ogDescription || config.description, 'property');
  setMetaTag('og:type', config.ogType || 'website', 'property');

  if (config.ogImage) {
    setMetaTag('og:image', config.ogImage, 'property');
  }

  setMetaTag('twitter:card', 'summary_large_image');
  setMetaTag('twitter:title', config.ogTitle || config.title);
  setMetaTag('twitter:description', config.ogDescription || config.description);

  if (config.keywords && config.keywords.length > 0) {
    setMetaTag('keywords', config.keywords.join(', '));
  }

  if (config.author) {
    setMetaTag('author', config.author);
  }

  if (config.publishedTime) {
    setMetaTag('article:published_time', config.publishedTime, 'property');
  }

  if (config.modifiedTime) {
    setMetaTag('article:modified_time', config.modifiedTime, 'property');
  }
}

function setMetaTag(name: string, content: string, type: 'name' | 'property' = 'name'): void {
  let element = document.querySelector(`meta[${type}="${name}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(type, name);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

function setLinkTag(rel: string, href: string): void {
  let element = document.querySelector(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }

  element.setAttribute('href', href);
}

export function generatePlayerMetaTags(player: {
  full_name: string;
  position: string;
  team?: string;
  fdp_value?: number;
  dynasty_rank?: number;
  value_epoch?: string;
}) {
  const slug = generatePlayerSlug(player.full_name);
  const canonical = `https://www.fantasydraftpros.com/dynasty-value/${slug}`;
  const ogImage = `https://www.fantasydraftpros.com/api/og-image/player/${slug}?value=${player.fdp_value || 0}&rank=${player.dynasty_rank || 0}&pos=${player.position}`;

  const valueText = player.fdp_value ? Math.round(player.fdp_value).toString() : 'N/A';
  const rankText = player.dynasty_rank ? `#${player.dynasty_rank}` : '';

  const title = `${player.full_name} Dynasty Value 2026 — Trade Calculator | Fantasy Draft Pros`;
  const description = `${player.full_name} dynasty trade value: ${valueText} (${rankText} overall). ${player.position} ${player.team ? `• ${player.team}` : ''}. See trade advice, value trends, and comparable players. Updated daily.`;

  return {
    title,
    description,
    canonical,
    ogTitle: `${player.full_name} — ${valueText} Dynasty Value`,
    ogDescription: `Rank ${rankText} ${player.position} | ${player.team || 'FA'} | See live trade values, trends, and analysis`,
    ogImage,
    ogType: 'article',
    keywords: [
      `${player.full_name} dynasty value`,
      `${player.full_name} trade value`,
      `${player.full_name} fantasy football`,
      'dynasty rankings',
      `${player.position} rankings`,
      'fantasy trade calculator',
      player.team || ''
    ].filter(Boolean),
    author: 'Fantasy Draft Pros',
    modifiedTime: player.value_epoch || new Date().toISOString()
  };
}

export function generateRankingsMetaTags(type: 'dynasty' | 'superflex' | 'rookie' | 'idp') {
  const titles = {
    dynasty: '2026 Dynasty Fantasy Football Rankings | Top 1000 Player Values | Fantasy Draft Pros',
    superflex: '2026 Superflex Dynasty Rankings | QB Premium Player Values | Fantasy Draft Pros',
    rookie: '2026 Dynasty Rookie Rankings & Pick Values | Fantasy Draft Pros',
    idp: '2026 IDP Dynasty Rankings | Defensive Player Trade Values | Fantasy Draft Pros'
  };

  const descriptions = {
    dynasty: '2026 dynasty fantasy football rankings — top 1000 players ranked by trade value across QB, RB, WR, TE, and IDP. Updated daily with age-adjusted dynasty scores and tier breakdowns.',
    superflex: '2026 superflex dynasty rankings with QB premium values applied. Compare player values in superflex vs 1QB leagues. Full top 200 updated daily for dynasty and startup drafts.',
    rookie: '2026 dynasty rookie rankings and draft pick values by round and slot. Compare 1QB vs superflex rookie pick values. Updated after every combine and pre-draft event.',
    idp: '2026 IDP dynasty rankings — defensive player trade values for linebackers, defensive linemen, and DBs. The only dynasty trade calculator with IDP values built in. Updated daily.'
  };

  const keywords = {
    dynasty: ['dynasty rankings 2026', 'dynasty fantasy football rankings', 'dynasty player values 2026', 'top 1000 dynasty rankings', 'dynasty trade value chart 2026'],
    superflex: ['superflex dynasty rankings 2026', 'superflex dynasty rankings', 'dynasty superflex trade values', 'QB premium dynasty rankings', 'superflex trade calculator'],
    rookie: ['dynasty rookie rankings 2026', 'rookie pick values dynasty', 'dynasty rookie draft rankings', 'rookie pick values by round', '2026 rookie rankings dynasty'],
    idp: ['IDP dynasty rankings 2026', 'IDP dynasty trade values', 'IDP dynasty rankings', 'defensive player dynasty values', 'dynasty IDP trade calculator']
  };

  const type_slug = type === 'dynasty' ? 'dynasty-rankings' : `dynasty-${type}-rankings`;

  return {
    title: titles[type],
    description: descriptions[type],
    canonical: `https://www.fantasydraftpros.com/${type_slug}`,
    ogType: 'website',
    keywords: keywords[type],
    author: 'Fantasy Draft Pros',
    modifiedTime: new Date().toISOString()
  };
}

export function generateComparisonMetaTags(player1: string, player2: string) {
  const slug1 = generatePlayerSlug(player1);
  const slug2 = generatePlayerSlug(player2);

  const title = `${player1} vs ${player2} Dynasty Trade Value 2026 | Fantasy Draft Pros`;
  const description = `${player1} vs ${player2} — dynasty trade value comparison. See who has more value, which player to target in a trade, and how their values trend. Updated daily.`;

  return {
    title,
    description,
    canonical: `https://www.fantasydraftpros.com/compare/${slug1}-vs-${slug2}-dynasty`,
    ogType: 'article',
    keywords: [
      `${player1} vs ${player2} dynasty`,
      `${player1} trade value`,
      `${player2} trade value`,
      `${player1} vs ${player2} trade`,
      'dynasty player comparison',
      'dynasty trade value comparison'
    ],
    author: 'Fantasy Draft Pros',
    modifiedTime: new Date().toISOString()
  };
}

export function generatePlayerSlug(playerName: string): string {
  return playerName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function parsePlayerSlug(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
