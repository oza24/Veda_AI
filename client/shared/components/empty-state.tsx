import { Plus } from 'lucide-react'
import { CtaButton } from '@/shared/components/cta-button'

export interface EmptyStateProps {
  heading: string
  description: string
  ctaText: string
  ctaAction?: () => void
  ctaHref?: string
  icon?: React.ReactNode
}

export function EmptyState({
  heading,
  description,
  ctaText,
  ctaAction,
  ctaHref,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      {icon ? (
        <div className="mb-6">{icon}</div>
      ) : (
        <div className="relative flex h-48 w-48 items-center justify-center mb-6">
          {/* Faint background circle */}
          <div className="absolute inset-0 rounded-full bg-neutral-100/50 scale-[0.95] dark:bg-neutral-900/30" />
          
          {/* Decorative Sparkles */}
          <svg className="absolute top-4 left-6 h-4.5 w-4.5 text-brand-orange animate-bounce" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
          </svg>
          <svg className="absolute bottom-6 right-6 h-5 w-5 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
          </svg>

          {/* Document and Magnifying Glass illustration */}
          <svg className="relative z-10 h-32 w-32" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Document sheet */}
            <rect x="25" y="20" width="55" height="70" rx="8" fill="white" stroke="#E5E7EB" strokeWidth="2.5" className="dark:fill-neutral-950 dark:stroke-neutral-800" />
            
            {/* Document lines */}
            <line x1="37" y1="38" x2="68" y2="38" stroke="#E5E7EB" strokeWidth="3.5" strokeLinecap="round" className="dark:stroke-neutral-800" />
            <line x1="37" y1="50" x2="60" y2="50" stroke="#E5E7EB" strokeWidth="3.5" strokeLinecap="round" className="dark:stroke-neutral-800" />
            <line x1="37" y1="62" x2="52" y2="62" stroke="#E5E7EB" strokeWidth="3.5" strokeLinecap="round" className="dark:stroke-neutral-800" />

            {/* Magnifying Glass */}
            {/* Handle */}
            <line x1="72" y1="72" x2="95" y2="95" stroke="#9CA3AF" strokeWidth="6.5" strokeLinecap="round" />
            
            {/* Frame & Lens */}
            <circle cx="58" cy="58" r="22" fill="white" stroke="#4B5563" strokeWidth="3.5" className="dark:fill-neutral-900 dark:stroke-neutral-700" />
            
            {/* Red 'X' circle inside lens */}
            <circle cx="58" cy="58" r="14" fill="#EF4444" />
            
            {/* White 'X' lines */}
            <path d="M52 52L64 64M64 52L52 64" stroke="white" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      )}

      <h2 className="mb-2 text-center text-xl font-bold tracking-tight text-neutral-800 dark:text-neutral-200 sm:text-2xl">
        {heading}
      </h2>

      <p className="mb-8 max-w-sm text-center text-xs font-medium leading-relaxed text-neutral-500 dark:text-neutral-450">
        {description}
      </p>

      <CtaButton size="md" onClick={ctaAction} href={ctaHref} className="flex items-center gap-2">
        <Plus size={16} strokeWidth={2.5} />
        <span>{ctaText}</span>
      </CtaButton>
    </div>
  )
}
