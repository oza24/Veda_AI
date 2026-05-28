'use client'

import { create } from 'zustand'

import type { Answer, Question, QuestionPaperMetadata } from '@/features/assignments/types'

export interface GeneratedPaperState {
  metadata: QuestionPaperMetadata | null
  sectionA: Question[]
  sectionB: Question[]
  answers: Answer[]
  setPaper: (paper: {
    metadata: QuestionPaperMetadata
    sectionA: Question[]
    sectionB: Question[]
    answers: Answer[]
  }) => void
  clearPaper: () => void
}

export const useGeneratedPaperStore = create<GeneratedPaperState>((set) => ({
  metadata: null,
  sectionA: [],
  sectionB: [],
  answers: [],

  setPaper: (paper) =>
    set({
      metadata: paper.metadata,
      sectionA: paper.sectionA,
      sectionB: paper.sectionB,
      answers: paper.answers,
    }),

  clearPaper: () =>
    set({
      metadata: null,
      sectionA: [],
      sectionB: [],
      answers: [],
    }),
}))
