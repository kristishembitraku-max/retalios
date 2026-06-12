'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bot,
  MessageSquare,
  Users,
  BarChart3,
  BookOpen,
  Brain,
  Settings,
  CreditCard,
  Menu,
  X,
  ChevronDown,
  LogOut,
  UserCircle,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/bots', label: 'Bots', icon: Bot },
  { href: '/conversations', label: 'Conversations', icon: MessageSquare },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/knowledge', label: 'Knowledge Base', icon: BookOpen },
  { href: '/memory', label: 'Memory Viewer', icon: Brain },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/billing', label: 'Billing', icon: CreditCard },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div className="flex h-full flex-col bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            Fluence
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              {' '}AI
            </span>
          </span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-900/40'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  isActive
                    ? 'text-white'
                    : 'text-gray-500 group-hover:text-gray-300'
                )}
              />
              {label}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/70" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-800 p-3">
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-gray-800 transition-colors"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-bold shadow-md shadow-indigo-900/40">
              A
            </div>
            <div className="flex-1 overflow-hidden text-left">
              <p className="truncate font-medium text-white text-xs leading-tight">
                Alex Johnson
              </p>
              <p className="truncate text-gray-500 text-xs">alex@company.com</p>
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-gray-500 transition-transform duration-150',
                userMenuOpen && 'rotate-180'
              )}
            />
          </button>

          {userMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-gray-700 bg-gray-800 py-1 shadow-xl shadow-black/40 z-50">
              <Link
                href="/settings"
                onClick={() => {
                  setUserMenuOpen(false);
                  onClose?.();
                }}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <UserCircle className="h-4 w-4 text-gray-400" />
                Profile &amp; Settings
              </Link>
              <div className="my-1 h-px bg-gray-700" />
              <button
                onClick={() => setUserMenuOpen(false)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-red-400 transition-colors"
              >
                <LogOut className="h-4 w-4 text-gray-400" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:shrink-0 border-r border-gray-800">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute left-0 top-0 bottom-0 w-64 shadow-2xl z-50">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 lg:hidden shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-base">
              Fluence
              <span className="bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent">
                {' '}AI
              </span>
            </span>
          </div>
        </header>

        {/* Desktop top bar */}
        <header className="hidden lg:flex h-14 items-center justify-end gap-3 border-b border-gray-200 bg-white px-6 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-gray-500">All systems operational</span>
          </div>
          <div className="h-5 w-px bg-gray-200 mx-1" />
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-bold">
              A
            </div>
            <span className="text-sm font-medium text-gray-700">Alex Johnson</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
