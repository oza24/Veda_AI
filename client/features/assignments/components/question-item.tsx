import { DifficultyBadge } from '@/features/assignments/components/difficulty-badge'
import type { QuestionDifficulty } from '@/features/assignments/types'

export interface QuestionItemProps {
  number: number
  text: string
  marks: number
  difficulty?: QuestionDifficulty
  isPrint?: boolean
}

export function QuestionItem({
  number,
  text,
  marks,
  difficulty = 'medium',
  isPrint = false,
}: QuestionItemProps) {
  return (
    <div
      className={`flex gap-4 border-b border-border pb-6 last:border-b-0 last:pb-0 ${isPrint ? 'print:pb-3' : ''}`}
    >
      <div className="shrink-0">
        <span
          className={`font-semibold text-foreground ${isPrint ? 'print:text-sm' : ''}`}
        >
          {number}.
        </span>
      </div>

      <div className="flex-1 space-y-2">
        <p
          className={`leading-relaxed text-foreground ${isPrint ? 'print:text-sm' : 'text-base'}`}
        >
          {text}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <DifficultyBadge difficulty={difficulty} />
          <span
            className={`text-sm font-medium text-muted-foreground ${isPrint ? 'print:text-xs' : ''}`}
          >
            Marks: {marks}
          </span>
        </div>
      </div>
    </div>
  )
}
