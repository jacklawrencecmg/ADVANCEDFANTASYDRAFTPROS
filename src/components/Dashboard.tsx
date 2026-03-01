import { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase, UserLeague } from '../lib/supabase';
import { SEASON_CONTEXT } from '../config/seasonContext';
import { LogOut, Plus, Settings, TrendingUp, Users, Trophy, Activity, History, Search, Shield, Clipboard, FileText, Swords, MessageCircle, Bell, Newspaper, Share2, ArrowLeftRight, ShoppingCart, RefreshCw, Calendar, DollarSign, Mail, Award, Edit, Sparkles, Target, Upload, Radio, Zap, ChevronRight, AlertCircle, X, Sliders, BarChart2, Lock } from 'lucide-react';
import { LeagueManager } from './LeagueManager';
import { ListSkeleton } from './LoadingSkeleton';
import { useToast } from './Toast';
import TradeAnalyzer from './TradeAnalyzer'; // eager — hero component
import AlertsDropdown from './AlertsDropdown';
import UpgradeModal from './UpgradeModal';
import SubscriptionBadge from './SubscriptionBadge';
import UsageMeter from './UsageMeter';
import Footer from './Footer';
import { useSubscription } from '../hooks/useSubscription';
import { fetchLeagueRosters, fetchLeagueUsers } from '../services/sleeperApi';

// Lazy-load everything else to massively reduce initial bundle size
const PowerRankings = lazy(() => import('./PowerRankings'));
const PlayoffSimulator = lazy(() => import('./PlayoffSimulator'));
const TradeHistory = lazy(() => import('./TradeHistory'));
const WaiverAssistant = lazy(() => import('./WaiverAssistant'));
const LineupOptimizer = lazy(() => import('./LineupOptimizer'));
const ValueTrendTracker = lazy(() => import('./ValueTrendTracker'));
const ChampionshipCalculator = lazy(() => import('./ChampionshipCalculator'));
const TradeFinder = lazy(() => import('./TradeFinder'));
const TradeBlockMarketplace = lazy(() => import('./TradeBlockMarketplace'));
const CounterOfferGenerator = lazy(() => import('./CounterOfferGenerator'));
const DraftKit = lazy(() => import('./DraftKit'));
const KeeperCalculator = lazy(() => import('./KeeperCalculator'));
const RosterHealth = lazy(() => import('./RosterHealth'));
const WeeklyRecap = lazy(() => import('./WeeklyRecap'));
const RivalryTracker = lazy(() => import('./RivalryTracker'));
const LeagueChat = lazy(() => import('./LeagueChat'));
const NotificationsPanel = lazy(() => import('./NotificationsPanel'));
const PlayerNewsFeed = lazy(() => import('./PlayerNewsFeed'));
const ExportShare = lazy(() => import('./ExportShare'));
const PlayerValues = lazy(() => import('./PlayerValues').then(m => ({ default: m.PlayerValues })));
const Contact = lazy(() => import('./Contact').then(m => ({ default: m.Contact })));
const KTCAdminSync = lazy(() => import('./KTCAdminSync'));
const AdminSyncHub = lazy(() => import('./AdminSyncHub').then(m => ({ default: m.AdminSyncHub })));
const TrendingPlayersPanel = lazy(() => import('./TrendingPlayersPanel'));
const KTCQBRankings = lazy(() => import('./KTCQBRankings'));
const KTCRBRankings = lazy(() => import('./KTCRBRankings'));
const KTCWRRankings = lazy(() => import('./KTCWRRankings'));
const KTCTERankings = lazy(() => import('./KTCTERankings'));
const KTCMultiPositionSync = lazy(() => import('./KTCMultiPositionSync'));
const UnifiedRankings = lazy(() => import('./UnifiedRankings'));
const PlayerCompareWidget = lazy(() => import('./PlayerCompareWidget').then(m => ({ default: m.PlayerCompareWidget })));
const PlayerSearch = lazy(() => import('./PlayerSearch'));
const PlayerDetail = lazy(() => import('./PlayerDetail'));
const SleeperLeagueAnalysis = lazy(() => import('./SleeperLeagueAnalysis'));
const RBContextEditor = lazy(() => import('./RBContextEditor'));
const RBContextSuggestions = lazy(() => import('./RBContextSuggestions'));
const RookiePickValues = lazy(() => import('./RookiePickValues'));
const IDPRankings = lazy(() => import('./IDPRankings'));
const IDPAdminUpload = lazy(() => import('./IDPAdminUpload'));
const TeamAdvice = lazy(() => import('./TeamAdvice'));
const MarketTrends = lazy(() => import('./MarketTrends'));
const WatchlistPanel = lazy(() => import('./WatchlistPanel'));
const HeadshotAdmin = lazy(() => import('./HeadshotAdmin'));
const DynastyReportsIndex = lazy(() => import('./DynastyReportsIndex'));
const DynastyReportPage = lazy(() => import('./DynastyReportPage'));
const PricingPage = lazy(() => import('./PricingPage'));
const ValueFineTuner = lazy(() => import('./ValueFineTuner'));

