'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, MessageSquare, Users, Activity, Target } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const COLORS = ['#6366f1', '#7c3aed', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4']

const PERIODS = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
]

function StatCard({ title, value, change, icon: Icon, color }: {
  title: string; value: string | number; change?: number; icon: React.ElementType; color: string
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{title}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {change !== undefined && (
        <p className={cn('text-xs mt-1', change >= 0 ? 'text-emerald-600' : 'text-red-500')}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% vs last period
        </p>
      )}
    </div>
  )
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    setLoading(true)
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const startDate = new Date(Date.now() - days * 86400000).toISOString()
    fetch(`/api/analytics?startDate=${startDate}`)
      .then(r => r.json())
      .then(data => { setMetrics(data.metrics || {}); setLoading(false) })
      .catch(() => { setMetrics({}); setLoading(false) })
  }, [period])

  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const conversationData = Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.now() - (days - i - 1) * 86400000)
    return {
      date: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      conversations: Math.floor(30 + Math.random() * 60 + Math.sin(i / 3) * 15),
      leads: Math.floor(5 + Math.random() * 20),
    }
  })

  const languageData = [
    { name: 'English', value: 45 },
    { name: 'Spanish', value: 20 },
    { name: 'French', value: 15 },
    { name: 'German', value: 10 },
    { name: 'Other', value: 10 },
  ]

  const intentData = [
    { name: 'Browsing', value: 28 },
    { name: 'Interested', value: 35 },
    { name: 'Evaluating', value: 20 },
    { name: 'Ready to Buy', value: 12 },
    { name: 'Objecting', value: 5 },
  ]

  const sentimentData = Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - (days - i - 1) * 86400000).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    score: parseFloat((0.2 + Math.random() * 0.6 + Math.sin(i / 5) * 0.2).toFixed(2)),
  }))

  const objections = [
    { objection: 'Too expensive', count: 47 },
    { objection: 'Need to think about it', count: 38 },
    { objection: 'Not the right time', count: 29 },
    { objection: 'Already have a solution', count: 21 },
    { objection: 'Need approval', count: 15 },
  ]

  const funnel = [
    { stage: 'Awareness', count: 1247, pct: 100 },
    { stage: 'Interest', count: 856, pct: 69 },
    { stage: 'Consideration', count: 423, pct: 34 },
    { stage: 'Intent', count: 187, pct: 15 },
    { stage: 'Purchase', count: 89, pct: 7 },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Performance insights across all your bots</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                period === p.value ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard title="Conversations" value="1,247" change={12} icon={MessageSquare} color="text-indigo-600 bg-indigo-50" />
        <StatCard title="Messages" value="8,432" change={8} icon={Activity} color="text-violet-600 bg-violet-50" />
        <StatCard title="Leads" value="342" change={23} icon={Users} color="text-emerald-600 bg-emerald-50" />
        <StatCard title="Avg Sentiment" value="0.68" change={5} icon={TrendingUp} color="text-amber-600 bg-amber-50" />
        <StatCard title="Conversion Rate" value="27.4%" change={-2} icon={Target} color="text-rose-600 bg-rose-50" />
      </div>

      {/* Area Chart - Conversations */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Conversation Volume</h2>
        {loading ? <Skeleton className="h-64 w-full" /> : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={conversationData}>
              <defs>
                <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                tickFormatter={(v, i) => i % Math.floor(days / 7) === 0 ? v : ''} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Area type="monotone" dataKey="conversations" stroke="#6366f1" strokeWidth={2} fill="url(#convGrad)" name="Conversations" />
              <Area type="monotone" dataKey="leads" stroke="#10b981" strokeWidth={2} fill="url(#leadGrad)" name="Leads" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pie - Language */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Language Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={languageData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                {languageData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar - Intent */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Intent Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={intentData} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={90} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Count">
                {intentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line - Sentiment + Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Sentiment Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={sentimentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                tickFormatter={(v, i) => i % Math.floor(days / 5) === 0 ? v : ''} />
              <YAxis domain={[0, 1]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: number) => v.toFixed(2)} />
              <Line type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2} dot={false} name="Sentiment" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          {/* Top Objections */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Top Objections</h2>
            <div className="space-y-2">
              {objections.map(o => (
                <div key={o.objection}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-700 truncate mr-2">{o.objection}</span>
                    <span className="text-gray-500 flex-shrink-0">{o.count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div
                      className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full"
                      style={{ width: `${(o.count / objections[0].count) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Funnel */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Conversion Funnel</h2>
            <div className="space-y-2">
              {funnel.map(f => (
                <div key={f.stage} className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-700">{f.stage}</span>
                      <span className="text-gray-500">{f.count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-400 to-violet-600 rounded-full"
                        style={{ width: `${f.pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right">{f.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
