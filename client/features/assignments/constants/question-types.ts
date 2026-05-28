export const QUESTION_TYPES = [
  'Multiple Choice Questions',
  'Short Questions',
  'Long Answer Questions',
  'True / False Questions',
  'Diagram/Graph-Based Questions',
  'Numerical Problems',
] as const

export type QuestionType = (typeof QUESTION_TYPES)[number]

export const DEFAULT_QUESTION_TYPE: QuestionType = 'Multiple Choice Questions'

/**
 * Maps frontend display labels → AI-compatible question type strings.
 * These must match the type keys the AI generation service understands:
 * 'multiple_choice' | 'short_answer' | 'long_answer' | 'true_false'
 */
export const QUESTION_TYPE_TO_AI_TYPE: Record<string, string> = {
  'Multiple Choice Questions': 'multiple_choice',
  'Short Questions': 'short_answer',
  'Long Answer Questions': 'long_answer',
  'True / False Questions': 'true_false',
  'Diagram/Graph-Based Questions': 'long_answer',
  'Numerical Problems': 'long_answer',
}
