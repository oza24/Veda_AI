import { QuestionItem } from '@/features/assignments/components/question-item'
import type { Question } from '@/features/assignments/types'

export interface QuestionSectionProps {
  section: string
  instruction: string
  questions: Question[]
  startNumber?: number
  isPrint?: boolean
}

export function QuestionSection({
  section,
  instruction,
  questions,
  startNumber = 1,
  isPrint = false,
}: QuestionSectionProps) {
  return (
    <div className={`space-y-6 ${isPrint ? 'print:space-y-4' : ''}`}>
      <div>
        <h2
          className={`mb-2 font-bold text-foreground ${isPrint ? 'print:text-base' : 'text-lg'}`}
        >
          {section}
        </h2>
        <p
          className={`italic text-muted-foreground ${isPrint ? 'print:text-xs' : 'text-sm'}`}
        >
          {instruction}
        </p>
      </div>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <QuestionItem
            key={question.id}
            number={startNumber + index}
            text={question.text}
            marks={question.marks}
            difficulty={question.difficulty}
            isPrint={isPrint}
          />
        ))}
      </div>
    </div>
  )
}
