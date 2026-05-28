'use client'

import { SlidersHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'

export interface FilterButtonProps {
  onClick?: () => void
  className?: string
}

export function FilterButton({ onClick, className = '' }: FilterButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full border border-neutral-100 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 shadow-xs dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-350 dark:hover:bg-neutral-900 ${className}`}
      title="Filter assignments"
    >
      <SlidersHorizontal size={15} className="text-neutral-500" />
      <span className="hidden sm:inline">Filter By</span>
    </Button>
  )
}
