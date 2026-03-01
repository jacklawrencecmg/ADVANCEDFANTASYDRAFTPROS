import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getSessionId } from '../lib/session/getSessionId';

export function useWatchlist() {
  const [watchlistId, setWatchlistId] = useState<string | null>(null);
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    initWatchlist();
  }, []);

  async function initWatchlist() {
    const sessionId = getSessionId();
    try {
      const { data } = await supabase
        .from('user_watchlists')
        .upsert({ session_id: sessionId }, { onConflict: 'session_id' })
        .select('id')
        .single();

      if (!data) return;
      setWatchlistId(data.id);

      const { data: watched } = await supabase
        .from('watchlist_players')
        .select('player_id')
        .eq('watchlist_id', data.id);

      if (watched) {
        setWatchedIds(new Set(watched.map((p: { player_id: string }) => p.player_id)));
      }
    } catch {
      // Watchlist is non-critical — silently fail
    }
  }

  const addPlayer = useCallback(async (playerId: string) => {
    if (!watchlistId) return;
    setWatchedIds(prev => new Set([...prev, playerId]));
    const { error } = await supabase
      .from('watchlist_players')
      .upsert({ watchlist_id: watchlistId, player_id: playerId }, { onConflict: 'watchlist_id,player_id' });
    if (error) {
      setWatchedIds(prev => { const next = new Set(prev); next.delete(playerId); return next; });
    }
  }, [watchlistId]);

  const removePlayer = useCallback(async (playerId: string) => {
    if (!watchlistId) return;
    setWatchedIds(prev => { const next = new Set(prev); next.delete(playerId); return next; });
    const { error } = await supabase
      .from('watchlist_players')
      .delete()
      .eq('watchlist_id', watchlistId)
      .eq('player_id', playerId);
    if (error) {
      setWatchedIds(prev => new Set([...prev, playerId]));
    }
  }, [watchlistId]);

  const toggle = useCallback((playerId: string) => {
    if (watchedIds.has(playerId)) {
      removePlayer(playerId);
    } else {
      addPlayer(playerId);
    }
  }, [watchedIds, addPlayer, removePlayer]);

  const isWatched = useCallback((playerId: string) => watchedIds.has(playerId), [watchedIds]);

  return { watchedIds, isWatched, toggle, addPlayer, removePlayer };
}
