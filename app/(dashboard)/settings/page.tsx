'use client'

import { useState } from 'react'
import { User, Building2, Shield, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'organization', label: 'Organization', icon: Building2 },
  { id: 'security', label: 'Security', icon: Shield },
]

export default function SettingsPage() {
  const [tab, setTab] = useState('profile')
  const [saving, setSaving] = useState(false)

  const [profile, setProfile] = useState({ name: 'Alex Johnson', email: 'alex@company.com' })
  const [org, setOrg] = useState({ name: 'Acme Corp', slug: 'acme-corp', plan: 'growth' })
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })

  const save = async (section: string) => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    toast.success(`${section} updated successfully`)
    setSaving(false)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and organization</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left text-sm font-medium transition-all',
                  tab === t.id
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {tab === 'profile' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h2>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xl">
                  {profile.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{profile.name}</p>
                  <p className="text-sm text-gray-400">{profile.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={profile.name}
                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500"
                    value={profile.email}
                    disabled
                  />
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed. Contact support if needed.</p>
                </div>
                <div className="pt-2">
                  <Button onClick={() => save('Profile')} loading={saving} className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
                    <Save className="w-4 h-4 mr-2" /> Save Profile
                  </Button>
                </div>
              </div>
            </div>
          )}

          {tab === 'organization' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Organization Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization Name</label>
                  <input
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={org.name}
                    onChange={e => setOrg(o => ({ ...o, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug</label>
                  <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                    <span className="px-3 py-2.5 bg-gray-50 text-sm text-gray-400 border-r border-gray-300">fluenceai.com/</span>
                    <input
                      className="flex-1 px-3 py-2.5 text-sm bg-gray-50 text-gray-500"
                      value={org.slug}
                      disabled
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Plan</label>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold capitalize">
                      {org.plan}
                    </span>
                    <a href="/billing" className="text-sm text-indigo-600 hover:underline">Manage billing →</a>
                  </div>
                </div>
                <div className="pt-2">
                  <Button onClick={() => save('Organization')} loading={saving} className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
                    <Save className="w-4 h-4 mr-2" /> Save Organization
                  </Button>
                </div>
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Security</h2>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Change Password</h3>
              <div className="space-y-4 max-w-sm">
                {[
                  { key: 'current', label: 'Current Password', placeholder: '••••••••' },
                  { key: 'next', label: 'New Password', placeholder: '••••••••' },
                  { key: 'confirm', label: 'Confirm New Password', placeholder: '••••••••' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                    <input
                      type="password"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder={f.placeholder}
                      value={passwords[f.key as keyof typeof passwords]}
                      onChange={e => setPasswords(p => ({ ...p, [f.key]: e.target.value }))}
                    />
                  </div>
                ))}
                <div className="pt-2">
                  <Button
                    onClick={() => save('Password')}
                    loading={saving}
                    disabled={!passwords.current || passwords.next !== passwords.confirm}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                  >
                    Update Password
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
