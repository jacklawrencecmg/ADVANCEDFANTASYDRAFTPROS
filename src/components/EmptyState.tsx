import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-fdp-accent-1 to-fdp-accent-2 opacity-20 blur-3xl rounded-full"></div>
        <div className="relative bg-fdp-surface-2 rounded-2xl p-6 border border-fdp-border-1">
          <Icon className="w-16 h-16 text-fdp-accent-1" />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-fdp-text-1 mb-2">{title}</h3>
      <p className="text-fdp-text-3 max-w-md mb-6 leading-relaxed">{description}</p>

      {action && (
        <button
          onClick={action.onClick}
          className="bg-gradient-to-r from-fdp-accent-1 to-fdp-accent-2 text-fdp-bg-0 px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-fdp-accent-1/50 transition-all duration-300 hover:scale-105"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
