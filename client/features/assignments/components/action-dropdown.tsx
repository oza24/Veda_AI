'use client'

import { useState } from 'react'
import { MoreVertical } from 'lucide-react'

import { Button } from '@/components/ui/button'

export interface ActionDropdownProps {
  onView?: () => void
  onDelete?: () => void
}

export function ActionDropdown({ onView, onDelete }: ActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8"
        aria-label="Assignment actions"
      >
        <MoreVertical size={16} />
      </Button>

      {isOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute right-0 z-50 mt-2 w-40 rounded-lg border border-border bg-card shadow-lg">
            <button
              type="button"
              onClick={() => {
                onView?.()
                setIsOpen(false)
              }}
              className="w-full rounded-t-lg px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary"
            >
              View Assignment
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete?.()
                setIsOpen(false)
              }}
              className="w-full rounded-b-lg px-4 py-2 text-left text-sm text-destructive transition-colors hover:bg-secondary"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}
