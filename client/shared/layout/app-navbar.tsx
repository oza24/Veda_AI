'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, Bell, ChevronDown, Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { BREADCRUMB_BY_PATH } from '@/shared/constants/navigation'
import { useSystemStore } from '@/shared/store'

export interface AppNavbarProps {
  onMenuClick?: () => void
}

export function AppNavbar({ onMenuClick }: AppNavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { wsStatus, setWsStatus } = useSystemStore()

  const breadcrumb = BREADCRUMB_BY_PATH[pathname] ?? 'VedaAI'

  return (
    <nav className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background px-6 md:left-64">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.back()}
        className="hidden md:flex text-neutral-600 hover:bg-neutral-100 dark:text-neutral-350 dark:hover:bg-neutral-800"
        aria-label="Go back"
      >
        <ArrowLeft size={18} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="md:hidden text-neutral-600 hover:bg-neutral-100 dark:text-neutral-350 dark:hover:bg-neutral-800"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </Button>

      <div className="flex-1">
        <span className="text-sm font-semibold tracking-tight text-neutral-800 dark:text-neutral-200">
          {breadcrumb}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* WebSocket Status Indicator */}
        <button
          type="button"
          onClick={() => {
            const nextStatus: Record<string, 'connected' | 'connecting' | 'disconnected'> = {
              connected: 'connecting',
              connecting: 'disconnected',
              disconnected: 'connected',
            }
            setWsStatus(nextStatus[wsStatus] || 'connected')
          }}
          className="flex items-center gap-1.5 rounded-full border border-neutral-100 bg-neutral-50/50 px-2.5 py-1 text-[10px] font-bold text-neutral-600 transition-all hover:bg-neutral-100 active:scale-[0.98] dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-450 cursor-pointer"
          title="WebSocket Status (Click to toggle states)"
        >
          <span className={`h-1.5 w-1.5 rounded-full shadow-xs ${
            wsStatus === 'connected' ? 'bg-emerald-500 shadow-emerald-500/30 animate-pulse' :
            wsStatus === 'connecting' ? 'bg-amber-500 shadow-amber-500/30 animate-pulse' :
            'bg-red-500 shadow-red-500/30'
          }`} />
          <span className="hidden sm:inline capitalize">{wsStatus}</span>
        </button>

        <Button
          variant="ghost"
          size="icon"
          className="relative text-neutral-600 hover:bg-neutral-100 dark:text-neutral-350 dark:hover:bg-neutral-800"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute right-3.5 top-3.5 h-2 w-2 rounded-full bg-brand-orange shadow-sm shadow-brand-orange/50 animate-pulse" />
        </Button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 rounded-full border border-neutral-100 bg-neutral-50/50 px-3 py-1.5 shadow-xs transition-all hover:bg-neutral-100/80 active:scale-[0.98] dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:bg-neutral-800"
            aria-expanded={isDropdownOpen}
            aria-haspopup="menu"
          >
            <img
              src="/placeholder-user.jpg"
              alt="John Doe"
              className="h-7 w-7 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const sibling = e.currentTarget.nextElementSibling as HTMLDivElement;
                if (sibling) sibling.style.display = 'flex';
              }}
            />
            <div className="hidden h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-orange to-red-500 text-[10px] font-bold text-white">
              JD
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-neutral-700 dark:text-neutral-350">
              John Doe
            </span>
            <ChevronDown size={12} className="text-neutral-450 dark:text-neutral-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-48 rounded-2xl border border-neutral-100 bg-white p-1 shadow-lg dark:border-neutral-800 dark:bg-neutral-950">
              <button
                type="button"
                className="w-full rounded-xl px-4 py-2 text-left text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900"
              >
                Profile
              </button>
              <button
                type="button"
                className="w-full rounded-xl px-4 py-2 text-left text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900"
              >
                Preferences
              </button>
              <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />
              <button
                type="button"
                className="w-full rounded-xl px-4 py-2 text-left text-xs font-medium text-destructive transition-colors hover:bg-destructive/5"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
