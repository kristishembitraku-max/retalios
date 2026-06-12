'use client'

import { Check, Zap, Building2, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    icon: Zap,
    color: 'text-indigo-600 bg-indigo-50',
    features: ['3 AI Bots', '1,000 conversations/mo', 'Basic analytics', 'Email support', '5MB knowledge base', '2 languages'],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 79,
    icon: Rocket,
    color: 'text-violet-600 bg-violet-50',
    popular: true,
    features: ['10 AI Bots', '10,000 conversations/mo', 'Advanced analytics', 'Priority support', '50MB knowledge base', '12 languages', 'Long-term memory', 'Custom branding'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    icon: Building2,
    color: 'text-emerald-600 bg-emerald-50',
    features: ['Unlimited bots', 'Unlimited conversations', 'Full analytics suite', 'Dedicated support', 'Unlimited knowledge base', 'All languages', 'Advanced memory', 'White-label', 'SSO/SAML', 'SLA guarantee'],
  },
]

const USAGE_HISTORY = [
  { month: 'May 2025', conversations: 847, messages: 5621, cost: '$79.00' },
  { month: 'Apr 2025', conversations: 923, messages: 6102, cost: '$79.00' },
  { month: 'Mar 2025', conversations: 712, messages: 4891, cost: '$79.00' },
]

export default function BillingPage() {
  const currentPlan = 'growth'
  const usage = { conversations: 342, conversationsLimit: 10000, bots: 3, botsLimit: 10 }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-500 mt-1">Manage your subscription and usage</p>
      </div>

      {/* Current plan */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-indigo-200 text-sm mb-1">Current Plan</p>
            <p className="text-3xl font-bold">Growth</p>
            <p className="text-indigo-200 text-sm mt-1">$79 / month · Renews June 30, 2025</p>
          </div>
          <div className="text-right">
            <Badge className="bg-white/20 text-white border-white/30 mb-2">Active</Badge>
            <p className="text-sm text-indigo-200">Next invoice: $79.00</p>
          </div>
        </div>
      </div>

      {/* Usage */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">This Month's Usage</h2>
        <div className="grid grid-cols-2 gap-6">
          {[
            { label: 'Conversations', used: usage.conversations, limit: usage.conversationsLimit },
            { label: 'Active Bots', used: usage.bots, limit: usage.botsLimit },
          ].map(u => (
            <div key={u.label}>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-700">{u.label}</span>
                <span className="text-gray-500">{u.used.toLocaleString()} / {u.limit.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    (u.used / u.limit) > 0.8 ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-violet-600'
                  )}
                  style={{ width: `${Math.min((u.used / u.limit) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{Math.round((u.used / u.limit) * 100)}% used</p>
            </div>
          ))}
        </div>
      </div>

      {/* Plan selection */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Plan</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {PLANS.map(plan => (
          <div
            key={plan.id}
            className={cn(
              'bg-white border-2 rounded-2xl p-6 relative',
              plan.popular ? 'border-indigo-500' : 'border-gray-200',
              plan.id === currentPlan && 'ring-2 ring-indigo-300'
            )}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
            )}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${plan.color}`}>
              <plan.icon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">${plan.price}<span className="text-base font-normal text-gray-400">/mo</span></p>

            <ul className="mt-4 space-y-2">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-6">
              {plan.id === currentPlan ? (
                <div className="w-full py-2 text-center text-sm font-medium text-indigo-600 bg-indigo-50 rounded-xl">
                  Current Plan
                </div>
              ) : (
                <Button
                  variant="outline"
                  className={cn('w-full', plan.popular && 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0 hover:opacity-90')}
                  onClick={() => alert('Stripe integration: upgrade/downgrade flow')}
                >
                  {plan.price > 79 ? 'Upgrade' : 'Downgrade'}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* History */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Invoice History</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Period</th>
              <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Conversations</th>
              <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Messages</th>
              <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Amount</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {USAGE_HISTORY.map(h => (
              <tr key={h.month}>
                <td className="px-6 py-3 text-sm font-medium text-gray-900">{h.month}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{h.conversations.toLocaleString()}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{h.messages.toLocaleString()}</td>
                <td className="px-6 py-3 text-sm font-semibold text-gray-900">{h.cost}</td>
                <td className="px-6 py-3">
                  <button className="text-xs text-indigo-600 hover:underline">Download PDF</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
