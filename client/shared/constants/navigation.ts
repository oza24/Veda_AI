import {
  FileText,
  Home,
  Library,
  Lightbulb,
  Users,
} from 'lucide-react'

import type { NavItem, NavSubItem } from '@/shared/types/navigation'

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Users, label: 'My Groups', href: '#' },
  { icon: FileText, label: 'Assignments', href: '/assignments' },
  { icon: Lightbulb, label: 'AI Teacher Toolkit', href: '#' },
  { icon: Library, label: 'My Library', href: '#' },
]

export const ASSIGNMENT_SUB_NAV_ITEMS: NavSubItem[] = [
  { label: 'Pending Reviews', href: '#' },
  { label: 'Submitted', href: '#' },
]

export const BREADCRUMB_BY_PATH: Record<string, string> = {
  '/': 'Dashboard',
  '/assignments': 'Assignments',
  '/assignments/create': 'Create Assignment',
  '/assignments/output': 'Assignment Output',
}

export const ROUTES = {
  home: '/',
  assignments: '/assignments',
  createAssignment: '/assignments/create',
  assignmentOutput: '/assignments/output',
} as const
