import { useState, useEffect } from 'react';
import { History, Trash2, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { supabase, type SavedTrade } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { fetchAllPlayers, getPlayerImageUrl, type SleeperPlayer } from '../services/sleeperApi';
import { useToast } from './Toast';
import ConfirmDialog from './ConfirmDialog';
import { TradeCardSkeleton } from './LoadingSkeleton';
import { PlayerAvatar } from './PlayerAvatar';
import { StatSparkline } from './StatSparkline';
import { AchievementBadge } from './AchievementBadge';

interface TradeHistoryProps {
  leagueId: string;
}

export default function TradeHistory({ leagueId }: TradeHistoryProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [trades, setTrades] = useState<SavedTrade[]>([]);
  const [players, setPlayers] = useState<Record<string, SleeperPlayer>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [leagueId, user]);

  async function loadData() {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const [tradesData, playersData] = await Promise.all([loadTrades(), fetchAllPlayers()]);

      setTrades(tradesData);
      setPlayers(playersData);
    } catch (err) {
      console.error('Failed to load trade history:', err);
      setError('Failed to load trade history. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function loadTrades(): Promise<SavedTrade[]> {
    if (!user) return [];

    const { data, error } = await supabase
      .from('saved_trades')
      .select('*')
      .eq('user_id', user.id)
      .eq('league_id', leagueId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async function deleteTrade(tradeId: string) {
    try {
      const { error } = await supabase.from('saved_trades').delete().eq('id', tradeId);

      if (error) throw error;

      setTrades(trades.filter((t) => t.id !== tradeId));
      showToast('Trade deleted successfully', 'success');
    } catch (err) {
      console.error('Failed to delete trade:', err);
      showToast('Failed to delete trade. Please try again.', 'error');
    }
  }

  function getPlayerName(playerId: string): string {
    return players[playerId]?.full_name || 'Unknown Player';
  }

  function getWinnerIcon(winner: string | undefined) {
    if (winner === 'Fair') {
      return <Minus className="w-5 h-5 text-yellow-400" />;
    } else if (winner === 'A') {
      return <TrendingUp className="w-5 h-5 text-green-400" />;
    } else {
      return <TrendingDown className="w-5 h-5 text-red-400" />;
    }
  }

  function getWinnerColor(winner: string): string {
    if (winner === 'Fair') return 'text-yellow-400';
    if (winner === 'A') return 'text-green-400';
    return 'text-red-400';
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <TradeCardSkeleton />
        <TradeCardSkeleton />
        <TradeCardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
        <p className="text-red-400">{error}</p>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="bg-fdp-surface-1 rounded-lg border border-fdp-border-1 p-12 text-center">
        <History className="w-16 h-16 mx-auto mb-4 text-fdp-text-3" />
        <h3 className="text-xl font-bold text-white mb-2">No Trade History</h3>
        <p className="text-fdp-text-3">
          Analyzed trades will be automatically saved here for future reference.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-fdp-surface-1 rounded-lg border border-fdp-border-1 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <History className="w-7 h-7 text-fdp-accent-1" />
            Trade History
          </h2>
          <div className="text-sm text-fdp-text-3">{trades.length} saved trades</div>
        </div>

        <div className="space-y-4">
          {trades.map((trade) => (
            <div
              key={trade.id}
              className="bg-fdp-surface-2 rounded-lg border border-fdp-border-1 p-5 hover:border-fdp-accent-1 transition-all duration-300 hover-lift card-enter"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getWinnerIcon(trade.trade_result?.winner || trade.winner)}
                  <div>
                    <div
                      className={`font-bold text-lg ${getWinnerColor(
                        trade.trade_result?.winner || trade.winner || 'Fair'
                      )}`}
                    >
                      {(trade.trade_result?.winner || trade.winner) === 'Fair'
                        ? 'Fair Trade'
                        : `${
                            (trade.trade_result?.winner || trade.winner) === 'A'
                              ? trade.trade_result?.team_a_name || 'Team A'
                              : trade.trade_result?.team_b_name || 'Team B'
                          } Wins`}
                    </div>
                    <div className="text-sm text-fdp-text-3">
                      {new Date(trade.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteConfirm(trade.id)}
                  className="text-fdp-text-3 hover:text-red-400 transition-colors p-2"
                  title="Delete trade"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="bg-fdp-bg-0 rounded-lg p-4 border border-fdp-border-1">
                  <div className="text-sm text-fdp-text-3 mb-1">
                    {trade.trade_result?.team_a_name || 'Team A'} Value
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {trade.trade_result?.team_a_value || trade.team_a_value}
                  </div>
                </div>
                <div className="bg-fdp-bg-0 rounded-lg p-4 border border-fdp-border-1">
                  <div className="text-sm text-fdp-text-3 mb-1">
                    {trade.trade_result?.team_b_name || 'Team B'} Value
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {trade.trade_result?.team_b_value || trade.team_b_value}
                  </div>
                </div>
                <div className="bg-fdp-bg-0 rounded-lg p-4 border border-fdp-border-1">
                  <div className="text-sm text-fdp-text-3 mb-1">Difference</div>
                  <div className="text-2xl font-bold text-fdp-accent-1">
                    {trade.trade_result?.difference || trade.difference}
                  </div>
                </div>
              </div>

              {trade.trade_result?.team_a_items ? (
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm font-semibold text-fdp-text-3 mb-2">
                      {trade.trade_result?.team_a_name || 'Team A'} Gives
                    </div>
                    <div className="space-y-1">
                      {trade.trade_result.team_a_items.map((item) => (
                        <div
                          key={item.id}
                          className="text-sm bg-fdp-bg-0 px-3 py-2 rounded border border-fdp-border-1 text-fdp-text-1 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {item.type === 'player' ? (
                              <PlayerAvatar
                                playerId={item.id}
                                espnId={players[item.id]?.espn_id}
                                playerName={item.name}
                                team=""
                                position={item.position || ''}
                                size="sm"
                                showTeamLogo={false}
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-fdp-accent-1" />
                                <span>{item.name}</span>
                              </div>
                            )}
                          </div>
                          <span className="text-fdp-text-3">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-fdp-text-3 mb-2">
                      {trade.trade_result?.team_a_name || 'Team A'} Gets
                    </div>
                    <div className="space-y-1">
                      {(trade.trade_result?.team_b_items || []).map((item) => (
                        <div
                          key={item.id}
                          className="text-sm bg-fdp-bg-0 px-3 py-2 rounded border border-fdp-border-1 text-fdp-text-1 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {item.type === 'player' ? (
                              <PlayerAvatar
                                playerId={item.id}
                                playerName={item.name}
                                team=""
                                position={item.position || ''}
                                size="sm"
                                showTeamLogo={false}
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-fdp-accent-1" />
                                <span>{item.name}</span>
                              </div>
                            )}
                          </div>
                          <span className="text-fdp-text-3">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm font-semibold text-fdp-text-3 mb-2">Team A Gives</div>
                    <div className="space-y-1">
                      {trade.trade_data?.team_a_gives?.map((playerId: string) => (
                        <div
                          key={playerId}
                          className="text-sm bg-fdp-bg-0 px-3 py-2 rounded border border-fdp-border-1 text-fdp-text-1 flex items-center gap-2"
                        >
                          <PlayerAvatar
                            playerId={playerId}
                            espnId={players[playerId]?.espn_id}
                            playerName={getPlayerName(playerId)}
                            team={players[playerId]?.team || ''}
                            position={players[playerId]?.position || ''}
                            size="sm"
                            showTeamLogo={false}
                          />
                        </div>
                      )) ||
                        trade.team_a_gives?.map((playerId: string) => (
                          <div
                            key={playerId}
                            className="text-sm bg-fdp-bg-0 px-3 py-2 rounded border border-fdp-border-1 text-fdp-text-1 flex items-center gap-2"
                          >
                            <PlayerAvatar
                              playerId={playerId}
                              espnId={players[playerId]?.espn_id}
                              playerName={getPlayerName(playerId)}
                              team={players[playerId]?.team || ''}
                              position={players[playerId]?.position || ''}
                              size="sm"
                              showTeamLogo={false}
                            />
                          </div>
                        ))}
                      {trade.trade_data?.team_a_gives_picks?.map((pick) => (
                        <div
                          key={pick.id}
                          className="text-sm bg-fdp-bg-0 px-3 py-2 rounded border border-fdp-border-1 text-fdp-text-1 flex items-center gap-2"
                        >
                          <Calendar className="w-3 h-3 text-fdp-accent-1" />
                          {pick.displayName}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-fdp-text-3 mb-2">Team A Gets</div>
                    <div className="space-y-1">
                      {trade.trade_data?.team_a_gets?.map((playerId: string) => (
                        <div
                          key={playerId}
                          className="text-sm bg-fdp-bg-0 px-3 py-2 rounded border border-fdp-border-1 text-fdp-text-1 flex items-center gap-2"
                        >
                          <PlayerAvatar
                            playerId={playerId}
                            espnId={players[playerId]?.espn_id}
                            playerName={getPlayerName(playerId)}
                            team={players[playerId]?.team || ''}
                            position={players[playerId]?.position || ''}
                            size="sm"
                            showTeamLogo={false}
                          />
                        </div>
                      )) ||
                        trade.team_a_gets?.map((playerId: string) => (
                          <div
                            key={playerId}
                            className="text-sm bg-fdp-bg-0 px-3 py-2 rounded border border-fdp-border-1 text-fdp-text-1 flex items-center gap-2"
                          >
                            <PlayerAvatar
                              playerId={playerId}
                              espnId={players[playerId]?.espn_id}
                              playerName={getPlayerName(playerId)}
                              team={players[playerId]?.team || ''}
                              position={players[playerId]?.position || ''}
                              size="sm"
                              showTeamLogo={false}
                            />
                          </div>
                        ))}
                      {trade.trade_data?.team_a_gets_picks?.map((pick) => (
                        <div
                          key={pick.id}
                          className="text-sm bg-fdp-bg-0 px-3 py-2 rounded border border-fdp-border-1 text-fdp-text-1 flex items-center gap-2"
                        >
                          <Calendar className="w-3 h-3 text-fdp-accent-1" />
                          {pick.displayName}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-fdp-bg-0 rounded-lg p-4 border border-fdp-border-1">
                <div className="text-sm text-fdp-text-3 mb-2">Analysis</div>
                <p className="text-white">{trade.trade_result?.fairness || trade.fairness}</p>
              </div>

              {trade.notes && (
                <div className="mt-4 bg-fdp-bg-0 rounded-lg p-4 border border-fdp-border-1">
                  <div className="text-sm text-fdp-text-3 mb-2">Notes</div>
                  <p className="text-white">{trade.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && deleteTrade(deleteConfirm)}
        title="Delete Trade Analysis"
        message="Are you sure you want to delete this trade analysis? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
}
