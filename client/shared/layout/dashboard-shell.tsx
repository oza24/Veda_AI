'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'

import { ROUTES } from '@/shared/constants/navigation'
import { AppNavbar } from '@/shared/layout/app-navbar'
import { AppSidebar } from '@/shared/layout/app-sidebar'
import { MobileBottomNav } from '@/shared/layout/mobile-bottom-nav'

export interface DashboardShellProps {
  children: React.ReactNode
  showMobileCreateFab?: boolean
  onMobileCreateClick?: () => void
}

export function DashboardShell({
  children,
  showMobileCreateFab = true,
  onMobileCreateClick,
}: DashboardShellProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const isOutputPage = pathname === ROUTES.assignmentOutput
  const hideCreateFab = isOutputPage || showMobileCreateFab === false

  return (
    <div className="min-h-screen w-full bg-background">
      <AppSidebar isOpen={sidebarOpen} />

      <div
        className={`pt-16 md:ml-64 ${isOutputPage ? 'pb-0' : 'pb-20 md:pb-0'}`}
      >
        <AppNavbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="w-full">{children}</main>
      </div>

      {!isOutputPage && (
        <MobileBottomNav
          showCreateFab={!hideCreateFab}
          onCreateClick={onMobileCreateClick}
        />
      )}

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}
    </div>
  )
}
