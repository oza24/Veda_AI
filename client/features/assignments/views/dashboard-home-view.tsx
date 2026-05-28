'use client'

import { useRouter } from 'next/navigation'

import { EmptyState } from '@/shared/components/empty-state'
import { ROUTES } from '@/shared/constants/navigation'

export function DashboardHomeView() {
  const router = useRouter()

  return (
    <div className="p-4 md:p-8">
      <EmptyState
        heading="No assignments yet"
        description="Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define learning criteria, and let AI assist in grading."
        ctaText="Create Your First Assignment"
        ctaAction={() => router.push(ROUTES.createAssignment)}
      />
    </div>
  )
}
