import { Suspense } from 'react'
import { AssignmentOutputView } from '@/features/assignments/views'

export default function AssignmentOutputPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-4xl p-4 md:p-8 space-y-6">
        <div className="h-9 w-32 bg-slate-100 dark:bg-neutral-800 rounded animate-pulse" />
        <div className="space-y-6 rounded-[2rem] border border-neutral-100 bg-white p-8 shadow-sm dark:border-neutral-850 dark:bg-neutral-900">
          <div className="h-8 w-64 bg-slate-100 dark:bg-neutral-800 rounded mx-auto animate-pulse" />
          <div className="h-24 w-full bg-slate-100 dark:bg-neutral-800 rounded animate-pulse" />
        </div>
      </div>
    }>
      <AssignmentOutputView />
    </Suspense>
  )
}
