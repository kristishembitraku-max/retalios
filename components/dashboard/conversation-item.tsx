'use client';

import { formatDistanceToNow, parseISO } from 'date-fns';
import { cn, getInitials, truncate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { SentimentLabel, BuyingStage } from '@/types';

interface ConversationItemProps {
  id: string;
  customerName?: string | null;
  customerEmail?: string | null;
  botName?: string;
  lastMessage?: string;
  timestamp: string;
  sentiment?: SentimentLabel | null;
  buyingStage?: BuyingStage | null;
  unread?: boolean;
  onClick?: () => void;
}

const sentimentConfig: Record<
  SentimentLabel,
  { label: string; variant: 'success' | 'warning' | 'danger' }
> = {
  positive: { label: 'Positive', variant: 'success' },
  neutral: { label: 'Neutral', variant: 'warning' },
  negative: { label: 'Negative', variant: 'danger' },
};

const stageConfig: Record<
  BuyingStage,
  { label: string; color: string }
> = {
  awareness: { label: 'Awareness', color: 'text-gray-400' },
  interest: { label: 'Interest', color: 'text-blue-400' },
  consideration: { label: 'Consideration', color: 'text-indigo-400' },
  intent: { label: 'Intent', color: 'text-violet-400' },
  evaluation: { label: 'Evaluation', color: 'text-yellow-400' },
  purchase: { label: 'Purchase', color: 'text-emerald-400' },
};

export function ConversationItem({
  customerName,
  customerEmail,
  botName,
  lastMessage,
  timestamp,
  sentiment,
  buyingStage,
  unread = false,
  onClick,
}: ConversationItemProps) {
  const displayName = customerName || customerEmail || 'Anonymous';
  const initials = getInitials(displayName);
  const timeAgo = (() => {
    try {
      return formatDistanceToNow(parseISO(timestamp), { addSuffix: true });
    } catch {
      return '';
    }
  })();

  const sentimentInfo = sentiment ? sentimentConfig[sentiment] : null;
  const stageInfo = buyingStage ? stageConfig[buyingStage] : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-gray-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
        unread && 'bg-gray-800/30'
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-semibold shadow-md shadow-indigo-900/30">
          {initials}
        </div>
        {unread && (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-indigo-500 border-2 border-gray-900" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn('text-sm font-medium truncate', unread ? 'text-white' : 'text-gray-200')}>
            {displayName}
          </span>
          <span className="text-xs text-gray-500 shrink-0">{timeAgo}</span>
        </div>

        {customerEmail && customerName && (
          <p className="text-xs text-gray-500 truncate">{customerEmail}</p>
        )}

        {lastMessage && (
          <p className={cn('mt-0.5 text-xs truncate', unread ? 'text-gray-300' : 'text-gray-500')}>
            {truncate(lastMessage, 80)}
          </p>
        )}

        {/* Badges */}
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          {botName && (
            <span className="text-xs text-gray-600 bg-gray-800 rounded px-1.5 py-0.5">
              {botName}
            </span>
          )}
          {sentimentInfo && (
            <Badge variant={sentimentInfo.variant} className="text-[10px] py-0">
              {sentimentInfo.label}
            </Badge>
          )}
          {stageInfo && (
            <span className={cn('text-[10px] font-medium', stageInfo.color)}>
              {stageInfo.label}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
