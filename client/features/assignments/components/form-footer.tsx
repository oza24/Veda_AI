'use client'

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

export interface FormFooterProps {
  onPrevious?: () => void
  onNext?: () => void
  showPrevious?: boolean
  showNext?: boolean
  isLoading?: boolean
}

export function FormFooter({
  onPrevious,
  onNext,
  showPrevious = true,
  showNext = true,
  isLoading = false,
}: FormFooterProps) {
  return (
    <div className="mt-8 flex items-center justify-between gap-4 border-t border-border pt-8">
      {showPrevious ? (
        <button
          type="button"
          onClick={onPrevious}
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-6 py-2.5 text-xs font-bold text-neutral-700 transition-all duration-200 hover:scale-[1.02] hover:bg-neutral-50 active:scale-[0.98] dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
        >
          <ChevronLeft className="h-4 w-4 text-neutral-500" strokeWidth={2.5} />
          <span>Previous</span>
        </button>
      ) : (
        <div />
      )}

      {showNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-6 py-2.5 text-xs font-bold text-white transition-all duration-200 hover:scale-[1.02] hover:bg-neutral-850 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Generating…</span>
            </>
          ) : (
            <>
              <span>Next</span>
              <ChevronRight className="h-4 w-4 text-neutral-200 dark:text-neutral-800" strokeWidth={2.5} />
            </>
          )}
        </button>
      )}
    </div>
  )
}
