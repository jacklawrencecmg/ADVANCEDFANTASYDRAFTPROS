import React, { useState, useEffect } from 'react';
import { Swords, RefreshCw } from 'lucide-react';
import { fetchLeagueDetails, fetchLeagueRosters, fetchLeagueUsers, fetchAllSeasonMatchups } from '../services/sleeperApi';

interface Rivalry {
  team1: string;
  team1_id: number;
  team2: string;
  team2_id: number;
  total_matchups: number;
  team1_wins: number;
  team2_wins: number;
  average_margin: number;
  biggest_blowout: number;
  closest_game: number;
  total_points_team1: number;
  total_points_team2: number;
}

interface RivalryTrackerProps {
  leagueId: string;
}

interface TeamOption {
  roster_id: number;
  owner_id: string;
  name: string;
}

export default function RivalryTracker({ leagueId }: RivalryTrackerProps) {
  const [loading, setLoading] = useState(false);
  const [rivalries, setRivalries] = useState<Rivalry[]>([]);
  const [allRivalries, setAllRivalries] = useState<Rivalry[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [selectedTeam1, setSelectedTeam1] = useState<string>('ALL');
  const [selectedTeam2, setSelectedTeam2] = useState<string>('ALL');
  const [weeksLoaded, setWeeksLoaded] = useState(0);

  useEffect(() => {
    loadRivalries();
  }, [leagueId]);

  useEffect(() => {
    filterRivalries();
  }, [selectedTeam1, selectedTeam2, allRivalries]);

  const loadRivalries = async () => {
    setLoading(true);
    try {
      const [league, rosters, users] = await Promise.all([
        fetchLeagueDetails(leagueId),
        fetchLeagueRosters(leagueId),
        fetchLeagueUsers(leagueId),
      ]);

      const userMap = new Map(
        users.map(user => [
          user.user_id,
          user.metadata?.team_name || user.display_name || user.username || `Team ${user.user_id.slice(0, 4)}`
        ])
      );

      const teamOptions: TeamOption[] = rosters.map((roster: any) => ({
        roster_id: roster.roster_id,
        owner_id: roster.owner_id,
        name: userMap.get(roster.owner_id) || `Team ${roster.roster_id}`
      }));
      setTeams(teamOptions);

      // Fetch all completed regular season matchups
      const playoffWeekStart = league.settings.playoff_week_start || 15;
      const regularSeasonWeeks = playoffWeekStart - 1;
      const weeklyMatchups = await fetchAllSeasonMatchups(leagueId, regularSeasonWeeks);
      setWeeksLoaded(weeklyMatchups.length);

      // Build head-to-head records from real matchup data
      // Key: "rosterIdA_rosterIdB" (always lower id first)
      const h2hMap = new Map<string, {
        team1_id: number;
        team2_id: number;
        team1_wins: number;
        team2_wins: number;
        margins: number[];
        team1_points: number[];
        team2_points: number[];
      }>();

      for (const { matchups } of weeklyMatchups) {
        // Group by matchup_id to find pairs
        const matchupPairs = new Map<number, typeof matchups>();
        for (const m of matchups) {
          if (m.matchup_id == null) continue;
          if (!matchupPairs.has(m.matchup_id)) matchupPairs.set(m.matchup_id, []);
          matchupPairs.get(m.matchup_id)!.push(m);
        }

        for (const pair of matchupPairs.values()) {
          if (pair.length !== 2) continue;
          const [a, b] = pair;
          const lowId = Math.min(a.roster_id, b.roster_id);
          const highId = Math.max(a.roster_id, b.roster_id);
          const key = `${lowId}_${highId}`;

          const isAFirst = a.roster_id === lowId;
          const team1Entry = isAFirst ? a : b;
          const team2Entry = isAFirst ? b : a;

          if (!h2hMap.has(key)) {
            h2hMap.set(key, {
              team1_id: lowId,
              team2_id: highId,
              team1_wins: 0,
              team2_wins: 0,
              margins: [],
              team1_points: [],
              team2_points: [],
            });
          }

          const record = h2hMap.get(key)!;
          const margin = Math.abs(team1Entry.points - team2Entry.points);
          record.margins.push(margin);
          record.team1_points.push(team1Entry.points);
          record.team2_points.push(team2Entry.points);
          if (team1Entry.points > team2Entry.points) {
            record.team1_wins++;
          } else if (team2Entry.points > team1Entry.points) {
            record.team2_wins++;
          }
        }
      }

      const rivalryData: Rivalry[] = [];

      for (const [, record] of h2hMap) {
        const team1Name = teamOptions.find(t => t.roster_id === record.team1_id)?.name || `Team ${record.team1_id}`;
        const team2Name = teamOptions.find(t => t.roster_id === record.team2_id)?.name || `Team ${record.team2_id}`;
        const totalMatchups = record.team1_wins + record.team2_wins;
        if (totalMatchups === 0) continue;

        const avgMargin = record.margins.reduce((s, m) => s + m, 0) / record.margins.length;
        const biggestBlowout = Math.max(...record.margins);
        const closestGame = Math.min(...record.margins);
        const totalPts1 = record.team1_points.reduce((s, p) => s + p, 0);
        const totalPts2 = record.team2_points.reduce((s, p) => s + p, 0);

        rivalryData.push({
          team1: team1Name,
          team1_id: record.team1_id,
          team2: team2Name,
          team2_id: record.team2_id,
          total_matchups: totalMatchups,
          team1_wins: record.team1_wins,
          team2_wins: record.team2_wins,
          average_margin: avgMargin,
          biggest_blowout: biggestBlowout,
          closest_game: closestGame,
          total_points_team1: totalPts1,
          total_points_team2: totalPts2,
        });
      }

      rivalryData.sort((a, b) => b.total_matchups - a.total_matchups);
      setAllRivalries(rivalryData);
      setRivalries(rivalryData);
    } catch (error) {
      console.error('Error loading rivalries:', error);
    }
    setLoading(false);
  };

  const filterRivalries = () => {
    if (selectedTeam1 === 'ALL' && selectedTeam2 === 'ALL') {
      setRivalries(allRivalries);
      return;
    }

    const filtered = allRivalries.filter(rivalry => {
      const matchesTeam1 = selectedTeam1 === 'ALL' ||
        rivalry.team1_id.toString() === selectedTeam1 ||
        rivalry.team2_id.toString() === selectedTeam1;

      const matchesTeam2 = selectedTeam2 === 'ALL' ||
        rivalry.team1_id.toString() === selectedTeam2 ||
        rivalry.team2_id.toString() === selectedTeam2;

      if (selectedTeam1 !== 'ALL' && selectedTeam2 !== 'ALL') {
        return (rivalry.team1_id.toString() === selectedTeam1 && rivalry.team2_id.toString() === selectedTeam2) ||
               (rivalry.team1_id.toString() === selectedTeam2 && rivalry.team2_id.toString() === selectedTeam1);
      }

      return matchesTeam1 && matchesTeam2;
    });

    setRivalries(filtered);
  };

  const getWinPercentage = (wins: number, total: number) => {
    return ((wins / total) * 100).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Swords className="w-8 h-8 text-red-400" />
            <div>
              <h1 className="text-3xl font-bold">Rivalry Tracker</h1>
              {weeksLoaded > 0 && (
                <p className="text-sm text-gray-400">{weeksLoaded} weeks of real matchup data</p>
              )}
            </div>
          </div>
          <button
            onClick={loadRivalries}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Filter Rivalries</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Team 1</label>
              <select
                value={selectedTeam1}
                onChange={(e) => setSelectedTeam1(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Teams</option>
                {teams.map(team => (
                  <option key={team.roster_id} value={team.roster_id.toString()}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Team 2</label>
              <select
                value={selectedTeam2}
                onChange={(e) => setSelectedTeam2(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Teams</option>
                {teams.map(team => (
                  <option key={team.roster_id} value={team.roster_id.toString()}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Loading real matchup data...</p>
          </div>
        ) : rivalries.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Swords className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No completed matchups found yet this season.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rivalries.map((rivalry, index) => (
              <div
                key={index}
                className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6 hover:border-blue-500 transition"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <Swords className="w-6 h-6 text-red-400" />
                    <div>
                      <h3 className="text-xl font-bold">
                        {rivalry.team1} vs {rivalry.team2}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {rivalry.total_matchups} all-time matchup{rivalry.total_matchups !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <h4 className="text-lg font-bold mb-3">{rivalry.team1}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Wins:</span>
                        <span className="font-bold">{rivalry.team1_wins}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Win %:</span>
                        <span className="font-bold">{getWinPercentage(rivalry.team1_wins, rivalry.total_matchups)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Points:</span>
                        <span className="font-bold">{rivalry.total_points_team1.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <h4 className="text-lg font-bold mb-3">{rivalry.team2}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Wins:</span>
                        <span className="font-bold">{rivalry.team2_wins}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Win %:</span>
                        <span className="font-bold">{getWinPercentage(rivalry.team2_wins, rivalry.total_matchups)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Points:</span>
                        <span className="font-bold">{rivalry.total_points_team2.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-gray-700/30 rounded-lg p-3">
                    <p className="text-sm text-gray-400 mb-1">Avg Margin</p>
                    <p className="text-lg font-bold">{rivalry.average_margin.toFixed(1)} pts</p>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-3">
                    <p className="text-sm text-gray-400 mb-1">Biggest Blowout</p>
                    <p className="text-lg font-bold">{rivalry.biggest_blowout.toFixed(1)} pts</p>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-3">
                    <p className="text-sm text-gray-400 mb-1">Closest Game</p>
                    <p className="text-lg font-bold">{rivalry.closest_game.toFixed(1)} pts</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
