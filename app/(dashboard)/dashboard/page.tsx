'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  TrendingUp,
  Bot,
  Users,
  Percent,
  Plus,
  Upload,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Types ───────────────────────────────────────────────────────────────────

interface StatsData {
  conversations: number;
  conversationsChange: number;
  bots: number;
  botsChange: number;
  leads: number;
  leadsChange: number;
  conversion: number;
  conversionChange: number;
}

interface ChartPoint {
  date: string;
  conversations: number;
}

interface BotStat {
  name: string;
  conversations: number;
}

interface Conversation {
  id: string;
  customerName: string;
  botName: string;
  lastMessage: string;
  timeAgo: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  avatar: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

function generateChartData(): ChartPoint[] {
  const base = [
    38, 42, 35, 55, 60, 48, 52, 65, 70, 63, 58, 72, 80, 75, 68, 90, 95, 88,
    102, 98, 110, 105, 115, 108, 120, 118, 125, 130, 122, 135,
  ];
  return base.map((v, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return { date: format(d, 'MMM d'), conversations: v };
  });
}

const MOCK_STATS: StatsData = {
  conversations: 1247,
  conversationsChange: 12.5,
  bots: 3,
  botsChange: 0,
  leads: 89,
  leadsChange: 8.3,
  conversion: 34,
  conversionChange: -2.1,
};

const MOCK_BOT_STATS: BotStat[] = [
  { name: 'Sales Bot', conversations: 520 },
  { name: 'Support Bot', conversations: 410 },
  { name: 'Lead Gen Bot', conversations: 317 },
];

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    customerName: 'Alice Johnson',
    botName: 'Sales Bot',
    lastMessage: "I'm interested in the enterprise plan, can you tell me more?",
    timeAgo: '2m ago',
    sentiment: 'positive',
    avatar: 'AJ',
  },
  {
    id: '2',
    customerName: 'Marcus Lee',
    botName: 'Support Bot',
    lastMessage: 'The integration keeps failing on step 3, need urgent help.',
    timeAgo: '7m ago',
    sentiment: 'negative',
    avatar: 'ML',
  },
  {
    id: '3',
    customerName: 'Priya Sharma',
    botName: 'Lead Gen Bot',
    lastMessage: 'Can you schedule a demo for next Tuesday at 10am?',
    timeAgo: '15m ago',
    sentiment: 'positive',
    avatar: 'PS',
  },
  {
    id: '4',
    customerName: 'Tom Carter',
    botName: 'Sales Bot',
    lastMessage: "What's the difference between the starter and pro tier?",
    timeAgo: '34m ago',
    sentiment: 'neutral',
    avatar: 'TC',
  },
  {
    id: '5',
    customerName: 'Diana Flores',
    botName: 'Support Bot',
    lastMessage: 'Got it working! Thanks for the quick response.',
    timeAgo: '1h ago',
    sentiment: 'positive',
    avatar: 'DF',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: number | string;
  change: number;
  icon: React.ReactNode;
  gradient: string;
  loading: boolean;
  suffix?: string;
}

function StatCard({ title, value, change, icon, gradient, loading, suffix }: StatCardProps) {
  const positive = change >= 0;
  return (
    <Card hover className="flex flex-col">
      <CardContent className="p-5">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ) : (
          <>
            <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl mb-4 ${gradient}`}>
              {icon}
            </div>
            <p className="text-sm text-gray-400 mb-1">{title}</p>
            <p className="text-3xl font-bold text-white mb-2">
              {typeof value === 'number' ? value.toLocaleString() : value}
              {suffix && <span className="text-xl">{suffix}</span>}
            </p>
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                positive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                  : 'bg-red-500/15 text-red-400 border border-red-500/25'
              }`}
            >
              {positive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {Math.abs(change)}%
            </span>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SentimentBadge({ sentiment }: { sentiment: Conversation['sentiment'] }) {
  if (sentiment === 'positive')
    return <Badge variant="success">Positive</Badge>;
  if (sentiment === 'negative')
    return <Badge variant="danger">Negative</Badge>;
  return <Badge variant="secondary">Neutral</Badge>;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-sm font-semibold text-indigo-300">
          {payload[0].value} conversations
        </p>
      </div>
    );
  }
  return null;
};

const BarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-sm font-semibold text-violet-300">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [botStats, setBotStats] = useState<BotStat[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(true);

  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/analytics');
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        setStats(data.stats ?? MOCK_STATS);
        setChartData(data.chartData ?? generateChartData());
        setBotStats(data.botStats ?? MOCK_BOT_STATS);
      } catch {
        setStats(MOCK_STATS);
        setChartData(generateChartData());
        setBotStats(MOCK_BOT_STATS);
      } finally {
        setLoadingStats(false);
        setLoadingCharts(false);
      }
    };

    const fetchConversations = async () => {
      try {
        const res = await fetch('/api/conversations');
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        setConversations(data.conversations ?? MOCK_CONVERSATIONS);
      } catch {
        setConversations(MOCK_CONVERSATIONS);
      } finally {
        setLoadingConversations(false);
      }
    };

    fetchAnalytics();
    fetchConversations();
  }, []);

  const BAR_COLORS = ['#6366f1', '#7c3aed', '#10b981'];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back, <span className="text-indigo-400">Alex</span> 👋
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Here&apos;s what&apos;s happening with your AI bots today.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
            <span>{today}</span>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Total Conversations"
            value={stats?.conversations ?? 0}
            change={stats?.conversationsChange ?? 0}
            icon={<TrendingUp className="h-5 w-5 text-white" />}
            gradient="bg-gradient-to-br from-indigo-500 to-indigo-700"
            loading={loadingStats}
          />
          <StatCard
            title="Active Bots"
            value={stats?.bots ?? 0}
            change={stats?.botsChange ?? 0}
            icon={<Bot className="h-5 w-5 text-white" />}
            gradient="bg-gradient-to-br from-violet-500 to-violet-700"
            loading={loadingStats}
          />
          <StatCard
            title="Leads Captured"
            value={stats?.leads ?? 0}
            change={stats?.leadsChange ?? 0}
            icon={<Users className="h-5 w-5 text-white" />}
            gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
            loading={loadingStats}
          />
          <StatCard
            title="Avg Conversion"
            value={stats?.conversion ?? 0}
            change={stats?.conversionChange ?? 0}
            icon={<Percent className="h-5 w-5 text-white" />}
            gradient="bg-gradient-to-br from-amber-500 to-amber-700"
            loading={loadingStats}
            suffix="%"
          />
        </div>

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Line / Area chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-white">
                Conversations Over Time
              </CardTitle>
              <p className="text-xs text-gray-500">Last 30 days</p>
            </CardHeader>
            <CardContent>
              {loadingCharts ? (
                <Skeleton className="h-56 w-full rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="convGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      interval={4}
                    />
                    <YAxis
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="conversations"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fill="url(#convGradient)"
                      dot={false}
                      activeDot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Horizontal bar chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-white">Top Bots</CardTitle>
              <p className="text-xs text-gray-500">By conversation volume</p>
            </CardHeader>
            <CardContent>
              {loadingCharts ? (
                <Skeleton className="h-56 w-full rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    layout="vertical"
                    data={botStats}
                    margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={84}
                    />
                    <Tooltip content={<BarTooltip />} />
                    <Bar dataKey="conversations" radius={[0, 4, 4, 0]}>
                      {botStats.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Recent Conversations ── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-white">
                Recent Conversations
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-white">
                View all →
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingConversations ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton variant="circle" className="h-10 w-10 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-gray-800/60">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="flex items-center gap-4 py-3 px-1 hover:bg-gray-800/30 rounded-lg transition-colors cursor-pointer"
                  >
                    {/* Avatar */}
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                      {conv.avatar}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-white truncate">
                          {conv.customerName}
                        </span>
                        <span className="text-xs text-gray-500 shrink-0">via {conv.botName}</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{conv.lastMessage}</p>
                    </div>
                    {/* Right side */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-xs text-gray-500">{conv.timeAgo}</span>
                      <SentimentBadge sentiment={conv.sentiment} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Quick Actions ── */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="gradient"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create New Bot
          </Button>
          <Button
            variant="outline"
            leftIcon={<Upload className="h-4 w-4" />}
          >
            Upload Knowledge
          </Button>
          <Button
            variant="outline"
            leftIcon={<Users className="h-4 w-4" />}
          >
            View All Leads
          </Button>
        </div>

      </div>
    </div>
  );
}
