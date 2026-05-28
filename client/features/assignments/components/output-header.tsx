'use client'

import { FileDown } from 'lucide-react'

import type { QuestionPaperMetadata } from '@/features/assignments/types'

export interface OutputHeaderProps extends QuestionPaperMetadata {
  onDownloadPdf?: () => void
  isPrint?: boolean
}

export function OutputHeader({
  schoolName,
  subject,
  className,
  timeAllowed,
  maximumMarks,
  onDownloadPdf,
  aiMessage = 'Generating customized question paper for your class.',
  isPrint = false,
}: OutputHeaderProps) {
  return (
    <div className={`space-y-6 ${isPrint ? 'print:space-y-4' : ''}`}>
      {!isPrint && (
        <div className="space-y-4 rounded-3xl bg-neutral-900 p-6 text-white shadow-md shadow-brand-orange/5 dark:bg-neutral-950 border border-neutral-800">
          <p className="text-sm font-semibold leading-relaxed opacity-95">{aiMessage}</p>
          <button
            type="button"
            onClick={onDownloadPdf}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-neutral-900 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xs cursor-pointer hover:bg-neutral-50"
          >
            <FileDown size={15} strokeWidth={2.5} className="text-neutral-850" />
            <span>Download as PDF</span>
          </button>
        </div>
      )}

      <div
        className={`space-y-2 border-b-2 border-foreground/20 pb-6 text-center ${isPrint ? 'print:space-y-1 print:pb-4' : ''}`}
      >
        <h1
          className={`font-bold text-foreground ${isPrint ? 'print:text-lg' : 'text-2xl'}`}
        >
          {schoolName}
        </h1>

        <div className={`space-y-1 ${isPrint ? 'print:text-xs' : ''}`}>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">Subject:</span> {subject}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">Class:</span> {className}
          </p>
        </div>

        <div
          className={`flex justify-between pt-2 text-muted-foreground ${isPrint ? 'print:text-xs' : 'text-sm'}`}
        >
          <span className="font-medium">Time Allowed: {timeAllowed} minutes</span>
          <span className="font-medium">Maximum Marks: {maximumMarks}</span>
        </div>
      </div>

      <p className={`text-muted-foreground ${isPrint ? 'print:text-xs' : 'text-sm'}`}>
        All questions are compulsory unless stated otherwise.
      </p>
    </div>
  )
}
