import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchResult {
  id: string;
  name: string;
  position: string;
  team: string | null;
  value: number;
}

interface PlayerSearchProps {
  onSelectPlayer: (playerId: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function PlayerSearch({
  onSelectPlayer,
  placeholder = "Search for a player...",
  autoFocus = false
}: PlayerSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      setShowResults(false);
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      searchPlayers(query);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query]);

  const searchPlayers = async (searchQuery: string) => {
    setLoading(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const url = `${supabaseUrl}/functions/v1/player-search?q=${encodeURIComponent(searchQuery)}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`[PlayerSearch] Error response: ${text}`);
        setResults([]);
        setShowResults(false);
        return;
      }

      const data = await response.json();

      if (data.ok) {
        setResults(data.results || []);
        setShowResults(true);
      } else {
        setResults([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('[PlayerSearch] Search error:', error);
      setResults([]);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlayer = (playerId: string) => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    onSelectPlayer(playerId);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    inputRef.current?.focus();
  };

  const getPositionColor = (position: string): string => {
    switch (position) {
      case 'QB': return 'bg-red-100 text-red-800';
      case 'RB': return 'bg-green-100 text-green-800';
      case 'WR': return 'bg-blue-100 text-blue-800';
      case 'TE': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-fdp-surface-2 text-fdp-text-1';
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-fdp-text-3 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowResults(true);
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-12 pr-12 py-4 text-lg border-2 border-fdp-border-1 rounded-xl focus:border-fdp-accent-1 focus:ring-2 focus:ring-fdp-accent-1/20 outline-none transition-all"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-fdp-text-3 hover:text-fdp-text-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-fdp-surface-1 border border-fdp-border-1 rounded-lg shadow-xl max-h-96 overflow-y-auto">
          {results.map((player) => (
            <button
              key={player.id}
              onClick={() => handleSelectPlayer(player.id)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-50 transition-colors border-b border-fdp-border-1 last:border-b-0 text-left"
            >
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPositionColor(player.position)}`}>
                  {player.position}
                </span>
                <div>
                  <p className="font-semibold text-fdp-text-1">{player.name}</p>
                  <p className="text-sm text-fdp-text-2">{player.team || 'Free Agent'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-fdp-text-3">Value</p>
                <p className="font-bold text-blue-600">{player.value.toLocaleString()}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && query && results.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-2 bg-fdp-surface-1 border border-fdp-border-1 rounded-lg shadow-xl p-6 text-center">
          <p className="text-fdp-text-2">No players found for "{query}"</p>
        </div>
      )}

      {loading && (
        <div className="absolute z-50 w-full mt-2 bg-fdp-surface-1 border border-fdp-border-1 rounded-lg shadow-xl p-6 text-center">
          <p className="text-fdp-text-2">Searching...</p>
        </div>
      )}
    </div>
  );
}
