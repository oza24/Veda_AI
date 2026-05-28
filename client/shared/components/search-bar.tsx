'use client'

import { Search } from 'lucide-react'

export interface SearchBarProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
}

export function SearchBar({
  placeholder = 'Search Assignment',
  value = '',
  onChange,
}: SearchBarProps) {
  return (
    <div className="relative flex-1">
      <Search
        size={16}
        className="pointer-events-none absolute left-4.5 top-1/2 -translate-y-1/2 text-neutral-400"
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded-full border border-neutral-100 bg-white py-2.5 pl-11 pr-5 text-sm text-foreground transition-all shadow-xs placeholder:text-neutral-400 focus:border-brand-orange focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/15 dark:border-neutral-800 dark:bg-neutral-900/50 dark:focus:border-brand-orange dark:focus:bg-neutral-900"
      />
    </div>
  )
}
