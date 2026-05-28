export type QuestionDifficulty = 'easy' | 'medium' | 'hard'

export interface Question {
  id: string
  text: string
  marks: number
  difficulty?: QuestionDifficulty
}

export interface QuestionSectionData {
  section: string
  instruction: string
  questions: Question[]
  startNumber?: number
}

export interface Answer {
  questionNumber: number
  text: string
}

export interface QuestionPaperMetadata {
  schoolName: string
  subject: string
  className: string
  timeAllowed: number
  maximumMarks: number
  aiMessage?: string
}
