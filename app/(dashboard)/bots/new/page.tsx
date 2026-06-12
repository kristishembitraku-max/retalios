'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, Bot, Settings, Globe, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const STEPS = [
  { id: 1, title: 'Basic Info', icon: Bot },
  { id: 2, title: 'Personality', icon: Settings },
  { id: 3, title: 'Configuration', icon: Globe },
  { id: 4, title: 'Review', icon: Zap },
]

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Albanian', 'Arabic', 'Chinese', 'Japanese', 'Russian', 'Dutch',
]

const TONES = [
  { value: 'professional', label: 'Professional', desc: 'Formal and business-oriented' },
  { value: 'friendly', label: 'Friendly', desc: 'Warm and approachable' },
  { value: 'enthusiastic', label: 'Enthusiastic', desc: 'Energetic and exciting' },
  { value: 'consultative', label: 'Consultative', desc: 'Expert advisor style' },
  { value: 'formal', label: 'Formal', desc: 'Strictly professional' },
]

const SALES_STYLES = [
  { value: 'consultative', label: 'Consultative', desc: 'Understand needs first' },
  { value: 'educational', label: 'Educational', desc: 'Teach and inform' },
  { value: 'direct', label: 'Direct', desc: 'Clear, to-the-point' },
  { value: 'relationship', label: 'Relationship', desc: 'Build trust over time' },
]

interface FormData {
  name: string
  description: string
  welcomeMessage: string
  tone: string
  personality: string
  salesStyle: string
  goals: string
  languages: string[]
  responseLength: string
}

export default function NewBotPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormData>({
    name: '',
    description: '',
    welcomeMessage: 'Hi! I\'m here to help you find the perfect solution. What brings you here today?',
    tone: 'consultative',
    personality: 'You are an expert sales consultant who genuinely cares about solving customer problems. You listen carefully, ask insightful questions, and provide personalized recommendations.',
    salesStyle: 'consultative',
    goals: 'Understand customer needs\nQualify leads\nSchedule demos\nClose sales',
    languages: ['English'],
    responseLength: 'balanced',
  })

  const update = (key: keyof FormData, value: string | string[]) =>
    setForm(f => ({ ...f, [key]: value }))

  const toggleLanguage = (lang: string) => {
    const langs = form.languages.includes(lang)
      ? form.languages.filter(l => l !== lang)
      : [...form.languages, lang]
    update('languages', langs)
  }

  const handleCreate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          personality: form.personality,
          goals: form.goals.split('\n').filter(Boolean),
          tone: form.tone,
          sales_style: form.salesStyle,
          welcome_message: form.welcomeMessage,
          config: {
            languages: form.languages,
            responseLength: form.responseLength,
          },
        }),
      })
      if (!res.ok) throw new Error('Failed to create bot')
      const { bot } = await res.json()
      toast.success('Bot created successfully!')
      router.push(`/bots/${bot.id}`)
    } catch {
      toast.error('Failed to create bot. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create New Bot</h1>
        <p className="text-gray-500 mt-1">Build your AI sales agent in 4 easy steps</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center mb-10">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => step > s.id && setStep(s.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
                step === s.id
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
                  : step > s.id
                  ? 'text-indigo-600 cursor-pointer hover:bg-indigo-50'
                  : 'text-gray-400 cursor-not-allowed',
              )}
            >
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                step > s.id ? 'bg-indigo-600 text-white' : step === s.id ? 'bg-white text-indigo-600' : 'bg-gray-200 text-gray-500'
              )}>
                {step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
              </div>
              <span className="text-sm font-medium hidden sm:block">{s.title}</span>
            </button>
            {i < STEPS.length - 1 && (
              <ChevronRight className="w-4 h-4 text-gray-300 mx-1 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8">
        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bot Name *</label>
              <input
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Sales Assistant Pro"
                value={form.name}
                onChange={e => update('name', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={3}
                placeholder="What does this bot do? Who is it for?"
                value={form.description}
                onChange={e => update('description', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Welcome Message</label>
              <textarea
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={3}
                value={form.welcomeMessage}
                onChange={e => update('welcomeMessage', e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">First message customers see when the chat opens</p>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Personality & Style</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Tone</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TONES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => update('tone', t.value)}
                    className={cn(
                      'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                      form.tone === t.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className={cn(
                      'w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0',
                      form.tone === t.value ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                    )} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t.label}</p>
                      <p className="text-xs text-gray-500">{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Sales Style</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SALES_STYLES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => update('salesStyle', s.value)}
                    className={cn(
                      'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                      form.salesStyle === s.value
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className={cn(
                      'w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0',
                      form.salesStyle === s.value ? 'border-violet-500 bg-violet-500' : 'border-gray-300'
                    )} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.label}</p>
                      <p className="text-xs text-gray-500">{s.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Personality Description</label>
              <textarea
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={4}
                placeholder="Describe how this bot should behave and interact with customers..."
                value={form.personality}
                onChange={e => update('personality', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Configuration</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sales Goals</label>
              <textarea
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono"
                rows={5}
                placeholder="One goal per line:&#10;Understand customer needs&#10;Qualify leads&#10;Schedule demos"
                value={form.goals}
                onChange={e => update('goals', e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">One goal per line</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Supported Languages</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                      form.languages.includes(lang)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300'
                    )}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Response Length</label>
              <div className="flex gap-3">
                {['concise', 'balanced', 'detailed'].map(len => (
                  <button
                    key={len}
                    onClick={() => update('responseLength', len)}
                    className={cn(
                      'flex-1 py-2.5 rounded-xl border-2 text-sm font-medium capitalize transition-all',
                      form.responseLength === len
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {len}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Review & Create</h2>
            <div className="space-y-4">
              {[
                { label: 'Bot Name', value: form.name },
                { label: 'Description', value: form.description || '—' },
                { label: 'Tone', value: form.tone },
                { label: 'Sales Style', value: form.salesStyle },
                { label: 'Languages', value: form.languages.join(', ') },
                { label: 'Response Length', value: form.responseLength },
              ].map(item => (
                <div key={item.label} className="flex justify-between py-3 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-500">{item.label}</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="bg-indigo-50 rounded-xl p-4">
              <p className="text-sm text-indigo-700">
                🚀 Your bot will be created instantly. You can edit all settings anytime from the bot configuration page.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={() => step > 1 ? setStep(step - 1) : router.push('/bots')}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !form.name.trim()}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
            >
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              loading={loading}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
            >
              {loading ? 'Creating...' : 'Create Bot'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
