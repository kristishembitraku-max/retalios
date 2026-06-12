import { type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Illustration backdrop */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/10 to-violet-500/10 blur-2xl scale-150" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-gray-800 bg-gray-900 shadow-xl shadow-black/30">
          <Icon className="h-9 w-9 text-indigo-400" />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-gray-400 leading-relaxed">{description}</p>

      {action && (
        <div className="mt-6">
          <Button variant="gradient" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
