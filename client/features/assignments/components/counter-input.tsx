'use client'

import { Minus, Plus } from 'lucide-react'

export interface CounterInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label?: string
  hideLabelOnDesktop?: boolean
}

export function CounterInput({
  value,
  onChange,
  min = 0,
  max = 100,
  label,
  hideLabelOnDesktop = false,
}: CounterInputProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1)
    }
  }

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1)
    }
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          className={`text-xs font-bold text-neutral-500 ${
            hideLabelOnDesktop ? 'md:hidden' : ''
          }`}
        >
          {label}
        </label>
      )}
      <div className="flex items-center justify-between rounded-full border border-neutral-100 bg-neutral-50/50 p-1.5 dark:border-neutral-800 dark:bg-neutral-900/60 w-full">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-150/60 disabled:cursor-not-allowed disabled:opacity-30 dark:text-neutral-400 dark:hover:bg-neutral-800"
          aria-label="Decrease"
        >
          <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
        
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const newValue = parseInt(e.target.value, 10)
            if (!isNaN(newValue) && newValue >= min && newValue <= max) {
              onChange(newValue)
            }
          }}
          className="w-8 border-0 bg-transparent text-center text-xs font-bold text-neutral-800 focus:outline-none focus:ring-0 dark:text-neutral-200"
          min={min}
          max={max}
        />
        
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-150/60 disabled:cursor-not-allowed disabled:opacity-30 dark:text-neutral-400 dark:hover:bg-neutral-800"
          aria-label="Increase"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}
