'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Plus } from 'lucide-react'

import { QuestionTypeRow } from '@/features/assignments/components/question-type-row'
import { UploadBox } from '@/features/assignments/components/upload-box'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'
import { useAssignmentFormStore } from '@/shared/store'

export function AssignmentForm() {
  const {
    uploadedFile,
    dueDate,
    questionRows,
    additionalInfo,
    title,
    subject,
    difficulty,
    setUploadedFile,
    setDueDate,
    setAdditionalInfo,
    setTitle,
    setSubject,
    setDifficulty,
    addQuestionRow,
    removeQuestionRow,
    updateQuestionRow,
  } = useAssignmentFormStore()

  // ── Voice-to-text state ─────────────────────────────────────
  // Text captured at the moment listening starts (so we can append)
  const baseTextRef = useRef('')
  // Interim preview — words the browser is still uncertain about
  const [interimPreview, setInterimPreview] = useState('')
  const [voiceError, setVoiceError] = useState<string | null>(null)
  // Auto-dismiss voice error after 5 s
  useEffect(() => {
    if (!voiceError) return
    const t = setTimeout(() => setVoiceError(null), 5000)
    return () => clearTimeout(t)
  }, [voiceError])

  const handleTranscript = useCallback(
    (text: string, isFinal: boolean) => {
      if (isFinal) {
        // Commit to store: append final text to the base snapshot
        const joined = baseTextRef.current
          ? `${baseTextRef.current} ${text}`.trimEnd()
          : text
        setAdditionalInfo(joined)
        // New base for any subsequent utterances in the same session
        baseTextRef.current = joined
        setInterimPreview('')
      } else {
        // Just update the preview — don't touch the store
        setInterimPreview(text)
      }
    },
    [setAdditionalInfo],
  )

  const { isListening, isSupported, error: srError, toggleListening } =
    useSpeechRecognition({ onTranscript: handleTranscript })

  // When recognition reports an error, surface it as a dismissible banner
  useEffect(() => {
    if (srError) setVoiceError(srError)
  }, [srError])

  // Snapshot the current textarea content when the user starts listening
  const handleMicClick = useCallback(() => {
    if (!isListening) {
      // Capture current text so we can append to it
      baseTextRef.current = additionalInfo
      setInterimPreview('')
    } else {
      // Stopping — clear the interim preview
      setInterimPreview('')
    }
    toggleListening()
  }, [isListening, additionalInfo, toggleListening])

  // What the textarea actually shows:
  //   • listening + interim → base + preview
  //   • otherwise           → committed store value
  const displayedText =
    isListening && interimPreview
      ? baseTextRef.current
        ? `${baseTextRef.current} ${interimPreview}`
        : interimPreview
      : additionalInfo

  const totalQuestions = questionRows.reduce((sum, row) => sum + row.numQuestions, 0)
  const totalMarks = questionRows.reduce((sum, row) => sum + row.numQuestions * row.marks, 0)

  return (
    <form className="space-y-8">
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Upload Material</h2>
        <UploadBox onFileSelect={setUploadedFile} />
        {uploadedFile && (
          <p className="mt-2 text-sm text-muted-foreground">File: {uploadedFile.name}</p>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold text-foreground">Assignment Details</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Optional when using voice/prompt — auto-filled if left blank
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Assignment Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Molecular Chemistry Quiz"
              className="w-full rounded-lg border border-border bg-card px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Chemistry"
              className="w-full rounded-lg border border-border bg-card px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Difficulty Level</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full rounded-lg border border-border bg-card px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-bold text-neutral-800 dark:text-neutral-200">Question Type</h2>
        <div className="space-y-3">
          {/* Desktop Column Headers */}
          <div className="hidden grid-cols-[1fr_40px_130px_130px] gap-4 px-4 pb-1 text-xs font-bold text-neutral-400 dark:text-neutral-500 md:grid">
            <div>Question Type</div>
            <div />
            <div className="pl-4">No. of Questions</div>
            <div className="pl-4">Marks per Q</div>
          </div>

          {questionRows.map((row) => (
            <QuestionTypeRow
              key={row.id}
              questionType={row.type}
              numQuestions={row.numQuestions}
              marks={row.marks}
              onQuestionTypeChange={(value) => updateQuestionRow(row.id, 'type', value)}
              onNumQuestionsChange={(value) =>
                updateQuestionRow(row.id, 'numQuestions', value)
              }
              onMarksChange={(value) => updateQuestionRow(row.id, 'marks', value)}
              onRemove={() => removeQuestionRow(row.id)}
            />
          ))}

          <div className="pt-2">
            <button
              type="button"
              onClick={addQuestionRow}
              className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all duration-200 hover:scale-[1.02] hover:bg-neutral-850 active:scale-[0.98] dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
              aria-label="Add question type"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              <span>Add Question Type</span>
            </button>
          </div>
        </div>
      </section>

      <div className="flex flex-col items-end gap-1 px-4 py-2 text-[11px] font-bold text-neutral-450 dark:text-neutral-400">
        <div>
          <span>Total Questions : </span>
          <span className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200">{totalQuestions}</span>
        </div>
        <div>
          <span>Total Marks : </span>
          <span className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200">{totalMarks}</span>
        </div>
      </div>

      <section>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Additional Information
          <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
            Voice / AI Prompt
          </span>
        </label>
        <p className="mb-4 text-sm text-muted-foreground">
          Speak or type your requirements here. You can generate a full paper from this alone.
        </p>

        {/* Voice error banner */}
        {voiceError && (
          <div
            role="alert"
            className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400"
          >
            <MicOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{voiceError}</span>
          </div>
        )}

        <div className="relative">
          <textarea
            value={displayedText}
            onChange={(e) => {
              // While NOT listening, honour manual edits normally
              if (!isListening) {
                setAdditionalInfo(e.target.value)
              }
              // While listening, manual edits update the base snapshot
              // so the next final result appends correctly
              else {
                baseTextRef.current = e.target.value
                setAdditionalInfo(e.target.value)
              }
            }}
            placeholder={
              isListening
                ? 'Listening\u2026'
                : 'e.g. Generate a question paper for a 2-hour exam duration...'
            }
            className={[
              'w-full resize-none rounded-lg border bg-card px-4 py-3 pr-14 text-foreground',
              'placeholder:text-muted-foreground focus:outline-none focus:ring-2',
              isListening
                ? 'border-red-400 focus:ring-red-400 dark:border-red-600'
                : 'border-border focus:ring-primary',
              interimPreview ? 'text-slate-400 dark:text-neutral-500' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            rows={4}
          />

          {/* Mic button */}
          <button
            type="button"
            id="voice-input-btn"
            onClick={handleMicClick}
            disabled={!isSupported}
            title={
              !isSupported
                ? 'Speech recognition not supported in this browser'
                : isListening
                ? 'Stop listening'
                : 'Start voice input'
            }
            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
            aria-pressed={isListening}
            className={[
              'absolute bottom-3 right-3 rounded-lg p-2 transition-all duration-200',
              !isSupported && 'cursor-not-allowed opacity-40',
              isListening
                ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60'
                : 'hover:bg-secondary text-muted-foreground hover:text-foreground',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {/* Pulsing glow ring when listening */}
            {isListening && (
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-lg animate-ping bg-red-400/30 dark:bg-red-600/30"
              />
            )}
            <Mic
              className={[
                'relative h-5 w-5 transition-transform duration-200',
                isListening ? 'scale-110' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />
          </button>
        </div>

        {/* Listening status label */}
        {isListening && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            Listening\u2026 click the mic to stop
          </p>
        )}
      </section>
    </form>
  )
}
