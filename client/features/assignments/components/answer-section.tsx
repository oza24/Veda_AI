import type { Answer } from '@/features/assignments/types'

export interface AnswerSectionProps {
  answers: Answer[]
  isPrint?: boolean
}

export function AnswerSection({ answers, isPrint = false }: AnswerSectionProps) {
  return (
    <div
      className={`space-y-4 border-t-2 border-foreground/20 pt-8 ${isPrint ? 'print:space-y-2 print:pt-4' : ''}`}
    >
      <h2
        className={`font-bold text-foreground ${isPrint ? 'print:text-base' : 'text-lg'}`}
      >
        Answer Key
      </h2>

      <div className="space-y-3">
        {answers.map((answer) => (
          <div key={answer.questionNumber} className={isPrint ? 'print:py-1' : 'py-2'}>
            <div className="flex gap-3">
              <span
                className={`shrink-0 font-semibold text-foreground ${isPrint ? 'print:text-xs' : ''}`}
              >
                Q{answer.questionNumber}:
              </span>
              <p
                className={`leading-relaxed text-foreground ${isPrint ? 'print:text-xs' : 'text-sm'}`}
              >
                {answer.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
