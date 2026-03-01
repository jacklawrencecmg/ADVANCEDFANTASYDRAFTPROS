/**
 * Welcome Step
 *
 * First impression - Sets expectations:
 * - Personalized insights in 60 seconds
 * - League-aware valuations
 * - Proactive opportunities
 */

import React from 'react';
import { TrendingUp, Target, Bell, Zap } from 'lucide-react';

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-fdp-text-1 mb-4">
          Welcome to Dynasty Dominator
        </h1>
        <p className="text-xl text-fdp-text-2">
          Get personalized insights for <span className="font-bold text-blue-600">your team</span> in 60 seconds
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <FeatureCard
          icon={<Target className="w-8 h-8 text-blue-600" />}
          title="League-Aware Values"
          description="We adjust for YOUR league settings — not generic rankings"
        />

        <FeatureCard
          icon={<TrendingUp className="w-8 h-8 text-green-600" />}
          title="Instant Team Analysis"
          description="See your strengths, weaknesses, and opportunities immediately"
        />

        <FeatureCard
          icon={<Bell className="w-8 h-8 text-purple-600" />}
          title="Proactive Alerts"
          description="Get notified about buy-lows, sell-highs, and breakouts"
        />

        <FeatureCard
          icon={<Zap className="w-8 h-8 text-yellow-600" />}
          title="Smart Trade Calculator"
          description="Fairness checks with league context and team strategy"
        />
      </div>

      {/* CTA */}
      <div className="text-center">
        <button
          onClick={onNext}
          className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Get Started
        </button>

        <p className="mt-4 text-sm text-fdp-text-3">No credit card required • Free to try</p>
      </div>

      {/* Trust Signals */}
      <div className="mt-16 pt-8 border-t border-fdp-border-1">
        <div className="grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-fdp-text-1 mb-1">10,000+</div>
            <div className="text-sm text-fdp-text-2">Active Users</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-fdp-text-1 mb-1">1M+</div>
            <div className="text-sm text-fdp-text-2">Trades Analyzed</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-fdp-text-1 mb-1">95%</div>
            <div className="text-sm text-fdp-text-2">Accuracy Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-fdp-surface-1 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">{icon}</div>
        <div>
          <h3 className="text-lg font-bold text-fdp-text-1 mb-2">{title}</h3>
          <p className="text-fdp-text-2">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default WelcomeStep;
