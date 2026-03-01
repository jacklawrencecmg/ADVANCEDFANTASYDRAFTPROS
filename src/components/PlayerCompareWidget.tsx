import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlayerResult {
  id: string;
  name: string;
  position: string;
  team: string;
  value: number;
  base_value: number;
  tier: number | null;
  metadata: {
    age?: number;
    trend?: 'up' | 'down' | 'stable';
    [key: string]: unknown;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const POSITION_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  QB: { bg: 'bg-purple-600/20',  text: 'text-purple-300',  ring: 'ring-purple-500/40'  },
  RB: { bg: 'bg-green-600/20',   text: 'text-green-300',   ring: 'ring-green-500/40'   },
  WR: { bg: 'bg-blue-600/20',    text: 'text-blue-300',    ring: 'ring-blue-500/40'    },
  TE: { bg: 'bg-orange-600/20',  text: 'text-orange-300',  ring: 'ring-orange-500/40'  },
};

const DEFAULT_POS_STYLE = { bg: 'bg-fdp-surface-2', text: 'text-fdp-text-2', ring: 'ring-fdp-border-1' };

function posStyle(pos: string) {
  return POSITION_STYLES[pos?.toUpperCase()] ?? DEFAULT_POS_STYLE;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PositionBadge({ position }: { position: string }) {
  const s = posStyle(position);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${s.bg} ${s.text}`}>
      {position}
    </span>
  );
}

function PositionAvatar({ position }: { position: string }) {
  const s = posStyle(position);
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black ring-2 ${s.bg} ${s.text} ${s.ring} shrink-0`}>
      {(position ?? '?').substring(0, 2).toUpperCase()}
    </div>
  );
}

function TrendIcon({ trend }: { trend?: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-fdp-pos">
        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 3l5 6H3L8 3z" />
        </svg>
        Rising
      </span>
    );
  }
  if (trend === 'down') {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-fdp-neg">
        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 13l-5-6h10L8 13z" />
        </svg>
        Falling
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-fdp-text-3">
      <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
        <path d="M2 8h12M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Stable
    </span>
  );
}

// ─── Search Panel ─────────────────────────────────────────────────────────────

interface SearchPanelProps {
  label: string;
  selected: PlayerResult | null;
  onSelect: (player: PlayerResult) => void;
  onClear: () => void;
  side: 'left' | 'right';
}

