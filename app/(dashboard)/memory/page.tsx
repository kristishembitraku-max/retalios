'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Brain,
  ChevronDown,
  Search,
  Heart,
  Target,
  ShieldAlert,
  Sparkles,
  User,
  Info,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/dashboard/empty-state';
import { cn, formatDate } from '@/lib/utils';
import type { Memory, MemoryType, Bot } from '@/types';

// ─── Config ───────────────────────────────────────────────────

const MEMORY_TYPE_CONFIG: Record<
  MemoryType,
  {
    label: string;
    icon: React.ElementType;
    badgeVariant: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'purple' | 'secondary';
    color: string;
  }
> = {
  preference: {
    label: 'Preferences',
    icon: Heart,
    badgeVariant: 'success',
    color: 'text-emerald-400',
  },
  context: {
    label: 'Goals',
    icon: Target,
    badgeVariant: 'info',
    color: 'text-blue-400',
  },
  objection: {
    label: 'Objections',
    icon: ShieldAlert,
    badgeVariant: 'danger',
    color: 'text-red-400',
  },
  interest: {
    label: 'Interests',
    icon: Sparkles,
    badgeVariant: 'purple',
    color: 'text-violet-400',
  },
  fact: {
    label: 'Personal Info',
    icon: User,
    badgeVariant: 'warning',
    color: 'text-yellow-400',
  },
  summary: {
    label: 'Summary',
    icon: Info,
    badgeVariant: 'secondary',
    color: 'text-gray-400',
  },
};

// ─── Skeleton ─────────────────────────────────────────────────

function MemorySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-24 rounded-xl bg-gray-800/50 animate-pulse" />
      ))}
    </div>
  );
}

// ─── Memory Card ──────────────────────────────────────────────

function MemoryCard({ memory }: { memory: Memory }) {
  const config = MEMORY_TYPE_CONFIG[memory.type] ?? MEMORY_TYPE_CONFIG.summary;
  const TypeIcon = config.icon;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-semibold text-gray-300 truncate leading-tight">
          {memory.key}
        </p>
        <Badge variant={config.badgeVariant} className="shrink-0 text-[10px] py-0">
          <TypeIcon className="h-2.5 w-2.5" />
          {config.label}
        </Badge>
      </div>
      <p className="text-sm text-white line-clamp-2">{memory.value}</p>
      <div className="mt-2 flex items-center justify-between">
        {memory.customer_email && (
          <p className="text-[10px] text-gray-600 truncate">{memory.customer_email}</p>
        )}
        <p className="text-[10px] text-gray-600 ml-auto">
          {formatDate(memory.updated_at, { relative: true })}
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function MemoryViewerPage() {
  // Bots
  const [bots, setBots] = useState<Bot[]>([]);
  const [botsLoading, setBotsLoading] = useState(true);

  // Filters
  const [selectedBotId, setSelectedBotId] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [sessionId, setSessionId] = useState('');

  // Memory data
  const [grouped, setGrouped] = useState<Partial<Record<MemoryType, Memory[]>>>({});
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Fetch bots
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/bots');
        if (!res.ok) throw new Error();
        const json = await res.json();
        const botList: Bot[] = json.bots ?? [];
        setBots(botList);
        if (botList.length > 0) setSelectedBotId(botList[0].id);
      } catch {
        // silent
      } finally {
        setBotsLoading(false);
      }
    })();
  }, []);

  // Fetch memories
  const fetchMemories = useCallback(async () => {
    if (!selectedBotId) return;
    setLoading(true);

    const params = new URLSearchParams({ botId: selectedBotId });
    if (customerEmail.trim()) params.set('customerEmail', customerEmail.trim());
    if (sessionId.trim()) params.set('sessionId', sessionId.trim());

    try {
      const res = await fetch(`/api/memory?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch memories');
      const json = await res.json();
      setGrouped(json.memories ?? {});
      setHasFetched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedBotId, customerEmail, sessionId]);

  // Auto-fetch when bot changes
  useEffect(() => {
    if (selectedBotId) {
      setHasFetched(false);
      setGrouped({});
    }
  }, [selectedBotId]);

  const totalMemories = Object.values(grouped).reduce(
    (sum, arr) => sum + (arr?.length ?? 0),
    0
  );

  const memoryOrder: MemoryType[] = [
    'preference',
    'interest',
    'context',
    'objection',
    'fact',
    'summary',
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Brain className="h-6 w-6 text-violet-400" />
          Memory Viewer
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          See what your AI remembers about each customer.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Bot selector */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">Bot</label>
            {botsLoading ? (
              <div className="h-10 rounded-lg bg-gray-800 animate-pulse" />
            ) : (
              <div className="relative">
                <select
                  value={selectedBotId}
                  onChange={(e) => setSelectedBotId(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-700 bg-gray-800 pl-3 pr-9 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                  disabled={bots.length === 0}
                >
                  {bots.length === 0 ? (
                    <option value="">No bots found</option>
                  ) : (
                    bots.map((bot) => (
                      <option key={bot.id} value={bot.id}>
                        {bot.name}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              </div>
            )}
          </div>

          {/* Customer email */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              Customer Email
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="filter@example.com"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Session ID */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              Session ID
            </label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="session_abc123"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button
            variant="gradient"
            onClick={fetchMemories}
            loading={loading}
            disabled={!selectedBotId || loading}
            leftIcon={<Search className="h-4 w-4" />}
          >
            Search Memories
          </Button>
          {hasFetched && !loading && (
            <span className="text-xs text-gray-500">
              {totalMemories} entr{totalMemories === 1 ? 'y' : 'ies'} found
            </span>
          )}
        </div>
      </div>

      {/* Memory Display */}
      {loading ? (
        <MemorySkeleton />
      ) : !hasFetched ? (
        <div className="rounded-xl border border-gray-800 border-dashed bg-gray-900/50 py-16 text-center">
          <Brain className="mx-auto h-10 w-10 text-gray-700 mb-3" />
          <p className="text-sm text-gray-500">
            Select a bot and click <span className="text-indigo-400">Search Memories</span> to view memories.
          </p>
        </div>
      ) : totalMemories === 0 ? (
        <EmptyState
          icon={Brain}
          title="No memories found"
          description="Start a conversation to build customer memory. Adjust the filters above to search by email or session."
        />
      ) : (
        <div className="space-y-8">
          {memoryOrder
            .filter((type) => (grouped[type]?.length ?? 0) > 0)
            .map((type) => {
              const entries = grouped[type] ?? [];
              const config = MEMORY_TYPE_CONFIG[type];
              const TypeIcon = config.icon;

              return (
                <div key={type}>
                  {/* Section header */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-lg bg-gray-800',
                        config.color
                      )}
                    >
                      <TypeIcon className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">
                      {config.label}
                    </h3>
                    <span className="text-xs text-gray-500 bg-gray-800 rounded-full px-2 py-0.5">
                      {entries.length}
                    </span>
                  </div>

                  {/* Cards grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {entries.map((memory) => (
                      <MemoryCard key={memory.id} memory={memory} />
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
