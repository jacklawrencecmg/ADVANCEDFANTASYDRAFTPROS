import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ProgressBar } from './ProgressBar';

interface Player {
  name: string;
  team: string;
  position: string;
  stats: {
    label: string;
    value: number;
    max?: number;
  }[];
  value?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface PlayerComparisonProps {
  player1: Player;
  player2: Player;
  onClose: () => void;
}

export function PlayerComparison({ player1, player2, onClose }: PlayerComparisonProps) {
  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-fdp-text-3" />;
  };

  const getValueDifference = () => {
    if (!player1.value || !player2.value) return null;
    const diff = player1.value - player2.value;
    return {
      amount: Math.abs(diff),
      winner: diff > 0 ? player1.name : player2.name,
      percentage: ((Math.abs(diff) / Math.max(player1.value, player2.value)) * 100).toFixed(1)
    };
  };

  const valueDiff = getValueDifference();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-fdp-surface-1 rounded-2xl border border-fdp-border-1 max-w-5xl w-full max-h-[90vh] overflow-auto shadow-2xl">
        <div className="sticky top-0 bg-fdp-bg-0/95 backdrop-blur-sm border-b border-fdp-border-1 p-6 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-fdp-text-1">Player Comparison</h2>
            <p className="text-fdp-text-3 text-sm mt-1">Side-by-side statistical analysis</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-fdp-surface-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-fdp-text-3" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-fdp-surface-2 rounded-xl p-6 border border-fdp-border-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-fdp-accent-1 to-fdp-accent-2 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {player1.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">{player1.name}</h3>
                  <p className="text-fdp-text-3">{player1.team} • {player1.position}</p>
                </div>
                {getTrendIcon(player1.trend)}
              </div>
              {player1.value && (
                <div className="bg-fdp-bg-0/50 rounded-lg p-4 border border-fdp-border-1">
                  <div className="text-sm text-fdp-text-3 mb-1">Player Value</div>
                  <div className="text-3xl font-bold text-fdp-accent-1">{player1.value}</div>
                </div>
              )}
            </div>

            <div className="bg-fdp-surface-2 rounded-xl p-6 border border-fdp-border-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {player2.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">{player2.name}</h3>
                  <p className="text-fdp-text-3">{player2.team} • {player2.position}</p>
                </div>
                {getTrendIcon(player2.trend)}
              </div>
              {player2.value && (
                <div className="bg-fdp-bg-0/50 rounded-lg p-4 border border-fdp-border-1">
                  <div className="text-sm text-fdp-text-3 mb-1">Player Value</div>
                  <div className="text-3xl font-bold text-purple-500">{player2.value}</div>
                </div>
              )}
            </div>
          </div>

          {valueDiff && (
            <div className="bg-fdp-surface-2/50 rounded-xl p-4 border border-fdp-border-1 mb-6">
              <div className="text-center">
                <div className="text-sm text-fdp-text-3 mb-1">Value Difference</div>
                <div className="text-2xl font-bold text-fdp-text-1">
                  {valueDiff.amount} points ({valueDiff.percentage}%)
                </div>
                <div className="text-sm text-fdp-text-3 mt-1">
                  <span className="text-fdp-accent-1 font-semibold">{valueDiff.winner}</span> has higher value
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h4 className="text-lg font-bold text-white">Statistical Comparison</h4>

            {player1.stats.map((stat, index) => {
              const stat2 = player2.stats[index];
              const maxValue = Math.max(stat.max || stat.value, stat2?.max || stat2?.value || 0);

              return (
                <div key={index} className="bg-fdp-surface-2/50 rounded-lg p-4 border border-fdp-border-1">
                  <div className="text-sm font-semibold text-fdp-text-2 mb-3 text-center">
                    {stat.label}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-fdp-accent-1 mb-2 text-center">
                        {stat.value}
                      </div>
                      <ProgressBar
                        value={stat.value}
                        max={maxValue}
                        color="blue"
                        size="sm"
                      />
                    </div>

                    {stat2 && (
                      <div>
                        <div className="text-2xl font-bold text-purple-500 mb-2 text-center">
                          {stat2.value}
                        </div>
                        <ProgressBar
                          value={stat2.value}
                          max={maxValue}
                          color="purple"
                          size="sm"
                        />
                      </div>
                    )}
                  </div>

                  {stat2 && (
                    <div className="text-center mt-2 text-xs text-fdp-text-3">
                      {stat.value > stat2.value ? (
                        <span className="text-fdp-accent-1">
                          {player1.name} +{(stat.value - stat2.value).toFixed(1)}
                        </span>
                      ) : stat.value < stat2.value ? (
                        <span className="text-purple-500">
                          {player2.name} +{(stat2.value - stat.value).toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-fdp-text-3">Tied</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
