import type { QuestionDifficulty } from '@/features/assignments/types'

export interface DifficultyBadgeProps {
  difficulty?: QuestionDifficulty
  className?: string
}

const DIFFICULTY_STYLES: Record<QuestionDifficulty, string> = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
}

const DIFFICULTY_LABELS: Record<QuestionDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export function DifficultyBadge({
  difficulty = 'medium',
  className = '',
}: DifficultyBadgeProps) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${DIFFICULTY_STYLES[difficulty]} ${className}`}
    >
      {DIFFICULTY_LABELS[difficulty]}
    </span>
  )
}
