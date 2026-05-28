'use client'

import { create } from 'zustand'

export type WebSocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface SystemState {
  isLoading: boolean
  isGenerating: boolean
  wsStatus: WebSocketStatus
  setLoading: (loading: boolean) => void
  setGenerating: (generating: boolean) => void
  setWsStatus: (status: WebSocketStatus) => void
}

export const useSystemStore = create<SystemState>((set) => ({
  isLoading: false,
  isGenerating: false,
  wsStatus: 'connected', // Defaulting to connected for mock showcase
  setLoading: (loading) => set({ isLoading: loading }),
  setGenerating: (generating) => set({ isGenerating: generating }),
  setWsStatus: (status) => set({ wsStatus: status }),
}))
