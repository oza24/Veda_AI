'use client'

import { Plus } from 'lucide-react'

import { CtaButton } from '@/shared/components/cta-button'

export interface FloatingCreateButtonProps {
  onClick?: () => void
  label?: string
}

export function FloatingCreateButton({
  onClick,
  label = 'Create Assignment',
}: FloatingCreateButtonProps) {
  return (
    <div className="fixed bottom-20 left-1/2 z-20 -translate-x-1/2 md:bottom-8">
      <CtaButton
        size="lg"
        onClick={onClick}
        className="flex items-center gap-2 whitespace-nowrap shadow-xl"
      >
        <Plus size={20} />
        {label}
      </CtaButton>
    </div>
  )
}
