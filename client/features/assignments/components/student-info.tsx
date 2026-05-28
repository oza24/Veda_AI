export interface StudentInfoProps {
  isPrint?: boolean
}

export function StudentInfo({ isPrint = false }: StudentInfoProps) {
  return (
    <div className={`space-y-4 ${isPrint ? 'print:space-y-3' : ''}`}>
      <h3
        className={`font-semibold text-foreground ${isPrint ? 'print:text-sm' : 'text-base'}`}
      >
        Student Information
      </h3>

      <div className="space-y-3">
        {['Name', 'Roll Number', 'Class and Section'].map((label) => (
          <div key={label} className="flex items-center gap-4">
            <span className="w-32 text-sm font-medium text-muted-foreground">{label}:</span>
            <div className="min-w-[200px] flex-1 border-b border-foreground/30 pb-1" />
          </div>
        ))}
      </div>
    </div>
  )
}