// Primary nav sections
type PrimaryTab = 'trade' | 'league' | 'rankings' | 'reports' | 'admin';

// All sub-tabs
type TabType =
  // Trade
  'trade' | 'history' | 'tradeFinder' | 'counterOffer' | 'tradeBlock' |
  // League
  'rankings' | 'playoffs' | 'championship' | 'health' | 'waiver' | 'lineup' |
  'rivalry' | 'recap' | 'chat' | 'notifications' | 'sleeperAnalysis' | 'teamAdvice' |
  // Rankings
  'values' | 'unifiedRankings' | 'ktcRankings' | 'ktcRBRankings' | 'ktcWRRankings' |
  'ktcTERankings' | 'idpRankings' | 'pickValues' | 'trending' | 'market' | 'trends' |
  'watchlist' | 'draft' | 'keeper' | 'compare' |
  // Reports
  'reports' | 'reportDetail' | 'news' | 'export' | 'pricing' | 'contact' |
  // Admin
  'adminSync' | 'ktcAdmin' | 'valueTuner' | 'rbContext' | 'rbSuggestions' |
  'headshotAdmin' | 'idpUpload' | 'ktcMultiSync';

interface DashboardProps {
  onNavigate?: (page: 'home' | 'faq' | 'help' | 'contact') => void;
}

