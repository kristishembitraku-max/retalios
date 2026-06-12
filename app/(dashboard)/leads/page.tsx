'use client'

import { useState, useEffect } from 'react'
import { Users, TrendingUp, MessageSquare, ChevronRight, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

interface Lead {
  conversationId: string
  sessionId: string
  customerName: string
  customerEmail: string
  botName: string
  conversionProbability: number
  buyingStage: string
  sentiment: string
  lastActivity: string
  messageCount: number
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : score >= 60 ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-gray-700 bg-gray-50 border-gray-200'
  return (
    <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${color}`}>
      <Star className="w-3 h-3" />
      {score}%
    </div>
  )
}

function formatTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [minScore, setMinScore] = useState(60)

  useEffect(() => {
    fetch(`/api/leads?minScore=${minScore}`)
      .then(r => r.json())
      .then(data => { setLeads(data.leads || mockLeads); setLoading(false) })
      .catch(() => { setLeads(mockLeads); setLoading(false) })
  }, [minScore])

  const topLeads = leads.filter(l => l.conversionProbability >= 80).length
  const avgScore = leads.length ? Math.round(leads.reduce((s, l) => s + l.conversionProbability, 0) / leads.length) : 0

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500 mt-1">Visitors with high purchase intent</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <span className="text-xs text-gray-500">Min Score:</span>
          <select
            className="text-sm font-medium text-gray-900 border-0 focus:outline-none bg-transparent"
            value={minScore}
            onChange={e => setMinScore(Number(e.target.value))}
          >
            <option value={40}>40%</option>
            <option value={60}>60%</option>
            <option value={70}>70%</option>
            <option value={80}>80%</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Leads', value: leads.length, icon: Users, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Hot Leads (80%+)', value: topLeads, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Avg Lead Score', value: `${avgScore}%`, icon: Star, color: 'text-amber-600 bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Leads Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Lead Score</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Customer</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Bot</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Buying Stage</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Sentiment</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Messages</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Last Activity</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                  ))}
                </tr>
              ))
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-16 text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                  <p>No leads found with score ≥ {minScore}%</p>
                </td>
              </tr>
            ) : leads.sort((a, b) => b.conversionProbability - a.conversionProbability).map(lead => (
              <tr key={lead.conversationId} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <ScoreBadge score={lead.conversionProbability} />
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{lead.customerName || 'Anonymous'}</p>
                    <p className="text-xs text-gray-400">{lead.customerEmail || '—'}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{lead.botName}</td>
                <td className="px-4 py-3">
                  <Badge variant="info" className="capitalize">{lead.buyingStage}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={lead.sentiment === 'positive' || lead.sentiment === 'very_positive' ? 'success' : lead.sentiment === 'negative' ? 'danger' : 'default'}
                    className="capitalize"
                  >
                    {lead.sentiment}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-sm text-gray-600">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {lead.messageCount}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{formatTime(lead.lastActivity)}</td>
                <td className="px-4 py-3">
                  <Link href={`/conversations?id=${lead.conversationId}`}>
                    <ChevronRight className="w-4 h-4 text-gray-300 hover:text-indigo-600 transition-colors" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const mockLeads: Lead[] = [
  { conversationId: '3', sessionId: 's3', customerName: 'John Smith', customerEmail: 'john@example.com', botName: 'Product Expert', conversionProbability: 89, buyingStage: 'intent', sentiment: 'very_positive', lastActivity: new Date(Date.now() - 3600000).toISOString(), messageCount: 23 },
  { conversationId: '1', sessionId: 's1', customerName: 'Sarah Johnson', customerEmail: 'sarah@example.com', botName: 'Sales Assistant Pro', conversionProbability: 72, buyingStage: 'consideration', sentiment: 'positive', lastActivity: new Date(Date.now() - 1800000).toISOString(), messageCount: 12 },
  { conversationId: '5', sessionId: 's5', customerName: 'Ana García', customerEmail: 'ana@empresa.es', botName: 'Sales Assistant Pro', conversionProbability: 67, buyingStage: 'evaluation', sentiment: 'positive', lastActivity: new Date(Date.now() - 172800000).toISOString(), messageCount: 18 },
  { conversationId: '6', sessionId: 's6', customerName: 'Thomas Müller', customerEmail: 'thomas@firma.de', botName: 'Sales Assistant Pro', conversionProbability: 61, buyingStage: 'consideration', sentiment: 'neutral', lastActivity: new Date(Date.now() - 86400000).toISOString(), messageCount: 9 },
]
