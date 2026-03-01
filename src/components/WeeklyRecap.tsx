import React, { useState, useEffect } from 'react';
import { FileText, Download, Share2 } from 'lucide-react';
import { fetchLeagueRosters, fetchLeagueUsers, fetchMatchups } from '../services/sleeperApi';
import { SEASON_CONTEXT } from '../config/seasonContext';

interface WeeklyStats {
  highest_score: { team: string; score: number };
  lowest_score: { team: string; score: number };
  biggest_blowout: { winner: string; loser: string; margin: number };
  closest_game: { team1: string; team2: string; margin: number };
  all_matchups: { team1: string; score1: number; team2: string; score2: number }[];
  total_points: number;
  average_points: number;
}

interface WeeklyRecapProps {
  leagueId: string;
}

export default function WeeklyRecap({ leagueId }: WeeklyRecapProps) {
  const [loading, setLoading] = useState(false);
  const [week, setWeek] = useState(1);
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [recap, setRecap] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Default week to last completed week based on season context
  useEffect(() => {
    if (SEASON_CONTEXT.phase === 'postseason' || SEASON_CONTEXT.phase === 'offseason') {
      setWeek(SEASON_CONTEXT.regular_season_weeks);
    }
  }, []);

  const generateRecap = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rosters, users, matchups] = await Promise.all([
        fetchLeagueRosters(leagueId),
        fetchLeagueUsers(leagueId),
        fetchMatchups(leagueId, week),
      ]);

      if (!matchups || matchups.length === 0) {
        setError(`No matchup data available for Week ${week}.`);
        setLoading(false);
        return;
      }

      const userMap = new Map(
        users.map(user => [
          user.user_id,
          user.metadata?.team_name || user.display_name || user.username || `Team ${user.user_id.slice(0, 4)}`
        ])
      );

      const rosterIdToName = new Map(
        rosters.map((r: any) => [r.roster_id, userMap.get(r.owner_id) || `Team ${r.roster_id}`])
      );

      // Group matchups by matchup_id to find pairs
      const pairMap = new Map<number, typeof matchups>();
      for (const m of matchups) {
        if (m.matchup_id == null) continue;
        if (!pairMap.has(m.matchup_id)) pairMap.set(m.matchup_id, []);
        pairMap.get(m.matchup_id)!.push(m);
      }

      const allMatchupResults: { team1: string; score1: number; team2: string; score2: number }[] = [];

      for (const pair of pairMap.values()) {
        if (pair.length !== 2) continue;
        const [a, b] = pair;
        allMatchupResults.push({
          team1: rosterIdToName.get(a.roster_id) || `Team ${a.roster_id}`,
          score1: a.points,
          team2: rosterIdToName.get(b.roster_id) || `Team ${b.roster_id}`,
          score2: b.points,
        });
      }

      if (allMatchupResults.length === 0) {
        setError(`Week ${week} matchups haven't started yet or have no scores.`);
        setLoading(false);
        return;
      }

      // Flatten all scores for high/low stats
      const allScores = matchups
        .filter(m => m.points > 0)
        .map(m => ({
          team: rosterIdToName.get(m.roster_id) || `Team ${m.roster_id}`,
          score: m.points,
        }))
        .sort((a, b) => b.score - a.score);

      const highest = allScores[0];
      const lowest = allScores[allScores.length - 1];

      const matchupsWithMargins = allMatchupResults.map(m => ({
        ...m,
        margin: Math.abs(m.score1 - m.score2),
      }));

      const biggestBlowout = matchupsWithMargins.reduce((max, m) => m.margin > max.margin ? m : max);
      const closestGame = matchupsWithMargins.reduce((min, m) => m.margin < min.margin ? m : min);

      const totalPoints = allScores.reduce((sum, s) => sum + s.score, 0);
      const avgPoints = totalPoints / allScores.length;

      const weeklyStats: WeeklyStats = {
        highest_score: { team: highest.team, score: highest.score },
        lowest_score: { team: lowest.team, score: lowest.score },
        biggest_blowout: {
          winner: biggestBlowout.score1 > biggestBlowout.score2 ? biggestBlowout.team1 : biggestBlowout.team2,
          loser: biggestBlowout.score1 < biggestBlowout.score2 ? biggestBlowout.team1 : biggestBlowout.team2,
          margin: biggestBlowout.margin,
        },
        closest_game: {
          team1: closestGame.team1,
          team2: closestGame.team2,
          margin: closestGame.margin,
        },
        all_matchups: allMatchupResults,
        total_points: totalPoints,
        average_points: avgPoints,
      };

      setStats(weeklyStats);

      const matchupLines = allMatchupResults
        .map(m => `- ${m.score1 > m.score2 ? `**${m.team1}** def. ${m.team2}` : `**${m.team2}** def. ${m.team1}`} (${Math.max(m.score1, m.score2).toFixed(1)} - ${Math.min(m.score1, m.score2).toFixed(1)})`)
        .join('\n');

      const recapText = `# Week ${week} Recap

## Results
${matchupLines}

## Top Performances
${weeklyStats.highest_score.team} dominated with **${weeklyStats.highest_score.score.toFixed(1)} points**, the highest score of the week!

## Bottom Performances
${weeklyStats.lowest_score.team} struggled this week, scoring only ${weeklyStats.lowest_score.score.toFixed(1)} points.

## Game of the Week
The closest matchup was between ${weeklyStats.closest_game.team1} and ${weeklyStats.closest_game.team2}, decided by just **${weeklyStats.closest_game.margin.toFixed(1)} points**!

## Blowout of the Week
${weeklyStats.biggest_blowout.winner} demolished ${weeklyStats.biggest_blowout.loser} by **${weeklyStats.biggest_blowout.margin.toFixed(1)} points**.

## League Statistics
- Total Points: ${weeklyStats.total_points.toFixed(1)}
- Average Score: ${weeklyStats.average_points.toFixed(1)}
`;

      setRecap(recapText);
    } catch (error) {
      console.error('Error generating recap:', error);
      setError('Failed to load matchup data. Please try again.');
    }
    setLoading(false);
  };

  const downloadRecap = () => {
    const blob = new Blob([recap], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `week-${week}-recap.md`;
    a.click();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(recap);
    alert('Recap copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <FileText className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold">Weekly Recap Generator</h1>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6 mb-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-2">Week Number</label>
              <input
                type="number"
                min="1"
                max="18"
                value={week}
                onChange={(e) => setWeek(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={generateRecap}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Recap'}
            </button>
          </div>
          {error && (
            <p className="mt-3 text-sm text-red-400">{error}</p>
          )}
        </div>

        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-green-500/10 backdrop-blur-sm rounded-lg border border-green-500/30 p-6 hover-lift card-enter">
                <p className="text-gray-400 mb-2">Highest Score</p>
                <p className="text-2xl font-bold text-green-400">{stats.highest_score.team}</p>
                <p className="text-xl">{stats.highest_score.score.toFixed(1)} pts</p>
              </div>

              <div className="bg-red-500/10 backdrop-blur-sm rounded-lg border border-red-500/30 p-6 hover-lift card-enter">
                <p className="text-gray-400 mb-2">Lowest Score</p>
                <p className="text-2xl font-bold text-red-400">{stats.lowest_score.team}</p>
                <p className="text-xl">{stats.lowest_score.score.toFixed(1)} pts</p>
              </div>

              <div className="bg-blue-500/10 backdrop-blur-sm rounded-lg border border-blue-500/30 p-6 hover-lift card-enter">
                <p className="text-gray-400 mb-2">Closest Game</p>
                <p className="text-lg font-bold">{stats.closest_game.team1} vs {stats.closest_game.team2}</p>
                <p className="text-blue-400">Margin: {stats.closest_game.margin.toFixed(1)} pts</p>
              </div>

              <div className="bg-yellow-500/10 backdrop-blur-sm rounded-lg border border-yellow-500/30 p-6 hover-lift card-enter">
                <p className="text-gray-400 mb-2">Biggest Blowout</p>
                <p className="text-lg font-bold">{stats.biggest_blowout.winner}</p>
                <p className="text-yellow-400">Won by {stats.biggest_blowout.margin.toFixed(1)} pts</p>
              </div>
            </div>

            {stats.all_matchups.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">All Matchups</h3>
                <div className="space-y-2">
                  {stats.all_matchups.map((m, i) => {
                    const winner = m.score1 > m.score2 ? m.team1 : m.team2;
                    const loser = m.score1 > m.score2 ? m.team2 : m.team1;
                    const winScore = Math.max(m.score1, m.score2);
                    const loseScore = Math.min(m.score1, m.score2);
                    return (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                        <span className="font-semibold text-green-400">{winner}</span>
                        <span className="text-gray-300 text-sm">{winScore.toFixed(1)} - {loseScore.toFixed(1)}</span>
                        <span className="text-gray-400">{loser}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Generated Recap</h3>
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Copy
                  </button>
                  <button
                    onClick={downloadRecap}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
              <pre className="bg-gray-900/50 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
                {recap}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
