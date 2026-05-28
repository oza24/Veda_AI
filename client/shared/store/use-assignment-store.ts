'use client'

import { create } from 'zustand'

import type { Assignment } from '@/features/assignments/types'
import { MOCK_ASSIGNMENTS } from '@/features/assignments/data/mock-assignments'

export interface AssignmentState {
  assignments: Assignment[]
  addAssignment: (assignment: Omit<Assignment, 'id' | 'assignedDate'>) => void
  deleteAssignment: (id: string) => void
  setAssignments: (assignments: Assignment[]) => void
}

export const useAssignmentStore = create<AssignmentState>((set) => ({
  assignments: MOCK_ASSIGNMENTS,
  
  addAssignment: (newAssignment) =>
    set((state) => {
      // Calculate next unique numerical ID
      const maxId = state.assignments.reduce(
        (max, item) => Math.max(max, parseInt(item.id, 10) || 0),
        0
      )
      const nextId = (maxId + 1).toString()
      
      // Calculate today's date formatted as DD-MM-YYYY
      const today = new Date()
      const day = String(today.getDate()).padStart(2, '0')
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const year = today.getFullYear()
      const assignedDate = `${day}-${month}-${year}`

      const createdItem: Assignment = {
        id: nextId,
        assignedDate,
        title: newAssignment.title,
        dueDate: newAssignment.dueDate || '27-06-2025',
      }

      return { assignments: [createdItem, ...state.assignments] }
    }),

  deleteAssignment: (id) =>
    set((state) => ({
      assignments: state.assignments.filter((item) => item.id !== id),
    })),

  setAssignments: (assignments) => set({ assignments }),
}))
