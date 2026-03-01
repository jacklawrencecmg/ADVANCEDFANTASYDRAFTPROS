import React, { useState, useEffect } from 'react';
import { Trophy, Users, TrendingUp, ArrowLeft, Loader, AlertCircle, Award, Target, Plus, Check, ArrowRight } from 'lucide-react';
import { ListSkeleton } from './LoadingSkeleton';
import { PlayerAvatar } from './PlayerAvatar';
import { supabase } from '../lib/supabase';
import { fetchAllPlayers } from '../services/sleeperApi';

const SLEEPER_BASE_URL = 'https://api.sleeper.app/v1';

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

interface Player {
  player_id: string;
  name: string;
  position: string;
  team: string | null;
  fdp_value: number;
  is_starter: boolean;
  headshot_url?: string;
}

interface Roster {
  roster_id: number;
  team_name: string;
  owner_name: string;
  owner_id: string;
  players: Player[];
  total_value: number;
  record: {
    wins: number;
    losses: number;
    ties: number;
  };
}

interface TradeSuggestion {
  team_a: {
    roster_id: number;
    team_name: string;
    owner_name: string;
  };
  team_b: {
    roster_id: number;
    team_name: string;
    owner_name: string;
  };
  team_a_gives: Player[];
  team_a_receives: Player[];
  team_b_gives: Player[];
  team_b_receives: Player[];
  value_difference: number;
  fairness_score: number;
  improves_both: boolean;
  trade_type: string;
}

interface LeagueDashboardProps {
  leagueId: string;
  leagueName: string;
  onBack: () => void;
  onBuildTrade?: () => void;
}

