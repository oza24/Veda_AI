import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  icon: LucideIcon
  label: string
  href: string
}

export interface NavSubItem {
  label: string
  href: string
}
