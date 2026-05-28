'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

import { PRIMARY_NAV_ITEMS, ROUTES } from '@/shared/constants/navigation'

export interface MobileBottomNavProps {
  onCreateClick?: () => void
  showCreateFab?: boolean
}

export function MobileBottomNav({
  onCreateClick,
  showCreateFab = true,
}: MobileBottomNavProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleNavClick = (href: string) => {
    if (href !== '#') {
      router.push(href)
    }
  }

  const handleCreate = () => {
    if (onCreateClick) {
      onCreateClick()
      return
    }
    router.push(ROUTES.createAssignment)
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-around border-t border-border bg-background md:hidden">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href !== '#' &&
            (pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href)))

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => handleNavClick(item.href)}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors ${
                isActive ? 'text-primary' : 'hover:bg-secondary'
              }`}
            >
              <Icon size={24} className="text-foreground" />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {showCreateFab && (
        <button
          type="button"
          onClick={handleCreate}
          className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl md:hidden"
          aria-label="Create assignment"
        >
          <Plus size={28} />
        </button>
      )}
    </>
  )
}