export default function LeagueDashboard({ leagueId, leagueName, onBack, onBuildTrade }: LeagueDashboardProps) {
  const [tab, setTab] = useState<'rankings' | 'rosters' | 'suggestions'>('rankings');
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [suggestions, setSuggestions] = useState<TradeSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [selectedPlayerMap, setSelectedPlayerMap] = useState<Record<string, Player>>({});

  useEffect(() => {
    loadLeagueData();
  }, [leagueId]);

  const loadLeagueData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch Sleeper league data and all player info in parallel
      const [rostersRes, usersRes, allSleeperPlayers, dbResult] = await Promise.all([
        fetch(`${SLEEPER_BASE_URL}/league/${leagueId}/rosters`),
        fetch(`${SLEEPER_BASE_URL}/league/${leagueId}/users`),
        fetchAllPlayers(),
        supabase
          .from('latest_player_values')
          .select('player_name, position, team, adjusted_value')
          .eq('format', 'dynasty')
          .in('position', ['QB', 'RB', 'WR', 'TE', 'LB', 'DL', 'DB'])
          .limit(1500),
      ]);

      if (!rostersRes.ok || !usersRes.ok) {
        throw new Error('Failed to fetch league data from Sleeper');
      }

      const [rosters, users] = await Promise.all([rostersRes.json(), usersRes.json()]);

      // Build normalized name → DB value map
      const nameToDbPlayer = new Map<string, any>();
      for (const p of dbResult.data || []) {
        if (p.player_name) nameToDbPlayer.set(normalizeName(p.player_name), p);
      }

      const userMap = new Map(users.map((u: any) => [u.user_id, u]));

      const enrichedRosters: Roster[] = rosters.map((roster: any) => {
        const owner = userMap.get(roster.owner_id);
        const players: Player[] = (roster.players || []).map((playerId: string) => {
          const sp = allSleeperPlayers[playerId];
          const liveTeam = sp?.team || null;
          const fullName = sp
            ? (sp.full_name || `${sp.first_name || ''} ${sp.last_name || ''}`.trim())
            : '';
          const dbPlayer = fullName ? nameToDbPlayer.get(normalizeName(fullName)) : undefined;

          return {
            player_id: playerId,
            name: dbPlayer?.player_name || fullName || playerId,
            position: dbPlayer?.position || sp?.position || 'N/A',
            team: liveTeam ?? dbPlayer?.team ?? null,
            fdp_value: dbPlayer?.adjusted_value || 0,
            is_starter: (roster.starters || []).includes(playerId),
            headshot_url: `https://sleepercdn.com/content/nfl/players/thumb/${playerId}.jpg`,
          };
        });

        const totalValue = players.reduce((sum, p) => sum + p.fdp_value, 0);

        return {
          roster_id: roster.roster_id,
          team_name: `Team ${roster.roster_id}`,
          owner_name: owner?.metadata?.team_name || owner?.display_name || owner?.username || 'Unknown',
          owner_id: roster.owner_id,
          players,
          total_value: Math.round(totalValue),
          record: {
            wins: roster.settings?.wins || 0,
            losses: roster.settings?.losses || 0,
            ties: roster.settings?.ties || 0,
          },
        };
      });

      setRosters(enrichedRosters.sort((a, b) => b.total_value - a.total_value));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load league data');
    } finally {
      setLoading(false);
    }
  };

  function togglePlayerSelection(player: Player) {
    if (selectedPlayerIds.includes(player.player_id)) {
      setSelectedPlayerIds(prev => prev.filter(id => id !== player.player_id));
      setSelectedPlayerMap(prev => {
        const next = { ...prev };
        delete next[player.player_id];
        return next;
      });
    } else {
      setSelectedPlayerIds(prev => [...prev, player.player_id]);
      setSelectedPlayerMap(prev => ({ ...prev, [player.player_id]: player }));
    }
  }

  function handleBuildTrade() {
    const prefillData = {
      players: selectedPlayerIds.map(id => {
        const p = selectedPlayerMap[id];
        return { player_id: p.player_id, name: p.name, position: p.position, team: p.team };
      }),
    };
    sessionStorage.setItem('fdp_trade_prefill', JSON.stringify(prefillData));
    onBuildTrade?.();
  }

  const loadSuggestions = async () => {
    if (suggestions.length > 0) return;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      const suggestionsRes = await fetch(
        `${supabaseUrl}/functions/v1/league-suggestions?league_id=${leagueId}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      const suggestionsData = await suggestionsRes.json();

      if (suggestionsData.ok) {
        setSuggestions(suggestionsData.suggestions);
      }
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    }
  };

  useEffect(() => {
    if (tab === 'suggestions' && suggestions.length === 0) {
      loadSuggestions();
    }
  }, [tab]);

  const getPositionColor = (position: string): string => {
    switch (position) {
      case 'QB': return 'bg-red-100 text-red-800';
      case 'RB': return 'bg-green-100 text-green-800';
      case 'WR': return 'bg-blue-100 text-blue-800';
      case 'TE': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-fdp-surface-2 text-fdp-text-1';
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button onClick={onBack} className="flex items-center gap-2 text-fdp-text-2 hover:text-fdp-text-1">
            <ArrowLeft className="w-5 h-5" />
            Back to Import
          </button>
        </div>
        <ListSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button onClick={onBack} className="flex items-center gap-2 text-fdp-text-2 hover:text-fdp-text-1">
            <ArrowLeft className="w-5 h-5" />
            Back to Import
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-fdp-text-2 hover:text-fdp-text-1 mb-4">
          <ArrowLeft className="w-5 h-5" />
          Back to Import
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-fdp-text-1">{leagueName}</h1>
            <p className="text-fdp-text-2 mt-1">{rosters.length} teams analyzed with FDP values</p>
          </div>
        </div>
      </div>

      <div className="bg-fdp-surface-1 rounded-lg shadow-md mb-6">
        <div className="border-b border-fdp-border-1">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setTab('rankings')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                tab === 'rankings'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-fdp-text-2 hover:text-fdp-text-1'
              }`}
            >
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Power Rankings
              </div>
            </button>
            <button
              onClick={() => setTab('rosters')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                tab === 'rosters'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-fdp-text-2 hover:text-fdp-text-1'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Rosters
              </div>
            </button>
            <button
              onClick={() => setTab('suggestions')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                tab === 'suggestions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-fdp-text-2 hover:text-fdp-text-1'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Trade Suggestions
              </div>
            </button>
          </div>
        </div>

        <div className="p-6">
          {tab === 'rankings' && (
            <div className="space-y-3">
              {rosters.map((roster, index) => (
                <div
                  key={roster.roster_id}
                  className="flex items-center justify-between p-4 bg-fdp-surface-1 rounded-lg hover:bg-fdp-surface-2 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold w-12 text-center">
                      {getRankBadge(index + 1)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-fdp-text-1">{roster.owner_name}</h3>
                      <div className="flex items-center gap-4 text-sm text-fdp-text-2 mt-1">
                        <span>{roster.players.length} players</span>
                        <span>
                          {roster.record.wins}-{roster.record.losses}
                          {roster.record.ties > 0 && `-${roster.record.ties}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      {roster.total_value.toLocaleString()}
                    </p>
                    <p className="text-sm text-fdp-text-2">Total Value</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'rosters' && (
            <div className="space-y-6">
              {selectedPlayerIds.length > 0 && (
                <div className="sticky top-0 z-10 bg-fdp-surface-1 border border-fdp-accent-1 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-fdp-text-1">
                    {selectedPlayerIds.length} player{selectedPlayerIds.length > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setSelectedPlayerIds([]); setSelectedPlayerMap({}); }}
                      className="text-xs text-fdp-text-3 hover:text-fdp-text-1 transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleBuildTrade}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-fdp-accent-1 to-fdp-accent-2 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Build Trade
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              {rosters.map((roster, index) => (
                <div key={roster.roster_id} className="border border-fdp-border-1 rounded-lg overflow-hidden">
                  <div className="bg-fdp-surface-1 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold">{getRankBadge(index + 1)}</span>
                      <h3 className="font-semibold text-fdp-text-1">{roster.owner_name}</h3>
                    </div>
                    <p className="text-lg font-bold text-blue-600">
                      {roster.total_value.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {roster.players
                        .sort((a, b) => b.fdp_value - a.fdp_value)
                        .slice(0, 12)
                        .map((player) => {
                          const isSelected = selectedPlayerIds.includes(player.player_id);
                          return (
                            <div
                              key={player.player_id}
                              className={`flex items-center justify-between p-2 border rounded transition-colors ${
                                isSelected
                                  ? 'bg-fdp-accent-1/10 border-fdp-accent-1'
                                  : 'bg-fdp-surface-1 border-fdp-border-1'
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <PlayerAvatar
                                  playerId={player.player_id}
                                  playerName={player.name}
                                  team={player.team || undefined}
                                  position={player.position}
                                  size="sm"
                                  showTeamLogo={false}
                                  headshotUrl={player.headshot_url}
                                />
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${getPositionColor(player.position)}`}>
                                    {player.position}
                                  </span>
                                  <span className="text-sm text-fdp-text-1 truncate">{player.name}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                                <span className="text-sm font-medium text-fdp-text-1">
                                  {player.fdp_value > 0 ? player.fdp_value.toLocaleString() : '—'}
                                </span>
                                <button
                                  onClick={() => togglePlayerSelection(player)}
                                  title={isSelected ? 'Remove from trade' : 'Add to trade'}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                    isSelected
                                      ? 'bg-fdp-accent-1 text-white'
                                      : 'border border-fdp-border-1 text-fdp-text-3 hover:border-fdp-accent-1 hover:text-fdp-accent-1'
                                  }`}
                                >
                                  {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    {roster.players.length > 12 && (
                      <p className="text-sm text-fdp-text-2 mt-3 text-center">
                        + {roster.players.length - 12} more players
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'suggestions' && (
            <div>
              {suggestions.length === 0 ? (
                <div className="text-center py-12">
                  <Loader className="w-12 h-12 text-fdp-text-3 mx-auto mb-4 animate-spin" />
                  <p className="text-fdp-text-2">Analyzing rosters and generating trade suggestions...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="border border-fdp-border-1 rounded-lg p-6 bg-fdp-surface-1">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-fdp-text-1">
                          {suggestion.team_a.owner_name} ⇄ {suggestion.team_b.owner_name}
                        </h3>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                            {suggestion.trade_type}
                          </span>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                            suggestion.fairness_score >= 90
                              ? 'bg-green-100 text-green-800'
                              : suggestion.fairness_score >= 75
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {suggestion.fairness_score}% Fair
                          </span>
                          {suggestion.improves_both && (
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                              Win-Win
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-fdp-surface-1 rounded-lg p-4 border border-fdp-border-1">
                          <h4 className="font-medium text-fdp-text-1 mb-3">
                            {suggestion.team_a.owner_name} Receives:
                          </h4>
                          {suggestion.team_a_receives.map((player) => (
                            <div key={player.player_id} className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getPositionColor(player.position)}`}>
                                  {player.position}
                                </span>
                                <span className="text-sm text-fdp-text-1">{player.name}</span>
                              </div>
                              <span className="text-sm font-medium text-green-600">
                                {player.fdp_value.toLocaleString()}
                              </span>
                            </div>
                          ))}
                          <div className="mt-3 pt-3 border-t border-fdp-border-1">
                            <h4 className="font-medium text-fdp-text-1 mb-2">Gives Up:</h4>
                            {suggestion.team_a_gives.map((player) => (
                              <div key={player.player_id} className="flex items-center justify-between py-1">
                                <span className="text-sm text-fdp-text-2">{player.name}</span>
                                <span className="text-sm text-fdp-text-2">
                                  {player.fdp_value.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-fdp-surface-1 rounded-lg p-4 border border-fdp-border-1">
                          <h4 className="font-medium text-fdp-text-1 mb-3">
                            {suggestion.team_b.owner_name} Receives:
                          </h4>
                          {suggestion.team_b_receives.map((player) => (
                            <div key={player.player_id} className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getPositionColor(player.position)}`}>
                                  {player.position}
                                </span>
                                <span className="text-sm text-fdp-text-1">{player.name}</span>
                              </div>
                              <span className="text-sm font-medium text-green-600">
                                {player.fdp_value.toLocaleString()}
                              </span>
                            </div>
                          ))}
                          <div className="mt-3 pt-3 border-t border-fdp-border-1">
                            <h4 className="font-medium text-fdp-text-1 mb-2">Gives Up:</h4>
                            {suggestion.team_b_gives.map((player) => (
                              <div key={player.player_id} className="flex items-center justify-between py-1">
                                <span className="text-sm text-fdp-text-2">{player.name}</span>
                                <span className="text-sm text-fdp-text-2">
                                  {player.fdp_value.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {suggestion.value_difference > 0 && (
                        <div className="mt-4 text-sm text-fdp-text-2 text-center">
                          Value difference: {suggestion.value_difference.toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
