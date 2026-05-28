'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// ─────────────────────────────────────────────────────────────
// TypeScript declarations for the Web Speech API
// (not included in lib.dom.d.ts for older TS targets)
// ─────────────────────────────────────────────────────────────
interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  [index: number]: { transcript: string; confidence: number }
}

interface SpeechRecognitionResultList {
  readonly length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
  readonly message: string
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: ((event: Event) => void) | null
  onstart: ((event: Event) => void) | null
  onnomatch: ((event: Event) => void) | null
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance
  }
}

// ─────────────────────────────────────────────────────────────
// Hook types
// ─────────────────────────────────────────────────────────────
export interface UseSpeechRecognitionOptions {
  /**
   * BCP-47 language tag.
   * 'en-IN' supports both English (India) and Hindi via code-switching.
   */
  lang?: string
  /** Keep listening after each pause (default: true) */
  continuous?: boolean
  /** Emit results before the utterance is final (default: true) */
  interimResults?: boolean
  /**
   * Called whenever the transcript changes.
   * @param transcript – the words recognised so far
   * @param isFinal   – true when the browser is confident the utterance is complete
   */
  onTranscript: (transcript: string, isFinal: boolean) => void
}

export interface UseSpeechRecognitionReturn {
  isListening: boolean
  isSupported: boolean
  error: string | null
  toggleListening: () => void
  stopListening: () => void
}

// ─────────────────────────────────────────────────────────────
// Hook implementation
// ─────────────────────────────────────────────────────────────
export function useSpeechRecognition({
  lang = 'en-IN',
  continuous = true,
  interimResults = true,
  onTranscript,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Start as false on both server and client to avoid hydration mismatch.
  // Set to true in useEffect (client-only) once the API availability is known.
  const [isSupported, setIsSupported] = useState(false)

  // Keep a stable ref to the active recognition instance
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  // Track mount state to avoid setState on unmounted component
  const mountedRef = useRef(true)
  // Keep onTranscript stable so we don't recreate recognition unnecessarily
  const onTranscriptRef = useRef(onTranscript)
  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  // ── build a fresh recognition instance ──────────────────────
  const buildRecognition = useCallback((): SpeechRecognitionInstance | null => {
    if (typeof window === 'undefined') return null
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Ctor) return null

    const rec = new Ctor()
    rec.continuous = continuous
    rec.interimResults = interimResults
    rec.lang = lang
    rec.maxAlternatives = 1

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i]
        const text = r[0]?.transcript ?? ''
        if (r.isFinal) {
          final += text
        } else {
          interim += text
        }
      }

      if (final) {
        onTranscriptRef.current(final, true)
      } else if (interim) {
        onTranscriptRef.current(interim, false)
      }
    }

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (!mountedRef.current) return
      // 'aborted' fires when we call .stop() ourselves — silent
      if (event.error === 'aborted') return

      const messages: Record<string, string> = {
        'not-allowed': 'Microphone permission denied. Please allow access and try again.',
        'permission-denied': 'Microphone permission denied. Please allow access and try again.',
        'no-speech': 'No speech detected. Try speaking closer to the microphone.',
        'network': 'Network error. Check your connection and try again.',
        'audio-capture': 'No microphone found. Please connect one and try again.',
        'service-not-allowed': 'Speech service is blocked. Try enabling it in browser settings.',
      }

      setError(messages[event.error] ?? `Speech recognition error: ${event.error}`)
      setIsListening(false)
    }

    rec.onend = () => {
      if (!mountedRef.current) return
      setIsListening(false)
    }

    return rec
  }, [continuous, interimResults, lang])

  // ── start ────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
      return
    }

    setError(null)
    const rec = buildRecognition()
    if (!rec) return

    recognitionRef.current = rec
    try {
      rec.start()
      setIsListening(true)
    } catch {
      setError('Could not start speech recognition. Please try again.')
    }
  }, [isSupported, buildRecognition])

  // ── stop ─────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setIsListening(false)
  }, [])

  // ── toggle ───────────────────────────────────────────────────
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, stopListening, startListening])

  // ── cleanup on unmount ────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true
    // Detect browser support client-side only (window is undefined during SSR)
    setIsSupported(
      !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    )
    return () => {
      mountedRef.current = false
      recognitionRef.current?.abort()
      recognitionRef.current = null
    }
  }, [])

  return { isListening, isSupported, error, toggleListening, stopListening }
}
