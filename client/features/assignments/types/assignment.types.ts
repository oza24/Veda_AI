export interface Assignment {
  id: string
  title: string
  assignedDate: string
  dueDate: string
}

export interface QuestionTypeConfig {
  id: string
  type: string
  numQuestions: number
  marks: number
}

export interface AssignmentFormState {
  uploadedFile: File | null
  dueDate: string
  questionRows: QuestionTypeConfig[]
  additionalInfo: string
}
