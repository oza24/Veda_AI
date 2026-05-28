'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown, Plus, Settings } from 'lucide-react'

import { CtaButton } from '@/shared/components/cta-button'
import { useAssignmentStore } from '@/shared/store'
import {
  ASSIGNMENT_SUB_NAV_ITEMS,
  PRIMARY_NAV_ITEMS,
  ROUTES,
} from '@/shared/constants/navigation'

export interface AppSidebarProps {
  isOpen?: boolean
}

export function AppSidebar({ isOpen = true }: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  const { assignments } = useAssignmentStore()

  const handleNavClick = (label: string, href: string) => {
    if (label === 'Assignments') {
      setExpandedGroup(expandedGroup === 'Assignments' ? null : 'Assignments')
      if (href !== '#') {
        router.push(href)
      }
      return
    }

    if (href !== '#') {
      router.push(href)
    }
  }

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ${
        !isOpen ? '-translate-x-full' : ''
      }`}
    >
      <div className="border-b border-sidebar-border p-5">
        <div className="mb-6 flex items-center gap-2.5 px-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-orange to-red-500 shadow-md shadow-brand-orange/20">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-sidebar-foreground">VedaAI</span>
        </div>

        <button
          type="button"
          onClick={() => router.push(ROUTES.createAssignment)}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-brand-orange bg-neutral-900 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-orange/10 transition-all duration-200 hover:scale-[1.02] hover:bg-neutral-850 hover:shadow-brand-orange/20 active:scale-[0.98]"
        >
          <Plus size={16} strokeWidth={2.5} className="text-brand-orange" />
          <span>Create Assignment</span>
        </button>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href !== '#' &&
            (pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href)))

          return (
            <div key={item.label} className="px-1">
              <button
                type="button"
                onClick={() => handleNavClick(item.label, item.href)}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-neutral-100 text-neutral-900 font-semibold shadow-xs dark:bg-neutral-800 dark:text-white'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-855 dark:hover:text-white'
                }`}
              >
                <Icon size={18} className="shrink-0 opacity-80" />
                <span className="flex-1">{item.label}</span>
                
                {item.label === 'Assignments' && (
                  <span className="mr-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-orange px-1.5 text-[11px] font-bold text-white shadow-sm shadow-brand-orange/20">
                    {assignments.length}
                  </span>
                )}

                {item.label === 'Assignments' && (
                  <ChevronDown
                    size={14}
                    className={`transition-transform opacity-65 ${
                      expandedGroup === 'Assignments' ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>

              {item.label === 'Assignments' && expandedGroup === 'Assignments' && (
                <div className="ml-5 mt-1 space-y-1 border-l border-neutral-100 pl-2 dark:border-neutral-800">
                  {ASSIGNMENT_SUB_NAV_ITEMS.map((subItem) => (
                    <button
                      key={subItem.label}
                      type="button"
                      onClick={() => subItem.href !== '#' && router.push(subItem.href)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-850/50 dark:hover:text-white"
                    >
                      {subItem.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="space-y-3.5 border-t border-sidebar-border p-4">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-850/50 dark:hover:text-white"
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>

        <div className="rounded-2xl border border-neutral-100 bg-neutral-50/50 p-3 dark:border-neutral-800/40 dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/30">
              <svg className="h-4.5 w-4.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Delhi Public School
              </p>
              <p className="truncate text-[10px] font-medium text-neutral-450 dark:text-neutral-400">
                Bokaro Steel City
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
