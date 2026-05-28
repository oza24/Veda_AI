import { ActionDropdown } from '@/features/assignments/components/action-dropdown'
import type { Assignment } from '@/features/assignments/types'

export interface AssignmentCardProps extends Assignment {
  onView?: () => void
  onDelete?: () => void
}

export function AssignmentCard({
  title,
  assignedDate,
  dueDate,
  onView,
  onDelete,
}: AssignmentCardProps) {
  return (
    <div className="rounded-3xl border border-neutral-100 bg-white p-5 shadow-xs transition-all duration-300 hover:scale-[1.01] hover:shadow-md hover:shadow-neutral-200/40 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:shadow-none">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-base font-bold tracking-tight text-neutral-800 dark:text-neutral-100 sm:text-lg">
          {title}
        </h3>
        <div className="shrink-0">
          <ActionDropdown onView={onView} onDelete={onDelete} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-y-1.5 border-t border-neutral-100/80 pt-4 text-xs dark:border-neutral-800/80">
        <p className="font-medium text-neutral-500 dark:text-neutral-400">
          <span className="font-bold text-neutral-800 dark:text-neutral-200">Assigned on :</span> {assignedDate}
        </p>
        <p className="font-medium text-neutral-500 dark:text-neutral-400">
          <span className="font-bold text-neutral-800 dark:text-neutral-200">Due :</span> {dueDate}
        </p>
      </div>
    </div>
  )
}
