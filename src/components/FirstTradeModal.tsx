import { X, Bell, Share2, UserPlus } from 'lucide-react';

interface FirstTradeModalProps {
  onClose: () => void;
  onShareTrade: () => void;
  onSignUp: () => void;
}

export function FirstTradeModal({ onClose, onShareTrade, onSignUp }: FirstTradeModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-fdp-surface-1 border border-fdp-border-1 rounded-2xl p-6 max-w-sm w-full shadow-card-lg animate-fade-up">
        <div className="flex items-start justify-between mb-4">
          <div className="text-2xl">🏈</div>
          <button onClick={onClose} className="text-fdp-text-3 hover:text-fdp-text-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <h2 className="text-lg font-bold text-fdp-text-1 mb-1">Nice trade analysis!</h2>
        <p className="text-sm text-fdp-text-2 mb-5">
          Get more out of Fantasy Draft Pros — share your analysis or create a free account to track player value alerts and import your leagues.
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => { onShareTrade(); onClose(); }}
            className="flex items-center gap-2 justify-center px-4 py-2.5 bg-fdp-surface-2 border border-fdp-border-1 hover:border-fdp-accent-1/50 text-fdp-text-1 rounded-lg text-sm font-medium transition-all"
          >
            <Share2 className="w-4 h-4 text-fdp-accent-1" />
            Share this trade
          </button>
          <button
            onClick={() => { onClose(); }}
            className="flex items-center gap-2 justify-center px-4 py-2.5 bg-fdp-surface-2 border border-fdp-border-1 hover:border-fdp-accent-1/50 text-fdp-text-1 rounded-lg text-sm font-medium transition-all"
          >
            <Bell className="w-4 h-4 text-fdp-accent-2" />
            Watch players for value alerts
          </button>
          <button
            onClick={() => { onSignUp(); onClose(); }}
            className="btn-primary py-2.5 text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Create free account
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-3 text-xs text-fdp-text-3 hover:text-fdp-text-2 transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
