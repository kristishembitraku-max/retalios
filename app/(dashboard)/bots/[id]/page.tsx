'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Copy, Check, Code2, Settings, BarChart3, BookOpen, ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'

const TABS = [
  { id: 'config', label: 'Configuration', icon: Settings },
  { id: 'embed', label: 'Embed Code', icon: Code2 },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
]

const LANGUAGES = ['English','Spanish','French','German','Italian','Portuguese','Albanian','Arabic','Chinese','Japanese','Russian','Dutch']

interface BotData {
  id: string
  name: string
  description: string
  is_active: boolean
  embed_token: string
  config: Record<string, unknown>
  tone: string
  personality: string
  goals: string[]
  sales_style: string
  welcome_message: string
  created_at: string
}

export default function BotDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tab, setTab] = useState('config')
  const [bot, setBot] = useState<BotData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState<Partial<BotData>>({})

  useEffect(() => {
    fetch(`/api/bots/${id}`)
      .then(r => r.json())
      .then(data => {
        setBot(data.bot)
        setForm(data.bot)
        setLoading(false)
      })
      .catch(() => {
        setBot(mockBot)
        setForm(mockBot)
        setLoading(false)
      })
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`/api/bots/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      toast.success('Bot updated!')
    } catch {
      toast.error('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const copyEmbed = () => {
    const code = `<!-- Fluence AI Widget -->
<script>
  window.FluenceConfig = { token: '${bot?.embed_token}' };
</script>
<script src="${process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app'}/widget.js" async></script>`
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="p-8 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-64 mb-8" />
      <div className="h-96 bg-gray-200 rounded-2xl" />
    </div>
  )

  if (!bot) return (
    <div className="p-8 text-center">
      <p className="text-gray-500">Bot not found.</p>
      <Link href="/bots"><Button variant="outline" className="mt-4">Back to Bots</Button></Link>
    </div>
  )

  const embedCode = `<!-- Fluence AI Widget -->
<script>
  window.FluenceConfig = { token: '${bot.embed_token}' };
</script>
<script src="${process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app'}/widget.js" async></script>`

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/bots">
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{bot.name}</h1>
            <Badge variant={bot.is_active ? 'success' : 'default'}>
              {bot.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">{bot.description}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8 w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === t.id
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Config Tab */}
      {tab === 'config' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Bot Configuration</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
              <input
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.name || ''}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={2}
                value={form.description || ''}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Welcome Message</label>
              <textarea
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={2}
                value={form.welcome_message || ''}
                onChange={e => setForm(f => ({ ...f, welcome_message: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tone</label>
                <select
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.tone || ''}
                  onChange={e => setForm(f => ({ ...f, tone: e.target.value }))}
                >
                  {['professional','friendly','enthusiastic','consultative','formal'].map(t => (
                    <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Sales Style</label>
                <select
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.sales_style || ''}
                  onChange={e => setForm(f => ({ ...f, sales_style: e.target.value }))}
                >
                  {['consultative','educational','direct','relationship'].map(s => (
                    <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Personality</label>
              <textarea
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={4}
                value={form.personality || ''}
                onChange={e => setForm(f => ({ ...f, personality: e.target.value }))}
              />
            </div>
            <div className="pt-2">
              <Button onClick={handleSave} loading={saving} className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Embed Tab */}
      {tab === 'embed' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Embed Your Bot</h2>
          <p className="text-sm text-gray-500 mb-6">
            Copy and paste this code into your website's HTML, just before the closing <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code> tag.
          </p>
          <div className="relative">
            <pre className="bg-gray-900 text-green-400 rounded-xl p-5 text-sm overflow-x-auto font-mono leading-relaxed">
              {embedCode}
            </pre>
            <button
              onClick={copyEmbed}
              className="absolute top-3 right-3 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </button>
          </div>
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-800">
              <strong>Embed Token:</strong> <code className="font-mono bg-amber-100 px-1.5 rounded">{bot.embed_token}</code>
            </p>
            <p className="text-xs text-amber-600 mt-1">Keep this token private. It identifies your bot.</p>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {tab === 'analytics' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Bot Analytics</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Conversations', value: '342' },
              { label: 'Leads Captured', value: '89' },
              { label: 'Avg Conversion', value: '26%' },
            ].map(stat => (
              <div key={stat.label} className="bg-gray-50 rounded-xl p-4">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500">
            View detailed analytics in the{' '}
            <Link href="/analytics" className="text-indigo-600 hover:underline">Analytics dashboard</Link>.
          </p>
        </div>
      )}

      {/* Knowledge Tab */}
      {tab === 'knowledge' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Knowledge Base</h2>
          <p className="text-sm text-gray-500 mb-6">
            Upload documents and FAQs to power this bot's responses.
          </p>
          <Link href={`/knowledge-base?botId=${bot.id}`}>
            <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
              <BookOpen className="w-4 h-4 mr-2" /> Manage Knowledge Base
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

const mockBot: BotData = {
  id: '1',
  name: 'Sales Assistant Pro',
  description: 'Handles product inquiries and guides visitors through the sales funnel.',
  is_active: true,
  embed_token: 'demo-embed-token-xyz',
  config: {},
  tone: 'consultative',
  personality: 'You are an expert sales consultant who genuinely cares about solving customer problems.',
  goals: ['Understand needs', 'Qualify leads', 'Schedule demos'],
  sales_style: 'consultative',
  welcome_message: "Hi! I'm here to help. What brings you here today?",
  created_at: new Date().toISOString(),
}
