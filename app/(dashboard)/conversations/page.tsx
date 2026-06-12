'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, MessageSquare, X, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface ConversationRow {
  id: string
  session_id: string
  customer_name: string
  customer_email: string
  bot_name: string
  message_count: number
  sentiment: string
  intent: string
  buying_stage: string
  conversion_probability: number
  last_message: string
  started_at: string
  last_message_at: string
}

interface ConversationDetail extends ConversationRow {
  messages: { id: string; role: string; content: string; created_at: string; language: string }[]
}

const SENTIMENT_COLORS: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  positive: 'success',
  very_positive: 'success',
  neutral: 'default',
  negative: 'danger',
  very_negative: 'danger',
}

const STAGE_COLORS: Record<string, 'default' | 'info' | 'warning' | 'success'> = {
  awareness: 'default',
  interest: 'info',
  consideration: 'info',
  intent: 'warning',
  evaluation: 'warning',
  purchase: 'success',
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return d.toLocaleDateString()
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationRow[]>([])
  const [selected, setSelected] = useState<ConversationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterSentiment, setFilterSentiment] = useState('')
  const [filterStage, setFilterStage] = useState('')

  useEffect(() => {
    fetch('/api/conversations?limit=50')
      .then(r => r.json())
      .then(data => { setConversations(data.conversations || mockConversations); setLoading(false) })
      .catch(() => { setConversations(mockConversations); setLoading(false) })
  }, [])

  const openDetail = async (conv: ConversationRow) => {
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/conversations/${conv.id}`)
      const data = await res.json()
      setSelected({ ...conv, messages: data.messages || [] })
    } catch {
      setSelected({ ...conv, messages: [] })
    } finally {
      setDetailLoading(false)
    }
  }

  const filtered = conversations.filter(c => {
    const matchSearch = !search || c.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
      c.bot_name?.toLowerCase().includes(search.toLowerCase())
    const matchSentiment = !filterSentiment || c.sentiment === filterSentiment
    const matchStage = !filterStage || c.buying_stage === filterStage
    return matchSearch && matchSentiment && matchStage
  })

  return (
    <div className="flex h-full">
      {/* Main list */}
      <div className={cn('flex-1 p-8 overflow-auto', selected ? 'hidden lg:block' : '')}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
            <p className="text-gray-500 mt-1">{conversations.length} total conversations</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search by customer, bot..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterSentiment}
            onChange={e => setFilterSentiment(e.target.value)}
          >
            <option value="">All Sentiments</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
          <select
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterStage}
            onChange={e => setFilterStage(e.target.value)}
          >
            <option value="">All Stages</option>
            <option value="awareness">Awareness</option>
            <option value="interest">Interest</option>
            <option value="consideration">Consideration</option>
            <option value="intent">Intent</option>
            <option value="evaluation">Evaluation</option>
            <option value="purchase">Purchase</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Customer</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Bot</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Messages</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Sentiment</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Stage</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Last Active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                    No conversations found
                  </td>
                </tr>
              ) : filtered.map(conv => (
                <tr
                  key={conv.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => openDetail(conv)}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{conv.customer_name || 'Anonymous'}</p>
                      <p className="text-xs text-gray-400">{conv.customer_email || '—'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{conv.bot_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{conv.message_count}</td>
                  <td className="px-4 py-3">
                    <Badge variant={SENTIMENT_COLORS[conv.sentiment] || 'default'} className="capitalize">
                      {conv.sentiment || 'neutral'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STAGE_COLORS[conv.buying_stage] || 'default'} className="capitalize">
                      {conv.buying_stage || 'awareness'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{formatTime(conv.last_message_at)}</td>
                  <td className="px-4 py-3">
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="w-full lg:w-96 border-l border-gray-200 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{selected.customer_name || 'Anonymous'}</p>
              <p className="text-xs text-gray-400">{selected.bot_name}</p>
            </div>
            <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="p-4 bg-gray-50 border-b border-gray-100 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400">Sentiment</p>
              <Badge variant={SENTIMENT_COLORS[selected.sentiment] || 'default'} className="mt-1 capitalize">
                {selected.sentiment || 'neutral'}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-gray-400">Buying Stage</p>
              <Badge variant={STAGE_COLORS[selected.buying_stage] || 'default'} className="mt-1 capitalize">
                {selected.buying_stage || 'awareness'}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-gray-400">Conversion Prob.</p>
              <p className="font-semibold text-gray-900">{selected.conversion_probability ?? 0}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Messages</p>
              <p className="font-semibold text-gray-900">{selected.message_count}</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {detailLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
                  <Skeleton className={cn('h-12 rounded-2xl', i % 2 === 0 ? 'w-3/4' : 'w-2/3')} />
                </div>
              ))
            ) : selected.messages.length === 0 ? (
              <p className="text-center text-sm text-gray-400 mt-8">No messages to display</p>
            ) : selected.messages.map(msg => (
              <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-xs px-4 py-2.5 rounded-2xl text-sm',
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                )}>
                  <p>{msg.content}</p>
                  <p className={cn('text-xs mt-1', msg.role === 'user' ? 'text-indigo-200' : 'text-gray-400')}>
                    {formatTime(msg.created_at)} {msg.language && `· ${msg.language}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const mockConversations: ConversationRow[] = [
  { id: '1', session_id: 's1', customer_name: 'Sarah Johnson', customer_email: 'sarah@example.com', bot_name: 'Sales Assistant Pro', message_count: 12, sentiment: 'positive', intent: 'evaluating', buying_stage: 'consideration', conversion_probability: 72, last_message: 'Can I schedule a demo?', started_at: new Date(Date.now() - 3600000).toISOString(), last_message_at: new Date(Date.now() - 1800000).toISOString() },
  { id: '2', session_id: 's2', customer_name: 'Michel Dupont', customer_email: 'michel@example.fr', bot_name: 'Sales Assistant Pro', message_count: 7, sentiment: 'neutral', intent: 'interested', buying_stage: 'interest', conversion_probability: 45, last_message: 'Quels sont les tarifs?', started_at: new Date(Date.now() - 7200000).toISOString(), last_message_at: new Date(Date.now() - 5400000).toISOString() },
  { id: '3', session_id: 's3', customer_name: 'John Smith', customer_email: 'john@example.com', bot_name: 'Product Expert', message_count: 23, sentiment: 'very_positive', intent: 'ready_to_buy', buying_stage: 'intent', conversion_probability: 89, last_message: 'I want to get started today', started_at: new Date(Date.now() - 86400000).toISOString(), last_message_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '4', session_id: 's4', customer_name: 'Anonymous', customer_email: '', bot_name: 'Lead Qualifier', message_count: 3, sentiment: 'neutral', intent: 'browsing', buying_stage: 'awareness', conversion_probability: 15, last_message: 'Just looking around', started_at: new Date(Date.now() - 172800000).toISOString(), last_message_at: new Date(Date.now() - 86400000).toISOString() },
  { id: '5', session_id: 's5', customer_name: 'Ana García', customer_email: 'ana@empresa.es', bot_name: 'Sales Assistant Pro', message_count: 18, sentiment: 'positive', intent: 'evaluating', buying_stage: 'evaluation', conversion_probability: 67, last_message: 'Necesito comparar opciones', started_at: new Date(Date.now() - 259200000).toISOString(), last_message_at: new Date(Date.now() - 172800000).toISOString() },
]
