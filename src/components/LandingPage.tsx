import { useState } from 'react';
import TradeAnalyzer from './TradeAnalyzer';
import { TodayInDynasty } from './TodayInDynasty';
import { LogIn, UserPlus, TrendingUp, Target, Bell, Users, BarChart2, Star, Shield, Zap, Trophy, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const result = await signUp(email, password);
        if (result.error) {
          setError(`Signup failed: ${result.error}`);
        } else {
          setSuccess('Account created successfully! You now have a 7-day Pro trial. Welcome!');
        }
      } else {
        const result = await signIn(email, password);
        if (result.error) {
          setError(result.error);
        }
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-fdp-bg-0 overflow-hidden">
        {/* Auth page orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="orb-1 hero-orb" />
          <div className="orb-2 hero-orb" />
        </div>

        <div className="relative z-10 max-w-md w-full animate-fade-up">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-5">
              <img
                src="/FDP2.png"
                alt="Fantasy Draft Pros Logo"
                className="h-28 w-auto object-contain drop-shadow-lg"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
            <h1 className="text-3xl font-black text-fdp-text-1 mb-1">Fantasy Draft Pros</h1>
            <p className="text-fdp-text-3 text-sm">Professional Dynasty Tools · $2.99/month</p>
          </div>

          <div className="bg-fdp-surface-1 rounded-2xl shadow-card-lg p-8 border border-fdp-border-1 gradient-border">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-fdp-accent-1 to-fdp-accent-2 text-white shadow-glow-sm'
                    : 'bg-fdp-surface-2 text-fdp-text-3 hover:bg-fdp-border-1 hover:text-fdp-text-2'
                }`}
              >
                <LogIn className="inline-block w-4 h-4 mr-2" />
                Login
              </button>
              <button
                onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
                className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
                  mode === 'signup'
                    ? 'bg-gradient-to-r from-fdp-accent-1 to-fdp-accent-2 text-white shadow-glow-sm'
                    : 'bg-fdp-surface-2 text-fdp-text-3 hover:bg-fdp-border-1 hover:text-fdp-text-2'
                }`}
              >
                <UserPlus className="inline-block w-4 h-4 mr-2" />
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-fdp-text-2 uppercase tracking-wide mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-base"
                  placeholder="your.email@example.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-fdp-text-2 uppercase tracking-wide mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-base"
                  placeholder="Enter password"
                  disabled={loading}
                />
              </div>

              {mode === 'signup' && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-semibold text-fdp-text-2 uppercase tracking-wide mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-base"
                    placeholder="Confirm password"
                    disabled={loading}
                  />
                </div>
              )}

              {error && (
                <div className="bg-fdp-neg/10 border border-fdp-neg/40 text-fdp-neg px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-fdp-pos/10 border border-fdp-pos/40 text-fdp-pos px-4 py-3 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-base rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Please wait...' : mode === 'signup' ? 'Start 7-Day Free Trial' : 'Sign In'}
              </button>
            </form>

            <button
              onClick={() => setShowAuth(false)}
              className="w-full mt-4 text-fdp-text-3 hover:text-fdp-text-1 transition-colors text-sm py-2"
            >
              ← Back to free trade analyzer
            </button>

            <div className="mt-5 p-4 bg-fdp-surface-2 border border-fdp-border-1 rounded-xl">
              <p className="text-xs font-bold text-fdp-accent-2 uppercase tracking-wider mb-2">Pro — $2.99/month includes:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {['Unlimited trades', 'League imports', 'Power rankings', 'Trade suggestions', 'Team advice', 'Market alerts', 'IDP presets', 'Value trends'].map(f => (
                  <div key={f} className="flex items-center gap-1.5 text-xs text-fdp-text-3">
                    <span className="w-1 h-1 rounded-full bg-fdp-accent-2 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const proFeatures = [
    { icon: Users,     label: 'League Import',         desc: 'Connect Sleeper, ESPN, or Yahoo. Get instant roster grades and personalized advice.' },
    { icon: TrendingUp,label: 'AI Trade Suggestions',  desc: 'Smart trade recommendations based on your roster needs and league dynamics.' },
    { icon: Target,    label: 'Team Strategy Advice',  desc: 'Rebuild or compete guidance to maximize your championship odds.' },
    { icon: Trophy,    label: 'Power Rankings',        desc: 'Weekly power rankings and playoff odds projections across your league.' },
    { icon: Bell,      label: 'Market Alerts',         desc: 'Get notified when player values spike so you can buy low or sell high.' },
    { icon: BarChart2, label: 'Player Trend Analytics',desc: 'Track value history, rising risers, falling fallers, and market consensus.' },
    { icon: Zap,       label: 'Waiver Wire Assistant', desc: 'Prioritized FAAB targets and streaming picks based on your specific needs.' },
    { icon: Star,      label: 'Watchlist & Alerts',    desc: 'Save players you\'re targeting and get alerted the moment their value changes.' },
    { icon: Shield,    label: 'Advanced IDP Presets',  desc: 'Accurate IDP values tuned to your scoring system with position multipliers.' },
  ];

  const rankingCards = [
    { href: '/dynasty-rankings', icon: BarChart2, title: 'Dynasty Rankings',  desc: 'Top 1000 dynasty values updated daily with tiers, trends, and trade analysis.' },
    { href: '/top1000',           icon: Trophy,   title: 'Top 1000 Values',   desc: 'Complete player value database, filterable by position and league settings.' },
    { href: '/trade-calculator',  icon: TrendingUp,title: 'Trade Calculator', desc: 'Instant fairness ratings for trades with picks, IDP, and FAAB included.' },
  ];

  return (
    <div className="min-h-screen bg-fdp-bg-0 overflow-x-hidden">
      {/* ─── Animated ambient background ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb-1 hero-orb" />
        <div className="orb-2 hero-orb" />
        <div className="orb-3 hero-orb" />
      </div>

      {/* ─── Header ─── */}
      <header className="glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/FDP2.png"
              alt="Fantasy Draft Pros"
              className="h-10 w-auto object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div>
              <div className="text-base font-black text-fdp-text-1 leading-tight">Fantasy Draft Pros</div>
              <div className="text-xs text-fdp-accent-2 font-semibold hidden sm:block">Dynasty Tools · $2.99/month</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setMode('login'); setShowAuth(true); }}
              className="btn-ghost py-2 px-4 text-sm"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
            <button
              onClick={() => { setMode('signup'); setShowAuth(true); }}
              className="btn-primary py-2 px-5 text-sm"
            >
              <UserPlus className="w-4 h-4" />
              Free Trial
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10">

        {/* ─── Hero ─── */}
        <section className="max-w-5xl mx-auto px-4 pt-12 sm:pt-20 pb-14 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-fdp-accent-1/10 border border-fdp-accent-1/30 rounded-full px-4 py-1.5 mb-8 animate-fade-up">
            <Zap className="w-3.5 h-3.5 text-fdp-accent-1" />
            <span className="text-xs font-bold text-fdp-accent-2 uppercase tracking-widest">Offensive · IDP · FAAB · Draft Picks</span>
          </div>

          {/* Headline */}
          <h1
            className="text-5xl sm:text-6xl md:text-7xl font-black mb-6 leading-[1.06] tracking-tight animate-fade-up"
            style={{ animationDelay: '0.08s' }}
          >
            <span className="text-gradient">Win Every Trade.</span>
            <br />
            <span className="text-fdp-text-1">Dominate Your Dynasty.</span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-fdp-text-3 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up"
            style={{ animationDelay: '0.16s' }}
          >
            The world's only analyzer combining offensive players, IDP, FAAB budget, and draft picks in one seamless trade calculator.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-wrap items-center justify-center gap-4 mb-14 animate-fade-up"
            style={{ animationDelay: '0.24s' }}
          >
            <button
              onClick={() => { setMode('signup'); setShowAuth(true); }}
              className="relative bg-gradient-to-r from-fdp-accent-1 to-fdp-accent-2 text-white font-bold py-3.5 px-9 rounded-full text-base hover:shadow-glow hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 overflow-hidden"
            >
              <span className="relative z-10">Start 7-Day Free Trial</span>
            </button>
            <button
              onClick={() => { setMode('login'); setShowAuth(true); }}
              className="text-fdp-text-2 font-semibold py-3.5 px-9 rounded-full border border-fdp-border-1 hover:border-fdp-accent-1/60 hover:text-fdp-text-1 hover:bg-fdp-accent-1/5 transition-all duration-200 text-base"
            >
              Sign In
            </button>
          </div>

          {/* Stats bar */}
          <div
            className="flex flex-wrap justify-center gap-x-10 gap-y-5 animate-fade-up"
            style={{ animationDelay: '0.32s' }}
          >
            {[
              { value: '9,000+', label: 'Players Ranked' },
              { value: '4',      label: 'League Platforms' },
              { value: '6',      label: 'Scoring Formats' },
              { value: 'Daily',  label: 'Value Updates' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="stat-hero-value">{value}</div>
                <div className="text-xs text-fdp-text-3 mt-0.5 font-medium uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Trade Analyzer ─── */}
        <section className="max-w-6xl mx-auto px-4 pb-16">
          <div className="gradient-border rounded-2xl overflow-hidden shadow-card-lg">
            <div className="bg-fdp-surface-2 px-6 py-4 border-b border-fdp-border-1 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-fdp-text-1">Dynasty Trade Analyzer</h2>
                <p className="text-xs text-fdp-text-3 mt-0.5">Free to use — no account required</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-fdp-accent-2 bg-fdp-accent-1/10 border border-fdp-accent-1/20 rounded-lg px-3 py-1.5">
                <Zap className="w-3.5 h-3.5 flex-shrink-0" />
                IDP · FAAB · Draft Picks
              </div>
            </div>
            <div className="bg-fdp-surface-1 p-4 sm:p-6">
              <TradeAnalyzer isGuest={true} />
            </div>
          </div>
        </section>

        {/* ─── Today in Dynasty ─── */}
        <section className="max-w-6xl mx-auto px-4 pb-16">
          <TodayInDynasty />
        </section>

        {/* ─── Rankings Cards ─── */}
        <section className="max-w-5xl mx-auto px-4 pb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-fdp-text-1 mb-3">Player Rankings & Values</h2>
            <p className="text-fdp-text-3 max-w-lg mx-auto text-sm leading-relaxed">
              Comprehensive dynasty values updated daily — filterable by position, league format, and scoring system.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {rankingCards.map(({ href, icon: Icon, title, desc }) => (
              <a key={href} href={href} className="card-feature group p-6">
                <div className="w-10 h-10 bg-fdp-accent-1/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-fdp-accent-1/20 transition-colors">
                  <Icon className="w-5 h-5 text-fdp-accent-1" />
                </div>
                <h3 className="text-base font-bold text-fdp-text-1 mb-2 group-hover:text-fdp-accent-2 transition-colors">{title}</h3>
                <p className="text-fdp-text-3 text-sm leading-relaxed mb-4">{desc}</p>
                <div className="flex items-center gap-1 text-xs font-semibold text-fdp-accent-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Explore <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* ─── Pro Features ─── */}
        <section className="max-w-6xl mx-auto px-4 pb-20">
          {/* Section header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-fdp-accent-1/10 border border-fdp-accent-1/30 rounded-full px-4 py-1.5 mb-5">
              <Star className="w-3.5 h-3.5 text-fdp-accent-2" />
              <span className="text-xs font-bold text-fdp-accent-2 uppercase tracking-widest">Pro Membership</span>
            </div>
            <h2 className="text-4xl font-black text-fdp-text-1 mb-4 leading-tight">
              Everything to{' '}
              <span className="text-gradient">Win Your League</span>
            </h2>
            <p className="text-fdp-text-3 max-w-xl mx-auto text-sm leading-relaxed">
              All the tools you need to dominate your dynasty league — in one place for less than a cup of coffee per month.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {proFeatures.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="card-feature group p-5">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 bg-fdp-accent-1/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-fdp-accent-1/20 transition-colors mt-0.5">
                    <Icon className="w-4 h-4 text-fdp-accent-1" />
                  </div>
                  <div>
                    <h3 className="font-bold text-fdp-text-1 text-sm mb-1">{label}</h3>
                    <p className="text-fdp-text-3 text-xs leading-relaxed">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Final CTA */}
          <div className="text-center mt-14">
            <button
              onClick={() => { setMode('signup'); setShowAuth(true); }}
              className="relative inline-flex items-center gap-3 bg-gradient-to-r from-fdp-accent-1 to-fdp-accent-2 text-white font-bold py-4 px-12 rounded-full text-base hover:shadow-glow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 overflow-hidden"
            >
              <span>Start 7-Day Free Trial</span>
              <span className="text-fdp-accent-glow font-medium text-sm">· Only $2.99/mo</span>
            </button>
            <p className="text-fdp-text-3 text-sm mt-3">Cancel anytime. No long-term commitment.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