function SearchPanel({ label, selected, onSelect, onClear, side }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/player-search?q=${encodeURIComponent(q)}&limit=8`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        const players: PlayerResult[] = Array.isArray(data) ? data : data.players ?? [];
        setResults(players);
        setOpen(players.length > 0);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 250);
  };

  const handleSelect = (player: PlayerResult) => {
    onSelect(player);
    setQuery('');
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const alignDropdown = side === 'right' ? 'right-0' : 'left-0';

  return (
    <div className="flex-1 min-w-0">
      {/* Panel label */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-1.5 h-1.5 rounded-full ${side === 'left' ? 'bg-fdp-accent-1' : 'bg-fdp-accent-2'}`} />
        <span className="text-xs font-semibold text-fdp-text-3 uppercase tracking-widest">{label}</span>
      </div>

      {selected ? (
        /* Selected player chip */
        <div className="card p-3 flex items-center gap-3 animate-fade-up group">
          <PositionAvatar position={selected.position} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-fdp-text-1 truncate">{selected.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <PositionBadge position={selected.position} />
              <span className="text-xs text-fdp-text-3">{selected.team}</span>
            </div>
            <p className="text-xs text-fdp-text-3 mt-1">
              Value: <span className="text-fdp-text-2 font-semibold">{selected.value.toLocaleString()}</span>
            </p>
          </div>
          <button
            onClick={onClear}
            className="w-7 h-7 rounded-full flex items-center justify-center bg-fdp-surface-2 border border-fdp-border-1 text-fdp-text-3
                       hover:bg-fdp-neg/20 hover:border-fdp-neg/50 hover:text-fdp-neg transition-all duration-200 shrink-0"
            aria-label="Remove player"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>
      ) : (
        /* Search input + dropdown */
        <div className="relative">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fdp-text-3 pointer-events-none"
              viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"
            >
              <circle cx="8.5" cy="8.5" r="5.5" />
              <path d="M14.5 14.5l3 3" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => results.length > 0 && setOpen(true)}
              placeholder={`Search player…`}
              className="input-base pl-9 pr-9"
              autoComplete="off"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="w-4 h-4 text-fdp-accent-1 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
                </svg>
              </div>
            )}
          </div>

          {/* Dropdown */}
          {open && results.length > 0 && (
            <div
              ref={dropdownRef}
              className={`absolute z-50 mt-1.5 w-full ${alignDropdown} bg-fdp-surface-1 border border-fdp-border-1 rounded-xl shadow-card overflow-hidden`}
            >
              {results.map((player, idx) => (
                <button
                  key={player.id}
                  onMouseDown={() => handleSelect(player)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors duration-100
                    ${idx === activeIndex ? 'bg-fdp-accent-1/15' : 'hover:bg-fdp-surface-2'}
                    ${idx !== 0 ? 'border-t border-fdp-border-1/60' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ring-1 shrink-0
                    ${posStyle(player.position).bg} ${posStyle(player.position).text} ${posStyle(player.position).ring}`}>
                    {player.position?.substring(0, 2) ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-fdp-text-1 truncate">{player.name}</p>
                    <p className="text-xs text-fdp-text-3 truncate">{player.position} · {player.team}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-fdp-text-1">{player.value.toLocaleString()}</p>
                    {player.tier != null && (
                      <p className="text-xs text-fdp-text-3">Tier {player.tier}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Comparison Card ──────────────────────────────────────────────────────────

interface ComparisonCardProps {
  player1: PlayerResult;
  player2: PlayerResult;
  onClearBoth: () => void;
}

function ComparisonCard({ player1, player2, onClearBoth }: ComparisonCardProps) {
  const maxVal = Math.max(player1.value, player2.value, 1);
  const p1Width = Math.round((player1.value / maxVal) * 100);
  const p2Width = Math.round((player2.value / maxVal) * 100);
  const p1Wins = player1.value >= player2.value;

  const diff = Math.abs(player1.value - player2.value);
  const pctDiff = maxVal > 0 ? ((diff / maxVal) * 100).toFixed(1) : '0.0';
  const winner = p1Wins ? player1 : player2;
  const loser = p1Wins ? player2 : player1;

  const stats: Array<{ label: string; p1: React.ReactNode; p2: React.ReactNode }> = [
    {
      label: 'Dynasty Value',
      p1: <span className={`font-bold ${p1Wins ? 'text-fdp-text-1' : 'text-fdp-text-3'}`}>{player1.value.toLocaleString()}</span>,
      p2: <span className={`font-bold ${!p1Wins ? 'text-fdp-text-1' : 'text-fdp-text-3'}`}>{player2.value.toLocaleString()}</span>,
    },
    {
      label: 'Base Value',
      p1: <span className="text-fdp-text-2">{player1.base_value?.toLocaleString() ?? '—'}</span>,
      p2: <span className="text-fdp-text-2">{player2.base_value?.toLocaleString() ?? '—'}</span>,
    },
    {
      label: 'Age',
      p1: <span className="text-fdp-text-2">{player1.metadata?.age ?? '—'}</span>,
      p2: <span className="text-fdp-text-2">{player2.metadata?.age ?? '—'}</span>,
    },
    {
      label: 'Tier',
      p1: player1.tier != null
        ? <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-fdp-accent-1/15 text-fdp-accent-1 text-xs font-bold">T{player1.tier}</span>
        : <span className="text-fdp-text-3">—</span>,
      p2: player2.tier != null
        ? <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-fdp-accent-2/15 text-fdp-accent-2 text-xs font-bold">T{player2.tier}</span>
        : <span className="text-fdp-text-3">—</span>,
    },
    {
      label: 'Team',
      p1: <span className="text-fdp-text-2 font-medium">{player1.team}</span>,
      p2: <span className="text-fdp-text-2 font-medium">{player2.team}</span>,
    },
    {
      label: 'Trend',
      p1: <TrendIcon trend={player1.metadata?.trend} />,
      p2: <TrendIcon trend={player2.metadata?.trend} />,
    },
  ];

  return (
    <div className="card overflow-hidden animate-fade-up">
      {/* Gradient top accent */}
      <div className="h-0.5 w-full bg-gradient-to-r from-fdp-accent-1 to-fdp-accent-2" />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-fdp-text-1 uppercase tracking-widest">Head-to-Head</h3>
          <button onClick={onClearBoth} className="btn-ghost text-xs px-3 py-1.5">
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
            Clear Both
          </button>
        </div>

        {/* Value bar */}
        <div className="mb-6">
          <div className="flex items-end justify-between mb-1.5 gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-fdp-text-1 truncate">{player1.name}</p>
              <PositionBadge position={player1.position} />
            </div>
            <div className="text-center shrink-0 px-2">
              <p className="text-xs text-fdp-text-3 font-medium">vs</p>
            </div>
            <div className="min-w-0 flex-1 text-right">
              <p className="text-sm font-bold text-fdp-text-1 truncate">{player2.name}</p>
              <div className="flex justify-end">
                <PositionBadge position={player2.position} />
              </div>
            </div>
          </div>

          {/* Bar track */}
          <div className="relative h-5 flex rounded-full overflow-hidden bg-fdp-surface-2 gap-0.5">
            {/* Player 1 bar */}
            <div
              className={`h-full rounded-l-full transition-all duration-500 ${
                p1Wins
                  ? 'bg-gradient-to-r from-fdp-accent-1 to-fdp-accent-2'
                  : 'bg-fdp-surface-2 border border-fdp-border-1'
              }`}
              style={{ width: `${p1Width}%` }}
            />
            {/* Player 2 bar */}
            <div
              className={`h-full rounded-r-full transition-all duration-500 ml-auto ${
                !p1Wins
                  ? 'bg-gradient-to-r from-fdp-accent-2 to-fdp-accent-1'
                  : 'bg-fdp-surface-2 border border-fdp-border-1'
              }`}
              style={{ width: `${p2Width}%` }}
            />
          </div>

          {/* Values below bar */}
          <div className="flex justify-between mt-1">
            <span className={`text-xs font-bold tabular-nums ${p1Wins ? 'text-fdp-accent-1' : 'text-fdp-text-3'}`}>
              {player1.value.toLocaleString()}
            </span>
            <span className={`text-xs font-bold tabular-nums ${!p1Wins ? 'text-fdp-accent-2' : 'text-fdp-text-3'}`}>
              {player2.value.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Value difference callout */}
        <div className="mb-5 rounded-xl bg-fdp-surface-2 border border-fdp-border-1 p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fdp-accent-1 to-fdp-accent-2 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2l2.4 6.5H19l-5.7 4.1 2.2 6.4L10 15l-5.5 4 2.2-6.4L1 8.5h6.6L10 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-fdp-text-3 uppercase tracking-wide font-medium">Value Difference</p>
            <p className="text-sm font-bold text-fdp-text-1 mt-0.5">
              <span className="text-gradient">{winner.name}</span>
              <span className="text-fdp-text-2 font-normal"> leads by </span>
              <span className="text-fdp-text-1">{diff.toLocaleString()}</span>
              <span className="text-fdp-text-3 font-normal text-xs ml-1">({pctDiff}%)</span>
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="space-y-2">
          {stats.map(({ label, p1, p2 }) => (
            <div key={label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-2 border-b border-fdp-border-1/50 last:border-0">
              <div className="text-sm">{p1}</div>
              <div className="text-center">
                <span className="text-[11px] text-fdp-text-3 uppercase tracking-wide font-medium whitespace-nowrap px-2">{label}</span>
              </div>
              <div className="text-sm text-right">{p2}</div>
            </div>
          ))}
        </div>

        {/* Winner badge */}
        <div className="mt-4 pt-4 border-t border-fdp-border-1 flex items-center justify-center gap-2">
          <span className="text-xs text-fdp-text-3 uppercase tracking-widest font-medium">Dynasty Winner</span>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-fdp-accent-1/20 to-fdp-accent-2/20 border border-fdp-accent-1/30">
            <PositionAvatar position={winner.position} />
            <div>
              <p className="text-sm font-bold text-fdp-text-1">{winner.name}</p>
              <p className="text-xs text-fdp-text-3">{winner.position} · {winner.team}</p>
            </div>
          </div>
        </div>

        {/* Loser note */}
        <p className="mt-2 text-center text-xs text-fdp-text-3">
          {loser.name} trails by{' '}
          <span className="text-fdp-text-2 font-semibold">{diff.toLocaleString()} pts</span>
          {' '}({pctDiff}%)
        </p>
      </div>
    </div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export function PlayerCompareWidget() {
  const [player1, setPlayer1] = useState<PlayerResult | null>(null);
  const [player2, setPlayer2] = useState<PlayerResult | null>(null);

  const clearBoth = () => {
    setPlayer1(null);
    setPlayer2(null);
  };

  return (
    <div className="w-full space-y-4">
      {/* Widget header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fdp-accent-1 to-fdp-accent-2 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-bold text-fdp-text-1">Player Compare</h2>
          <p className="text-xs text-fdp-text-3">Dynasty value head-to-head</p>
        </div>
      </div>

      {/* Search panels */}
      <div className="card p-4">
        <div className="flex gap-4 items-start">
          <SearchPanel
            label="Player 1"
            selected={player1}
            onSelect={setPlayer1}
            onClear={() => setPlayer1(null)}
            side="left"
          />

          {/* Divider */}
          <div className="flex flex-col items-center gap-1 pt-7 shrink-0">
            <div className="w-px flex-1 bg-fdp-border-1 min-h-[40px]" />
            <div className="w-7 h-7 rounded-full bg-fdp-surface-2 border border-fdp-border-1 flex items-center justify-center">
              <span className="text-[10px] font-bold text-fdp-text-3">VS</span>
            </div>
            <div className="w-px flex-1 bg-fdp-border-1 min-h-[40px]" />
          </div>

          <SearchPanel
            label="Player 2"
            selected={player2}
            onSelect={setPlayer2}
            onClear={() => setPlayer2(null)}
            side="right"
          />
        </div>

        {/* Prompt when nothing selected */}
        {!player1 && !player2 && (
          <p className="text-center text-xs text-fdp-text-3 mt-4 pb-1">
            Search for two players to compare their dynasty value
          </p>
        )}
      </div>

      {/* Comparison result */}
      {player1 && player2 && (
        <ComparisonCard
          player1={player1}
          player2={player2}
          onClearBoth={clearBoth}
        />
      )}

      {/* Partial selection hint */}
      {(player1 === null) !== (player2 === null) && (
        <div className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-fdp-border-1 bg-fdp-surface-1/50">
          <svg className="w-4 h-4 text-fdp-accent-1 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-fdp-text-3">
            Now search for a <span className="text-fdp-text-2 font-semibold">second player</span> to see the comparison
          </p>
        </div>
      )}
    </div>
  );
}