export function Dashboard({ onNavigate }: DashboardProps = {}) {
  const { user, signOut, isAdmin } = useAuth();
  const { showToast } = useToast();
  const { isPro } = useSubscription();
  const [leagues, setLeagues] = useState<UserLeague[]>([]);
  const [currentLeague, setCurrentLeague] = useState<UserLeague | null>(null);
  const [currentRosterId, setCurrentRosterId] = useState<string>('1');
  const [showAddLeague, setShowAddLeague] = useState(false);
  const [showManageLeagues, setShowManageLeagues] = useState(false);
  const [loading, setLoading] = useState(true);
  const [primaryTab, setPrimaryTab] = useState<PrimaryTab>('trade');
  const [activeTab, setActiveTab] = useState<TabType>('trade');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedReportSlug, setSelectedReportSlug] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<string | undefined>(undefined);
  const [onboardingDismissed, setOnboardingDismissed] = useState(() =>
    localStorage.getItem('fdp_onboarding_dismissed') === '1'
  );

  // Switch primary tab and set a sensible default sub-tab
  function switchPrimary(tab: PrimaryTab) {
    setPrimaryTab(tab);
    const defaults: Record<PrimaryTab, TabType> = {
      trade: 'trade',
      league: 'rankings',
      rankings: 'values',
      reports: 'reports',
      admin: 'adminSync',
    };
    setActiveTab(defaults[tab]);
  }

  useEffect(() => {
    if (user) {
      loadLeagues();
    }
  }, [user]);

  useEffect(() => {
    if (currentLeague?.league_id && currentLeague.platform !== 'espn' && currentLeague.platform !== 'yahoo') {
      resolveUserRosterId(currentLeague);
    }
  }, [currentLeague?.league_id]);

  const resolveUserRosterId = async (league: UserLeague) => {
    try {
      const [rosters, users] = await Promise.all([
        fetchLeagueRosters(league.league_id),
        fetchLeagueUsers(league.league_id),
      ]);

      const storedTeamName = (league.team_name || '').toLowerCase().trim();

      const match = rosters.find((roster) => {
        const user = users.find((u) => u.user_id === roster.owner_id);
        if (!user) return false;
        const sleeperTeamName = (
          user.metadata?.team_name || user.display_name || user.username || ''
        ).toLowerCase().trim();
        return storedTeamName && sleeperTeamName === storedTeamName;
      });

      if (match) {
        setCurrentRosterId(match.roster_id.toString());
      } else if (rosters.length > 0) {
        setCurrentRosterId(rosters[0].roster_id.toString());
      }
    } catch {
      // silently keep default
    }
  };

  const loadLeagues = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_leagues')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setLeagues(data || []);
      if (data && data.length > 0 && !currentLeague) {
        setCurrentLeague(data[0]);
      }
    } catch (error) {
      console.error('Error loading leagues:', error);
      showToast('Failed to load your leagues. Please try refreshing the page.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLeague = async (
    leagueId: string,
    leagueName: string,
    teamName: string,
    isSuperflex: boolean,
    platform: 'sleeper' | 'espn' | 'yahoo' | 'nfl' = 'sleeper',
    platformSettings?: { espn_s2?: string; swid?: string; yahoo_access_token?: string }
  ) => {
    if (!user) return;

    setShowAddLeague(false);

    const optimisticLeague: UserLeague = {
      id: `optimistic-${leagueId}`,
      user_id: user.id,
      league_id: leagueId,
      league_name: leagueName || `League ${leagueId}`,
      team_name: teamName,
      is_superflex: isSuperflex,
      is_active: true,
      platform,
      platform_settings: platformSettings || {},
      created_at: new Date().toISOString(),
    };

    setLeagues(prev => {
      const exists = prev.some(l => l.league_id === leagueId);
      return exists ? prev : [optimisticLeague, ...prev];
    });
    setCurrentLeague(optimisticLeague);

    try {
      const { error } = await supabase.from('user_leagues')
        .upsert({
          user_id: user.id,
          league_id: leagueId,
          league_name: leagueName || `League ${leagueId}`,
          team_name: teamName,
          is_superflex: isSuperflex,
          is_active: true,
          platform: platform,
          platform_settings: platformSettings || {},
        }, {
          onConflict: 'user_id,league_id',
          ignoreDuplicates: false
        });

      if (error) throw error;

      showToast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} league added successfully!`, 'success');
      await loadLeagues();
    } catch (error: any) {
      console.error('Error adding league:', error);
      showToast('Failed to add league. Please try again.', 'error');
      setLeagues(prev => prev.filter(l => l.id !== optimisticLeague.id));
      setCurrentLeague(prev => prev?.id === optimisticLeague.id ? null : prev);
    }
  };

  const tabContentFallback = (
    <div className="py-4">
      <ListSkeleton count={4} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-fdp-bg-1 to-fdp-bg-0 flex flex-col">

      {/* ─── Header ─── */}
      <div className="glass border-b border-fdp-border-1 sticky top-0 z-40 shadow-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 py-3 flex-wrap">
            {/* Logo — horizontal wordmark on wide screens, shield on mobile */}
            <img
              src="/FDP1.png"
              alt="Fantasy Draft Pros"
              className="hidden sm:block h-9 w-auto object-contain flex-shrink-0"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <img
              src="/FDP2.png"
              alt="Fantasy Draft Pros"
              className="block sm:hidden h-9 w-auto object-contain flex-shrink-0"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />

            {/* League selector — compact, in header */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {loading ? (
                <div className="h-8 w-48 bg-fdp-surface-2 rounded animate-pulse" />
              ) : leagues.length === 0 ? (
                <button
                  onClick={() => setShowAddLeague(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gradient-to-r from-fdp-accent-1 to-fdp-accent-2 text-fdp-bg-0 rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" /> Add League
                </button>
              ) : (
                <select
                  value={currentLeague?.id || ''}
                  onChange={(e) => {
                    const league = leagues.find(l => l.id === e.target.value);
                    setCurrentLeague(league || null);
                  }}
                  className="px-3 py-1.5 bg-fdp-surface-2 border border-fdp-border-1 text-fdp-text-1 rounded-lg text-sm focus:ring-2 focus:ring-fdp-accent-1 outline-none max-w-xs truncate"
                >
                  {leagues.map((league) => (
                    <option key={league.id} value={league.id}>
                      {league.league_name}
                      {league.is_superflex ? ' · SF' : ''}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => setShowAddLeague(true)}
                title="Add league"
                className="p-1.5 bg-fdp-surface-2 hover:bg-fdp-border-1 text-fdp-text-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowManageLeagues(true)}
                title="Manage leagues"
                className="p-1.5 bg-fdp-surface-2 hover:bg-fdp-border-1 text-fdp-text-2 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* Right-side controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <SubscriptionBadge onUpgrade={() => { setUpgradeFeature(undefined); setShowUpgradeModal(true); }} />
              <AlertsDropdown onSelectPlayer={(playerId) => setSelectedPlayerId(playerId)} />
              <button
                onClick={signOut}
                title="Sign out"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-fdp-surface-2 hover:bg-fdp-border-1 text-fdp-text-2 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* ─── Primary nav tabs ─── */}
          <div className="flex gap-0 pb-0 overflow-x-auto">
            {([
              { id: 'trade', label: 'Trade', icon: ArrowLeftRight },
              { id: 'league', label: 'My League', icon: Trophy },
              { id: 'rankings', label: 'Rankings', icon: BarChart2 },
              { id: 'reports', label: 'Reports', icon: FileText },
              ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Lock }] : []),
            ] as { id: PrimaryTab; label: string; icon: any }[]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => switchPrimary(id)}
                className={`relative flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all duration-150 whitespace-nowrap ${
                  primaryTab === id
                    ? 'text-fdp-accent-2 text-glow'
                    : 'text-fdp-text-3 hover:text-fdp-text-1 hover:bg-fdp-surface-2/60'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform duration-150 ${primaryTab === id ? 'scale-110' : ''}`} />
                {label}
                {/* Active indicator bar — gradient with glow */}
                {primaryTab === id && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-fdp-accent-1 via-fdp-accent-glow to-fdp-accent-2 rounded-full shadow-glow" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow w-full">

        {/* Onboarding callout — shown to new users with no leagues */}
        {!loading && leagues.length === 0 && !onboardingDismissed && (
          <div className="mb-5 relative overflow-hidden rounded-xl border border-fdp-accent-1/40 bg-gradient-to-r from-fdp-accent-1/10 to-fdp-accent-2/5 p-4 animate-fade-up">
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top left, rgba(124,58,237,0.12) 0%, transparent 60%)' }} />
            <div className="relative flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-fdp-accent-1/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Trophy className="w-5 h-5 text-fdp-accent-2" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-fdp-text-1 text-sm">Connect your league to unlock everything</p>
                <p className="text-fdp-text-3 text-xs mt-1 leading-relaxed">
                  Add your Sleeper, ESPN, or Yahoo league to get Power Rankings, Team Advice, Waiver Wire, and personalized trade suggestions.
                </p>
                <button
                  onClick={() => setShowAddLeague(true)}
                  className="mt-3 btn-primary py-1.5 px-4 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Your League
                </button>
              </div>
              <button
                onClick={() => { setOnboardingDismissed(true); localStorage.setItem('fdp_onboarding_dismissed', '1'); }}
                className="p-1 text-fdp-text-3 hover:text-fdp-text-1 transition-colors flex-shrink-0"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Usage meters (free users) */}
        {!isPro && (
          <div className="grid sm:grid-cols-2 gap-3 mb-5">
            <UsageMeter feature="trade_calc" onUpgrade={() => { setUpgradeFeature('Unlimited Trade Calculations'); setShowUpgradeModal(true); }} />
            <UsageMeter feature="league_import" onUpgrade={() => { setUpgradeFeature('Unlimited League Imports'); setShowUpgradeModal(true); }} />
          </div>
        )}

        {/* Player detail overlay */}
        {selectedPlayerId && (
          <Suspense fallback={tabContentFallback}>
            <PlayerDetail playerId={selectedPlayerId} onBack={() => setSelectedPlayerId(null)} />
          </Suspense>
        )}

        {!selectedPlayerId && (
          <>
            {/* ─── TRADE TAB ─── */}
            {primaryTab === 'trade' && (
              <div className="space-y-4">
                <SubNav
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  items={[
                    { tab: 'trade', label: 'Analyzer', icon: TrendingUp },
                    { tab: 'history', label: 'History', icon: History },
                    { tab: 'tradeFinder', label: 'Find Trades', icon: ArrowLeftRight },
                    { tab: 'counterOffer', label: 'Counter Offer', icon: RefreshCw },
                    { tab: 'tradeBlock', label: 'Trade Block', icon: ShoppingCart },
                  ]}
                />
                <Suspense fallback={tabContentFallback}>
                  {activeTab === 'trade' && <TradeAnalyzer leagueId={currentLeague?.league_id} onTradeSaved={() => setActiveTab('history')} />}
                  {activeTab === 'history' && <TradeHistory leagueId={currentLeague?.league_id ?? ''} />}
                  {activeTab === 'tradeFinder' && <TradeFinder leagueId={currentLeague?.league_id ?? ''} rosterId={currentRosterId} />}
                  {activeTab === 'counterOffer' && <CounterOfferGenerator />}
                  {activeTab === 'tradeBlock' && <TradeBlockMarketplace leagueId={currentLeague?.league_id ?? ''} userId={user?.id || ''} />}
                </Suspense>
              </div>
            )}

            {/* ─── MY LEAGUE TAB ─── */}
            {primaryTab === 'league' && (
              <div className="space-y-4">
                <SubNav
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  items={[
                    { tab: 'rankings', label: 'Power Rankings', icon: Trophy },
                    { tab: 'playoffs', label: 'Playoff Odds', icon: Activity },
                    { tab: 'championship', label: 'Championship', icon: Award },
                    { tab: 'teamAdvice', label: 'Team Advice', icon: Target },
                    { tab: 'health', label: 'Roster Health', icon: Calendar },
                    { tab: 'waiver', label: 'Waiver Wire', icon: Search },
                    { tab: 'lineup', label: 'Lineup', icon: Users },
                    { tab: 'rivalry', label: 'Rivalry', icon: Swords },
                    { tab: 'recap', label: 'Recap', icon: FileText },
                    { tab: 'chat', label: 'Chat', icon: MessageCircle },
                    { tab: 'notifications', label: 'Alerts', icon: Bell },
                    { tab: 'sleeperAnalysis', label: 'Import', icon: Upload },
                  ]}
                />
                <Suspense fallback={tabContentFallback}>
                  {activeTab === 'rankings' && <PowerRankings leagueId={currentLeague?.league_id ?? ''} />}
                  {activeTab === 'playoffs' && <PlayoffSimulator leagueId={currentLeague?.league_id ?? ''} />}
                  {activeTab === 'championship' && <ChampionshipCalculator leagueId={currentLeague?.league_id ?? ''} />}
                  {activeTab === 'teamAdvice' && <TeamAdvice sleeperLeagueId={currentLeague?.league_id} />}
                  {activeTab === 'health' && <RosterHealth leagueId={currentLeague?.league_id ?? ''} rosterId={currentRosterId} />}
                  {activeTab === 'waiver' && <WaiverAssistant leagueId={currentLeague?.league_id ?? ''} rosterId={currentRosterId} userId={user?.id || ''} />}
                  {activeTab === 'lineup' && <LineupOptimizer leagueId={currentLeague?.league_id ?? ''} rosterId={currentRosterId} />}
                  {activeTab === 'rivalry' && <RivalryTracker leagueId={currentLeague?.league_id ?? ''} />}
                  {activeTab === 'recap' && <WeeklyRecap leagueId={currentLeague?.league_id ?? ''} />}
                  {activeTab === 'chat' && <LeagueChat leagueId={currentLeague?.league_id || ''} userId={user?.id || ''} username={user?.email || 'User'} />}
                  {activeTab === 'notifications' && <NotificationsPanel userId={user?.id || ''} leagueId={currentLeague?.league_id ?? ''} />}
                  {activeTab === 'sleeperAnalysis' && <SleeperLeagueAnalysis />}
                </Suspense>
              </div>
            )}

            {/* ─── RANKINGS TAB ─── */}
            {primaryTab === 'rankings' && (
              <div className="space-y-4">
                <SubNav
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  items={[
                    { tab: 'values', label: 'Player Values', icon: DollarSign },
                    { tab: 'unifiedRankings', label: 'All Rankings', icon: BarChart2 },
                    { tab: 'ktcRankings', label: 'QBs', icon: Zap },
                    { tab: 'ktcRBRankings', label: 'RBs', icon: Activity },
                    { tab: 'ktcWRRankings', label: 'WRs', icon: Radio },
                    { tab: 'ktcTERankings', label: 'TEs', icon: Shield },
                    { tab: 'idpRankings', label: 'IDP', icon: Users },
                    { tab: 'pickValues', label: 'Rookie Picks', icon: Calendar },
                    { tab: 'trending', label: 'Trending', icon: TrendingUp },
                    { tab: 'market', label: 'Market', icon: Activity },
                    { tab: 'trends', label: 'Value Trends', icon: TrendingUp },
                    { tab: 'watchlist', label: 'Watchlist', icon: Award },
                    { tab: 'draft', label: 'Draft Kit', icon: Clipboard },
                    { tab: 'keeper', label: 'Keeper Calc', icon: Shield },
                    { tab: 'compare', label: 'Compare', icon: ArrowLeftRight },
                  ]}
                />
                <Suspense fallback={tabContentFallback}>
                  {activeTab === 'compare' && <PlayerCompareWidget />}
                  {activeTab === 'values' && <PlayerValues leagueId={currentLeague?.league_id ?? ''} isSuperflex={currentLeague?.is_superflex ?? false} />}
                  {activeTab === 'unifiedRankings' && <UnifiedRankings />}
                  {activeTab === 'ktcRankings' && <KTCQBRankings />}
                  {activeTab === 'ktcRBRankings' && <KTCRBRankings />}
                  {activeTab === 'ktcWRRankings' && <KTCWRRankings />}
                  {activeTab === 'ktcTERankings' && <KTCTERankings />}
                  {activeTab === 'idpRankings' && <IDPRankings />}
                  {activeTab === 'pickValues' && <RookiePickValues />}
                  {activeTab === 'trending' && <TrendingPlayersPanel />}
                  {activeTab === 'market' && <MarketTrends onSelectPlayer={(playerId) => setSelectedPlayerId(playerId)} />}
                  {activeTab === 'trends' && <ValueTrendTracker leagueId={currentLeague?.league_id ?? ''} />}
                  {activeTab === 'watchlist' && <WatchlistPanel onSelectPlayer={(playerId) => setSelectedPlayerId(playerId)} />}
                  {activeTab === 'draft' && <DraftKit leagueId={currentLeague?.league_id ?? ''} userId={user?.id || ''} />}
                  {activeTab === 'keeper' && <KeeperCalculator leagueId={currentLeague?.league_id ?? ''} rosterId={currentRosterId} />}
                </Suspense>
              </div>
            )}

            {/* ─── REPORTS TAB ─── */}
            {primaryTab === 'reports' && (
              <div className="space-y-4">
                <SubNav
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  items={[
                    { tab: 'reports', label: 'Dynasty Reports', icon: FileText },
                    { tab: 'news', label: 'Player News', icon: Newspaper },
                    { tab: 'export', label: 'Export & Share', icon: Share2 },
                    { tab: 'pricing', label: 'Upgrade to Pro', icon: Sparkles },
                    { tab: 'contact', label: 'Contact', icon: Mail },
                  ]}
                />
                <Suspense fallback={tabContentFallback}>
                  {activeTab === 'reports' && (
                    <DynastyReportsIndex
                      onSelectReport={(slug) => { setSelectedReportSlug(slug); setActiveTab('reportDetail'); }}
                    />
                  )}
                  {activeTab === 'reportDetail' && selectedReportSlug && (
                    <DynastyReportPage
                      slug={selectedReportSlug}
                      onBack={() => setActiveTab('reports')}
                      onSelectPlayer={(playerId) => setSelectedPlayerId(playerId)}
                    />
                  )}
                  {activeTab === 'news' && <PlayerNewsFeed />}
                  {activeTab === 'export' && <ExportShare leagueId={currentLeague?.league_id || ''} rosterId={currentRosterId} />}
                  {activeTab === 'pricing' && <PricingPage onBack={() => switchPrimary('trade')} />}
                  {activeTab === 'contact' && <Contact />}
                </Suspense>
              </div>
            )}

            {/* ─── ADMIN TAB (admin only) ─── */}
            {primaryTab === 'admin' && isAdmin && (
              <div className="space-y-4">
                <SubNav
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  items={[
                    { tab: 'adminSync', label: 'System', icon: RefreshCw },
                    { tab: 'ktcAdmin', label: 'KTC Sync', icon: Shield },
                    { tab: 'valueTuner', label: 'Value Tuner', icon: Sliders },
                    { tab: 'rbContext', label: 'RB Context', icon: Edit },
                    { tab: 'rbSuggestions', label: 'RB AI', icon: Sparkles },
                    { tab: 'ktcMultiSync', label: 'Multi Sync', icon: RefreshCw },
                    { tab: 'headshotAdmin', label: 'Headshots', icon: Users },
                    { tab: 'idpUpload', label: 'IDP Upload', icon: Upload },
                  ]}
                />
                <Suspense fallback={tabContentFallback}>
                  {activeTab === 'adminSync' && <AdminSyncHub />}
                  {activeTab === 'ktcAdmin' && <KTCAdminSync />}
                  {activeTab === 'valueTuner' && <ValueFineTuner />}
                  {activeTab === 'rbContext' && <RBContextEditor />}
                  {activeTab === 'rbSuggestions' && <RBContextSuggestions />}
                  {activeTab === 'ktcMultiSync' && <KTCMultiPositionSync />}
                  {activeTab === 'headshotAdmin' && <HeadshotAdmin />}
                  {activeTab === 'idpUpload' && <IDPAdminUpload />}
                </Suspense>
              </div>
            )}
          </>
        )}
      </div>

      <Footer onNavigate={onNavigate} />

      {/* Modals */}
      {showAddLeague && <AddLeagueModal onClose={() => setShowAddLeague(false)} onAdd={handleAddLeague} />}
      {showManageLeagues && <LeagueManager leagues={leagues} onClose={() => setShowManageLeagues(false)} onUpdate={loadLeagues} />}
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} feature={upgradeFeature} />}
    </div>
  );
}

interface SubNavItem {
  tab: TabType;
  label: string;
  icon: any;
}

interface SubNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  items: SubNavItem[];
}

function SubNav({ activeTab, setActiveTab, items }: SubNavProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
      {items.map(({ tab, label, icon: Icon }) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex-shrink-0 whitespace-nowrap ${
            activeTab === tab
              ? 'bg-gradient-to-r from-fdp-accent-1 to-fdp-accent-2 text-fdp-bg-0 shadow'
              : 'bg-fdp-surface-1 border border-fdp-border-1 text-fdp-text-2 hover:border-fdp-accent-1 hover:text-fdp-text-1'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

interface AddLeagueModalProps {
  onClose: () => void;
  onAdd: (
    leagueId: string,
    leagueName: string,
    teamName: string,
    isSuperflex: boolean,
    platform: 'sleeper' | 'espn' | 'yahoo' | 'nfl',
    platformSettings?: { espn_s2?: string; swid?: string; yahoo_access_token?: string }
  ) => void;
}

function AddLeagueModal({ onClose, onAdd }: AddLeagueModalProps) {
  const [platform, setPlatform] = useState<'sleeper' | 'espn' | 'yahoo' | 'nfl'>('sleeper');
  const [step, setStep] = useState<'platform' | 'username' | 'leagues' | 'manual'>('platform');
  const [username, setUsername] = useState('');
  const [leagues, setLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leagueId, setLeagueId] = useState('');
  const [leagueName, setLeagueName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [isSuperflex, setIsSuperflex] = useState(false);
  const [espnS2, setEspnS2] = useState('');
  const [swid, setSwid] = useState('');

  const handlePlatformSelect = (selectedPlatform: 'sleeper' | 'espn' | 'yahoo' | 'nfl') => {
    setPlatform(selectedPlatform);
    if (selectedPlatform === 'sleeper') {
      setStep('username');
    } else {
      setStep('manual');
    }
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a Sleeper username');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userRes = await fetch(`https://api.sleeper.app/v1/user/${username.trim()}`);
      if (!userRes.ok) {
        setError('Sleeper user not found. Please check the username.');
        setLoading(false);
        return;
      }

      const userData = await userRes.json();
      const userId = userData.user_id;

      const leaguesRes = await fetch(`https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${SEASON_CONTEXT.league_year}`);
      if (!leaguesRes.ok) {
        setError('Failed to fetch leagues');
        setLoading(false);
        return;
      }

      const leaguesData = await leaguesRes.json();
      setLeagues(leaguesData);
      setStep('leagues');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leagues');
    } finally {
      setLoading(false);
    }
  };

  const handleLeagueSelect = async (league: any) => {
    setLoading(true);
    setError(null);
    try {
      const isSuperflex = league.roster_positions?.filter((pos: string) => pos === 'SUPER_FLEX').length > 0;

      let teamName = username;
      try {
        const usersRes = await fetch(`https://api.sleeper.app/v1/league/${league.league_id}/users`);
        if (usersRes.ok) {
          const users = await usersRes.json();
          const userRoster = users.find((u: any) =>
            u.display_name?.toLowerCase() === username.toLowerCase() ||
            u.username?.toLowerCase() === username.toLowerCase()
          );
          teamName = userRoster?.metadata?.team_name || userRoster?.display_name || username;
        }
      } catch {
        // fallback to username as team name
      }

      await onAdd(league.league_id, league.name, teamName, isSuperflex, 'sleeper');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add league. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueId.trim()) {
      alert('Please enter a League ID');
      return;
    }
    if (platform === 'espn' && (!espnS2.trim() || !swid.trim())) {
      alert('ESPN leagues require both espn_s2 and SWID cookies');
      return;
    }
    onAdd(leagueId.trim(), leagueName.trim(), teamName.trim(), isSuperflex, platform, {
      espn_s2: espnS2.trim(),
      swid: swid.trim(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-fdp-surface-1 border border-fdp-border-1 rounded-lg shadow-xl max-w-2xl w-full p-6 my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-fdp-text-1">Add New League</h3>
          <button onClick={onClose} className="text-fdp-text-3 hover:text-fdp-text-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        {step === 'platform' && (
          <div className="space-y-4">
            <p className="text-fdp-text-2 mb-4">Choose your fantasy platform:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handlePlatformSelect('sleeper')}
                className="p-6 border-2 border-fdp-border-1 rounded-lg hover:border-fdp-accent-1 hover:bg-fdp-surface-2 transition-all"
              >
                <div className="text-4xl mb-2">🛌</div>
                <div className="font-bold text-fdp-text-1">Sleeper</div>
                <div className="text-xs text-fdp-text-3 mt-1">Find by username</div>
              </button>
              <button
                onClick={() => handlePlatformSelect('espn')}
                className="p-6 border-2 border-fdp-border-1 rounded-lg hover:border-fdp-accent-1 hover:bg-fdp-surface-2 transition-all"
              >
                <div className="text-4xl mb-2">🏈</div>
                <div className="font-bold text-fdp-text-1">ESPN</div>
                <div className="text-xs text-fdp-text-3 mt-1">Manual setup</div>
              </button>
              <button
                disabled
                className="p-6 border-2 border-fdp-border-1 rounded-lg opacity-50 cursor-not-allowed"
              >
                <div className="text-4xl mb-2">🟣</div>
                <div className="font-bold text-fdp-text-1">Yahoo</div>
                <div className="text-xs text-fdp-text-3 mt-1">Coming soon</div>
              </button>
              <button
                disabled
                className="p-6 border-2 border-fdp-border-1 rounded-lg opacity-50 cursor-not-allowed"
              >
                <div className="text-4xl mb-2">🏆</div>
                <div className="font-bold text-fdp-text-1">NFL.com</div>
                <div className="text-xs text-fdp-text-3 mt-1">Coming soon</div>
              </button>
            </div>
          </div>
        )}

        {step === 'username' && (
          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-fdp-surface-2 rounded-full mb-3">
                <Search className="w-8 h-8 text-fdp-accent-1" />
              </div>
              <h4 className="text-lg font-semibold text-fdp-text-1 mb-2">Find Your Sleeper Leagues</h4>
              <p className="text-sm text-fdp-text-3">Enter your Sleeper username to view all your leagues</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-fdp-text-2 mb-2">
                Sleeper Username
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fdp-text-3 w-5 h-5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your Sleeper username"
                  className="w-full pl-10 pr-4 py-3 bg-fdp-surface-2 border border-fdp-border-1 text-fdp-text-1 rounded-lg focus:ring-2 focus:ring-fdp-accent-1 focus:border-transparent outline-none"
                  disabled={loading}
                />
              </div>
              <p className="mt-2 text-xs text-fdp-text-3">
                Your Sleeper username (not email). No authentication required.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-900 bg-opacity-20 border border-red-500 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || !username.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-fdp-accent-1 to-fdp-accent-2 text-fdp-bg-0 font-semibold py-3 px-4 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Find My Leagues
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setStep('platform')}
                className="px-4 py-2 bg-fdp-surface-2 hover:bg-fdp-border-1 text-fdp-text-1 rounded-lg transition-all"
              >
                Back
              </button>
            </div>
          </form>
        )}

        {step === 'leagues' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-fdp-text-1">Select a League</h4>
                <p className="text-sm text-fdp-text-3">Found {leagues.length} league(s) for {username}</p>
              </div>
              <button
                onClick={() => {
                  setStep('username');
                  setLeagues([]);
                  setError(null);
                }}
                className="text-sm text-fdp-accent-1 hover:underline"
              >
                Change Username
              </button>
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-3 py-4 text-fdp-text-2">
                <RefreshCw className="w-5 h-5 animate-spin text-fdp-accent-1" />
                <span>Adding league...</span>
              </div>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {leagues.map((league) => (
                <button
                  key={league.league_id}
                  onClick={() => handleLeagueSelect(league)}
                  disabled={loading}
                  className="w-full p-4 border border-fdp-border-1 rounded-lg hover:border-fdp-accent-1 hover:bg-fdp-surface-2 transition-all text-left disabled:opacity-60 disabled:cursor-wait"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-semibold text-fdp-text-1">{league.name}</h5>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <span className="text-xs px-2 py-1 bg-fdp-surface-2 text-fdp-text-3 rounded-full">
                          {league.total_rosters} Teams
                        </span>
                        <span className="text-xs px-2 py-1 bg-fdp-surface-2 text-fdp-text-3 rounded-full">
                          {league.season}
                        </span>
                        {league.roster_positions?.includes('SUPER_FLEX') && (
                          <span className="text-xs px-2 py-1 bg-fdp-accent-1 bg-opacity-20 text-fdp-accent-2 rounded-full">
                            Superflex
                          </span>
                        )}
                        <span className="text-xs px-2 py-1 bg-fdp-surface-2 text-fdp-text-3 rounded-full capitalize">
                          {league.status}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-fdp-text-3 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="p-3 bg-fdp-surface-2 rounded-lg mb-4">
              <p className="text-sm text-fdp-text-2">
                {platform === 'espn' && 'ESPN leagues require authentication cookies. Follow the instructions below.'}
                {platform === 'yahoo' && 'Yahoo integration is coming soon.'}
                {platform === 'nfl' && 'NFL.com integration is coming soon.'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-fdp-text-2 mb-1">
                League ID *
              </label>
              <input
                type="text"
                value={leagueId}
                onChange={(e) => setLeagueId(e.target.value)}
                className="w-full px-4 py-2 bg-fdp-surface-2 border border-fdp-border-1 text-fdp-text-1 rounded-lg focus:ring-2 focus:ring-fdp-accent-1 focus:border-transparent outline-none"
                placeholder="Enter league ID"
                required
              />
            </div>

            {platform === 'espn' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-fdp-text-2 mb-1">
                    espn_s2 Cookie *
                  </label>
                  <input
                    type="text"
                    value={espnS2}
                    onChange={(e) => setEspnS2(e.target.value)}
                    className="w-full px-4 py-2 bg-fdp-surface-2 border border-fdp-border-1 text-fdp-text-1 rounded-lg focus:ring-2 focus:ring-fdp-accent-1 focus:border-transparent outline-none font-mono text-xs"
                    placeholder="Long alphanumeric string"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-fdp-text-2 mb-1">
                    SWID Cookie *
                  </label>
                  <input
                    type="text"
                    value={swid}
                    onChange={(e) => setSwid(e.target.value)}
                    className="w-full px-4 py-2 bg-fdp-surface-2 border border-fdp-border-1 text-fdp-text-1 rounded-lg focus:ring-2 focus:ring-fdp-accent-1 focus:border-transparent outline-none font-mono text-xs"
                    placeholder="{XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-fdp-text-2 mb-1">
                League Name (optional)
              </label>
              <input
                type="text"
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                className="w-full px-4 py-2 bg-fdp-surface-2 border border-fdp-border-1 text-fdp-text-1 rounded-lg focus:ring-2 focus:ring-fdp-accent-1 focus:border-transparent outline-none"
                placeholder="My League"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fdp-text-2 mb-1">
                Your Team Name (optional)
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-4 py-2 bg-fdp-surface-2 border border-fdp-border-1 text-fdp-text-1 rounded-lg focus:ring-2 focus:ring-fdp-accent-1 focus:border-transparent outline-none"
                placeholder="My Team"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isSuperflex"
                checked={isSuperflex}
                onChange={(e) => setIsSuperflex(e.target.checked)}
                className="w-4 h-4 text-fdp-accent-1 border-fdp-border-1 rounded focus:ring-fdp-accent-1"
              />
              <label htmlFor="isSuperflex" className="text-sm font-medium text-fdp-text-2">
                Superflex League?
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-fdp-accent-1 to-fdp-accent-2 text-fdp-bg-0 font-semibold py-2 px-4 rounded-lg hover:shadow-lg transition-all"
              >
                Add League
              </button>
              <button
                type="button"
                onClick={() => setStep('platform')}
                className="px-4 py-2 bg-fdp-surface-2 hover:bg-fdp-border-1 text-fdp-text-1 rounded-lg transition-all"
              >
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
