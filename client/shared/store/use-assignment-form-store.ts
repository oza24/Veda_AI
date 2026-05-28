'use client'

import { create } from 'zustand'

import type { QuestionTypeConfig } from '@/features/assignments/types'
import { DEFAULT_QUESTION_TYPE } from '@/features/assignments/constants/question-types'

export interface AssignmentFormState {
  uploadedFile: File | null
  dueDate: string
  questionRows: QuestionTypeConfig[]
  additionalInfo: string
  title: string
  subject: string
  difficulty: 'easy' | 'medium' | 'hard'
  setUploadedFile: (file: File | null) => void
  setDueDate: (date: string) => void
  setAdditionalInfo: (info: string) => void
  setTitle: (title: string) => void
  setSubject: (subject: string) => void
  setDifficulty: (difficulty: 'easy' | 'medium' | 'hard') => void
  addQuestionRow: () => void
  removeQuestionRow: (id: string) => void
  updateQuestionRow: (id: string, field: keyof Omit<QuestionTypeConfig, 'id'>, value: string | number) => void
  resetForm: () => void
}

const INITIAL_ROW: QuestionTypeConfig = {
  id: '1',
  type: DEFAULT_QUESTION_TYPE,
  numQuestions: 5,
  marks: 3,
}

export const useAssignmentFormStore = create<AssignmentFormState>((set) => ({
  uploadedFile: null,
  dueDate: '',
  questionRows: [INITIAL_ROW],
  additionalInfo: '',
  title: '',
  subject: '',
  difficulty: 'medium',

  setUploadedFile: (file) => set({ uploadedFile: file }),
  
  setDueDate: (date) => set({ dueDate: date }),
  
  setAdditionalInfo: (info) => set({ additionalInfo: info }),

  setTitle: (title) => set({ title }),

  setSubject: (subject) => set({ subject }),

  setDifficulty: (difficulty) => set({ difficulty }),

  addQuestionRow: () =>
    set((state) => {
      const nextId = (
        Math.max(...state.questionRows.map((r) => parseInt(r.id, 10) || 0), 0) + 1
      ).toString()
      
      const newRow: QuestionTypeConfig = {
        id: nextId,
        type: DEFAULT_QUESTION_TYPE,
        numQuestions: 1,
        marks: 1,
      }
      
      return { questionRows: [...state.questionRows, newRow] }
    }),

  removeQuestionRow: (id) =>
    set((state) => ({
      questionRows: state.questionRows.filter((r) => r.id !== id),
    })),

  updateQuestionRow: (id, field, value) =>
    set((state) => ({
      questionRows: state.questionRows.map((r) =>
         r.id === id ? { ...r, [field]: value } : r
      ),
    })),

  resetForm: () =>
    set({
      uploadedFile: null,
      dueDate: '',
      questionRows: [INITIAL_ROW],
      additionalInfo: '',
      title: '',
      subject: '',
      difficulty: 'medium',
    }),
}))
