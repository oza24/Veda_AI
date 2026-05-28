'use client'

import { X } from 'lucide-react'

import { CounterInput } from '@/features/assignments/components/counter-input'
import { QUESTION_TYPES } from '@/features/assignments/constants/question-types'

export interface QuestionTypeRowProps {
  questionType: string
  numQuestions: number
  marks: number
  onQuestionTypeChange: (value: string) => void
  onNumQuestionsChange: (value: number) => void
  onMarksChange: (value: number) => void
  onRemove: () => void
}

export function QuestionTypeRow({
  questionType,
  numQuestions,
  marks,
  onQuestionTypeChange,
  onNumQuestionsChange,
  onMarksChange,
  onRemove,
}: QuestionTypeRowProps) {
  return (
    <div className="grid grid-cols-1 items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-3 md:grid-cols-[1fr_40px_130px_130px] md:gap-4 md:p-3.5 dark:border-neutral-850 dark:bg-neutral-900/50">
      <div className="w-full">
        <label className="mb-1.5 block text-xs font-bold text-neutral-500 md:hidden">
          Question Type
        </label>
        <select
          value={questionType}
          onChange={(e) => onQuestionTypeChange(e.target.value)}
          className="w-full rounded-full border border-neutral-100 bg-neutral-50/50 px-4 py-2.5 text-xs font-bold text-neutral-700 focus:border-brand-orange focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/15 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-350"
        >
          {QUESTION_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-850 dark:hover:text-white"
          aria-label="Remove row"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <CounterInput
        label="No. of Questions"
        value={numQuestions}
        onChange={onNumQuestionsChange}
        min={1}
        max={100}
        hideLabelOnDesktop
      />

      <CounterInput
        label="Marks per Q"
        value={marks}
        onChange={onMarksChange}
        min={1}
        max={200}
        hideLabelOnDesktop
      />
    </div>
  )
}
