'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Bot, MessageSquare, Users, MoreVertical, Copy, Settings, Trash2, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface BotData {
  id: string
  name: string
  description: string
  is_active: boolean
  embed_token: string
  created_at: string
  config: {
    tone?: string
    languages?: string[]
    welcomeMessage?: string
  }
  stats?: {
    conversations: number
    leads: number
  }
}

function BotCard({ bot, onToggle, onDelete }: { bot: BotData; onToggle: (id: string, active: boolean) => void; onDelete: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyEmbedCode = () => {
    const code = `<script>
  window.FluenceConfig = { token: '${bot.embed_token}' };
</script>
<script src="${process.env.NEXT_PUBLIC_APP_URL || 'https://fluenceai.com'}/widget.js" async></script>`
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200 relative">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{bot.name}</h3>
            <p className="text-xs text-gray-500 capitalize">{bot.config?.tone || 'professional'} tone</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={bot.is_active ? 'success' : 'default'}>
            {bot.is_active ? 'Active' : 'Inactive'}
          </Badge>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-44">
                <Link
                  href={`/bots/${bot.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <Settings className="w-4 h-4" /> Configure
                </Link>
                <button
                  onClick={() => { onToggle(bot.id, !bot.is_active); setMenuOpen(false) }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                >
                  {bot.is_active ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                  {bot.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => copyEmbedCode()}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                >
                  <Copy className="w-4 h-4" /> Copy Embed Code
                </button>
                <hr className="my-1 border-gray-100" />
                <button
                  onClick={() => { onDelete(bot.id); setMenuOpen(false) }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {bot.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{bot.description}</p>
      )}

      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <MessageSquare className="w-4 h-4" />
          {bot.stats?.conversations ?? 0} conversations
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {bot.stats?.leads ?? 0} leads
        </span>
      </div>

      {bot.config?.languages && bot.config.languages.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-4">
          {bot.config.languages.slice(0, 3).map((lang) => (
            <span key={lang} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
              {lang}
            </span>
          ))}
          {bot.config.languages.length > 3 && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              +{bot.config.languages.length - 3} more
            </span>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Link href={`/bots/${bot.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            <Settings className="w-3 h-3 mr-1" /> Configure
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={copyEmbedCode}
          className="flex-1"
        >
          {copied ? '✓ Copied!' : <><Copy className="w-3 h-3 mr-1" /> Embed</>}
        </Button>
      </div>
    </Card>
  )
}

export default function BotsPage() {
  const [bots, setBots] = useState<BotData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/bots')
      .then(r => r.json())
      .then(data => {
        setBots(data.bots || mockBots)
        setLoading(false)
      })
      .catch(() => {
        setBots(mockBots)
        setLoading(false)
      })
  }, [])

  const handleToggle = async (id: string, active: boolean) => {
    await fetch(`/api/bots/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: active }),
    })
    setBots(bots.map(b => b.id === id ? { ...b, is_active: active } : b))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bot?')) return
    await fetch(`/api/bots/${id}`, { method: 'DELETE' })
    setBots(bots.filter(b => b.id !== id))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Bots</h1>
          <p className="text-gray-500 mt-1">Manage and configure your AI sales agents</p>
        </div>
        <Link href="/bots/new">
          <Button variant="default" className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
            <Plus className="w-4 h-4 mr-2" /> Create Bot
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-6">
              <Skeleton className="h-10 w-10 rounded-xl mb-4" />
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <div className="flex gap-4 mb-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 flex-1 rounded-lg" />
                <Skeleton className="h-8 flex-1 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : bots.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No bots yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Create your first AI sales agent and start converting visitors into leads.
          </p>
          <Link href="/bots/new">
            <Button variant="default" className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
              <Plus className="w-4 h-4 mr-2" /> Create Your First Bot
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map(bot => (
            <BotCard key={bot.id} bot={bot} onToggle={handleToggle} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

const mockBots: BotData[] = [
  {
    id: '1',
    name: 'Sales Assistant Pro',
    description: 'Handles product inquiries and guides visitors through the sales funnel with a consultative approach.',
    is_active: true,
    embed_token: 'demo-token-1',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    config: { tone: 'consultative', languages: ['English', 'Spanish', 'French'] },
    stats: { conversations: 342, leads: 89 },
  },
  {
    id: '2',
    name: 'Product Expert',
    description: 'Deep product knowledge assistant that answers technical questions and demos features.',
    is_active: true,
    embed_token: 'demo-token-2',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    config: { tone: 'professional', languages: ['English', 'German'] },
    stats: { conversations: 128, leads: 34 },
  },
  {
    id: '3',
    name: 'Lead Qualifier',
    description: 'Qualifies inbound leads and schedules demo calls with the sales team.',
    is_active: false,
    embed_token: 'demo-token-3',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    config: { tone: 'friendly', languages: ['English'] },
    stats: { conversations: 45, leads: 12 },
  },
]
