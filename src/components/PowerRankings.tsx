import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Users, X, ChevronLeft, ChevronRight, Calendar, DollarSign, RefreshCw } from 'lucide-react';
import { calculatePowerRankings, type TeamRanking, getEspnIdFromCache } from '../services/sleeperApi';
import { syncPlayerValuesToDatabase } from '../utils/syncPlayerValues';
import { PlayerAvatar } from './PlayerAvatar';
import { supabase } from '../lib/supabase';
import { calcFdpValue } from '../lib/fdp/calcFdpValue';

type FdpFormat = 'dynasty_sf' | 'dynasty_1qb' | 'dynasty_tep';

interface PowerRankingsProps {
  leagueId: string;
}

export default function PowerRankings({ leagueId }: PowerRankingsProps) {
  const [rankings, setRankings] = useState<TeamRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamRanking | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [fdpFormat, setFdpFormat] = useState<FdpFormat>('dynasty_sf');
  const [playerBaseValues, setPlayerBaseValues] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    loadRankings();
  }, [leagueId]);

  async function loadRankings() {
    setLoading(true);
    setError(null);
    try {
      const data = await calculatePowerRankings(leagueId);
      setRankings(data);

      // Fetch base_values for all roster players so we can apply format multipliers
      const allPlayers = data.flatMap(t => t.all_players);
      const uniqueIds = [...new Set(allPlayers.map(p => p.player_id))];
      if (uniqueIds.length > 0) {
        const { data: rows } = await supabase
          .from('player_values_canonical')
          .select('player_id, player_name, base_value')
          .eq('format', 'dynasty')
          .in('player_id', uniqueIds);

        const map = new Map<string, number>();
        rows?.forEach(r => { if (r.base_value) map.set(r.player_id, r.base_value); });

        // Name-based fallback for players whose Sleeper ID doesn't match the DB
        const missing = allPlayers.filter(p => !map.has(p.player_id));
        if (missing.length > 0) {
          const missingNames = [...new Set(missing.map(p => p.name))];
          const { data: nameRows } = await supabase
            .from('player_values_canonical')
            .select('player_name, base_value')
            .eq('format', 'dynasty')
            .in('player_name', missingNames);

          const nameToBase = new Map<string, number>();
          nameRows?.forEach(r => { if (r.player_name && r.base_value) nameToBase.set(r.player_name, r.base_value); });
          missing.forEach(p => {
            const base = nameToBase.get(p.name);
            if (base) map.set(p.player_id, base);
          });
        }

        setPlayerBaseValues(map);
      }
    } catch (err) {
      console.error('Failed to load power rankings:', err);
      setError('Failed to load power rankings. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function syncPlayerValues() {
    setSyncing(true);
    setError(null);
    setSyncSuccess(null);
    try {
      const count = await syncPlayerValuesToDatabase(false);
      setSyncSuccess(`Successfully synced ${count} FDP player values`);
      await loadRankings();
      setTimeout(() => setSyncSuccess(null), 5000);
    } catch (err) {
      console.error('Failed to sync player values:', err);
      setError('Failed to sync player values from FDP. Please try again.');
    } finally {
      setSyncing(false);
    }
  }

  if (loading && rankings.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-fdp-text-3">Loading power rankings...</div>
      </div>
    );
  }

  function getRankBadge(rank: number) {
    if (rank === 1) {
      return (
        <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full">
          <Trophy className="w-4 h-4 text-white" />
          <span className="text-white font-bold text-sm">1st</span>
        </div>
      );
    } else if (rank === 2) {
      return (
        <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full">
          <Trophy className="w-4 h-4 text-fdp-text-1" />
          <span className="text-fdp-text-1 font-bold text-sm">2nd</span>
        </div>
      );
    } else if (rank === 3) {
      return (
        <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-orange-600 to-orange-700 rounded-full">
          <Trophy className="w-4 h-4 text-white" />
          <span className="text-white font-bold text-sm">3rd</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center w-10 h-10 bg-fdp-surface-2 rounded-full border border-fdp-border-1">
          <span className="text-fdp-text-3 font-bold">{rank}</span>
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-fdp-surface-1 rounded-lg border border-fdp-border-1 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-fdp-accent-1" />
              Power Rankings
            </h2>
            <p className="text-sm text-fdp-text-3 mt-1 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Powered by FDP Values
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={syncPlayerValues}
              disabled={syncing}
              className="text-sm px-4 py-2 bg-fdp-accent-1/10 hover:bg-fdp-accent-1/20 text-fdp-accent-1 rounded-lg transition-colors border border-fdp-accent-1/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title="Sync latest FDP player values"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync FDP Values'}
            </button>
            <button
              onClick={loadRankings}
              disabled={loading}
              className="text-sm px-4 py-2 bg-fdp-surface-2 hover:bg-fdp-border-1 text-fdp-text-2 rounded-lg transition-colors border border-fdp-border-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Refresh
            </button>
          </div>
        </div>

        {syncSuccess && (
          <div className="mb-4 p-3 bg-green-900/20 border border-green-500 rounded-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-green-500" />
            <p className="text-sm text-green-400">{syncSuccess}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-lg flex items-center gap-2">
            <X className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="grid gap-4">
          {rankings.map((team) => (
            <div
              key={team.roster_id}
              className={`bg-fdp-surface-2 rounded-lg border ${
                team.rank <= 3 ? 'border-fdp-accent-1' : 'border-fdp-border-1'
              } overflow-hidden hover:border-fdp-accent-1 transition-all duration-300 ${
                team.rank <= 3 ? 'shadow-lg shadow-fdp-accent-1/20' : ''
              }`}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4 flex-1">
                    {getRankBadge(team.rank)}
                    <div className="flex-1">
                      <h3
                        className="text-xl font-bold text-white hover:text-fdp-accent-1 cursor-pointer transition-colors"
                        onClick={() => setSelectedTeam(team)}
                      >
                        {team.team_name}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-fdp-text-3">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {team.record}
                        </span>
                        <span>{team.points_for.toFixed(1)} pts</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                  <div className="bg-fdp-bg-0 rounded-lg p-3 border border-fdp-border-1">
                    <div className="text-xs text-fdp-text-3 mb-1">Players</div>
                    <div className="text-lg font-bold text-white">{team.all_players.length}</div>
                  </div>
                  <div className="bg-fdp-bg-0 rounded-lg p-3 border border-fdp-border-1">
                    <div className="text-xs text-fdp-text-3 mb-1">Draft Picks</div>
                    <div className="text-lg font-bold text-white">{team.draft_picks.length}</div>
                  </div>
                  <div className="bg-fdp-bg-0 rounded-lg p-3 border border-fdp-border-1">
                    <div className="text-xs text-fdp-text-3 mb-1">FAAB</div>
                    <div className="text-lg font-bold text-white">${team.faab_remaining}</div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedTeam(team)}
                  className="w-full py-2 bg-fdp-bg-0 hover:bg-fdp-border-1 text-fdp-accent-1 rounded-lg transition-colors border border-fdp-border-1 text-sm font-semibold"
                >
                  View Full Roster
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedTeam && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-fdp-bg-0 rounded-xl border border-fdp-border-1 max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-fdp-border-1 bg-fdp-surface-2">
              <div className="flex items-center gap-4">
                {getRankBadge(selectedTeam.rank)}
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedTeam.team_name}</h2>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                    <span className="flex items-center gap-1 text-fdp-text-3">
                      <Users className="w-4 h-4" />
                      {selectedTeam.record}
                    </span>
                    <span className="text-fdp-text-3">{selectedTeam.points_for.toFixed(1)} pts</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {(['dynasty_sf', 'dynasty_1qb', 'dynasty_tep'] as FdpFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setFdpFormat(fmt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        fdpFormat === fmt
                          ? 'bg-gradient-to-r from-fdp-accent-1 to-fdp-accent-2 text-fdp-bg-0'
                          : 'bg-fdp-surface-1 text-fdp-text-3 hover:bg-fdp-border-1'
                      }`}
                    >
                      {fmt === 'dynasty_sf' ? 'SF' : fmt === 'dynasty_1qb' ? '1QB' : 'TEP'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setSelectedTeam(null)}
                  className="text-fdp-text-3 hover:text-fdp-text-1 transition-colors p-2 hover:bg-fdp-border-1 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="p-6 space-y-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-fdp-surface-2 rounded-lg p-4 border border-fdp-border-1">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-fdp-accent-1" />
                      <div className="text-sm text-fdp-text-3">FDP Value</div>
                    </div>
                    <div className="text-2xl font-bold text-fdp-accent-1">
                      {selectedTeam.all_players.reduce((sum, p) => {
                        const base = playerBaseValues.get(p.player_id);
                        return sum + (base != null && base > 0 ? calcFdpValue(base, p.position as any, fdpFormat) : p.value);
                      }, 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-fdp-surface-2 rounded-lg p-4 border border-fdp-border-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-fdp-accent-1" />
                      <div className="text-sm text-fdp-text-3">Total Players</div>
                    </div>
                    <div className="text-3xl font-bold text-white">{selectedTeam.all_players.length}</div>
                  </div>
                  <div className="bg-fdp-surface-2 rounded-lg p-4 border border-fdp-border-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-fdp-accent-1" />
                      <div className="text-sm text-fdp-text-3">Draft Picks</div>
                    </div>
                    <div className="text-3xl font-bold text-white">{selectedTeam.draft_picks.length}</div>
                  </div>
                  <div className="bg-fdp-surface-2 rounded-lg p-4 border border-fdp-border-1">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-fdp-accent-1" />
                      <div className="text-sm text-fdp-text-3">FAAB Left</div>
                    </div>
                    <div className="text-3xl font-bold text-white">${selectedTeam.faab_remaining}</div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Users className="w-6 h-6 text-fdp-accent-1" />
                      Roster
                    </h3>
                    <div className="text-sm text-fdp-text-3">
                      {selectedTeam.all_players.length} players
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {selectedTeam.all_players.map((player, idx) => (
                      <div
                        key={player.player_id}
                        className="bg-fdp-surface-2 rounded-lg p-4 border border-fdp-border-1 hover:border-fdp-accent-1 transition-all duration-200 hover:shadow-lg hover:shadow-fdp-accent-1/10"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="relative flex-shrink-0">
                            <PlayerAvatar
                              playerId={player.player_id}
                              espnId={getEspnIdFromCache(player.player_id)}
                              playerName={player.name}
                              team={player.team || undefined}
                              position={player.position}
                              size="lg"
                              showTeamLogo={false}
                            />
                            <span className="absolute -top-1 -right-1 text-xs font-bold text-fdp-accent-1 bg-fdp-bg-0 px-1.5 py-0.5 rounded-full border border-fdp-accent-1/30">
                              #{idx + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="text-sm font-semibold text-white truncate" title={player.name}>
                                {player.name}
                              </div>
                              <span className="text-xs px-2 py-1 bg-fdp-bg-0 rounded text-fdp-text-2 font-semibold flex-shrink-0">
                                {player.position}
                              </span>
                            </div>
                            {player.team && (
                              <div className="text-xs text-fdp-text-3 mb-1">{player.team}</div>
                            )}
                            {(() => {
                              const base = playerBaseValues.get(player.player_id);
                              const val = base != null && base > 0
                                ? calcFdpValue(base, player.position as any, fdpFormat)
                                : player.value;
                              return val > 0 ? (
                                <div className="text-xs font-semibold text-fdp-accent-1">{val.toLocaleString()}</div>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedTeam.draft_picks.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-fdp-accent-1" />
                        Draft Picks
                      </h3>
                      <div className="text-sm text-fdp-text-3">
                        {selectedTeam.draft_picks.length} picks
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {selectedTeam.draft_picks.map((pick, idx) => (
                        <div
                          key={idx}
                          className="bg-fdp-surface-2 rounded-lg p-3 border border-fdp-border-1 text-center hover:border-fdp-accent-1 transition-colors"
                        >
                          <div className="text-sm font-bold text-white mb-1">
                            {pick.season}
                          </div>
                          <div className="text-xs text-fdp-accent-1 font-semibold mb-1">
                            Round {pick.round}
                          </div>
                          <div className="text-xs text-fdp-text-3">
                            {pick.original_owner_id === selectedTeam.roster_id.toString()
                              ? 'Own'
                              : `R${pick.original_owner_id}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
