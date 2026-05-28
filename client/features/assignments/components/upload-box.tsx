'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'

export interface UploadBoxProps {
  onFileSelect?: (file: File) => void
}

export function UploadBox({ onFileSelect }: UploadBoxProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const files = e.dataTransfer.files
    if (files?.[0]) {
      setFileName(files[0].name)
      onFileSelect?.(files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files?.[0]) {
      setFileName(files[0].name)
      onFileSelect?.(files[0])
    }
  }

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
        isDragActive
          ? 'border-brand-orange bg-brand-orange/5'
          : 'border-neutral-200 bg-white hover:border-brand-orange/60 dark:border-neutral-800 dark:bg-neutral-900/50'
      }`}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-50 border border-neutral-100 text-neutral-450 dark:bg-neutral-850 dark:border-neutral-800">
          <Upload className="h-5 w-5" />
        </div>
        <div>
          <p className="font-bold text-neutral-800 dark:text-neutral-200">
            {fileName ? `Selected: ${fileName}` : 'Choose a file or drag & drop it here'}
          </p>
          <p className="mt-1.5 text-xs font-medium text-neutral-450 dark:text-neutral-455">
            JPEG, PNG, upto 10MB
          </p>
        </div>
        <label className="mt-2">
          <input
            type="file"
            onChange={handleChange}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
          />
          <span className="inline-flex cursor-pointer rounded-full bg-neutral-900 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-neutral-850 active:scale-[0.98] dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200">
            Browse Files
          </span>
        </label>
      </div>
    </div>
  )
}
