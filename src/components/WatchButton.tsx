import { Bell } from 'lucide-react';

interface WatchButtonProps {
  playerId: string;
  isWatched: boolean;
  onToggle: (playerId: string) => void;
  size?: 'sm' | 'md';
}

export function WatchButton({ playerId, isWatched, onToggle, size = 'sm' }: WatchButtonProps) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(playerId); }}
      title={isWatched ? 'Remove from watchlist' : 'Watch for value alerts'}
      className={`flex items-center justify-center rounded-md transition-all flex-shrink-0 ${
        size === 'sm' ? 'w-7 h-7' : 'w-8 h-8'
      } ${
        isWatched
          ? 'text-fdp-accent-2 bg-fdp-accent-1/15 hover:bg-fdp-accent-1/25'
          : 'text-fdp-text-3 hover:text-fdp-accent-2 hover:bg-fdp-accent-1/10'
      }`}
    >
      <Bell className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${isWatched ? 'fill-current' : ''}`} />
    </button>
  );
}
