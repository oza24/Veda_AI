'use client'

import { FileDown, RefreshCw } from 'lucide-react'

export interface OutputActionBarProps {
  onDownloadPdf?: () => void
  onRegenerate?: () => void
}

export function OutputActionBar({ onDownloadPdf, onRegenerate }: OutputActionBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-100 bg-white p-4.5 md:hidden dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onRegenerate}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-3 text-xs font-bold text-neutral-700 transition hover:bg-neutral-50 active:scale-[0.98] dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
        >
          <RefreshCw size={15} strokeWidth={2.5} className="text-neutral-500" />
          <span>Regenerate</span>
        </button>
        <button
          type="button"
          onClick={onDownloadPdf}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-neutral-900 px-4 py-3 text-xs font-bold text-white transition hover:bg-neutral-850 active:scale-[0.98] dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          <FileDown size={15} strokeWidth={2.5} />
          <span>Download</span>
        </button>
      </div>
    </div>
  )
}
