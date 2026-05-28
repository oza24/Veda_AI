import Link from 'next/link'

import { Button } from '@/components/ui/button'

export interface CtaButtonProps {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary'
}

const SIZE_CLASSES: Record<NonNullable<CtaButtonProps['size']>, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-2.5 text-xs',
  lg: 'px-8 py-3 text-sm',
}

const VARIANT_CLASSES: Record<NonNullable<CtaButtonProps['variant']>, string> = {
  primary:
    'bg-neutral-900 text-white hover:bg-neutral-850 hover:scale-[1.01] active:scale-[0.99] shadow-md dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200',
  secondary:
    'bg-white text-neutral-700 hover:bg-neutral-50 hover:scale-[1.01] active:scale-[0.99] border border-neutral-200 shadow-xs dark:bg-neutral-900 dark:text-neutral-350 dark:border-neutral-800 dark:hover:bg-neutral-850',
}

export function CtaButton({
  children,
  onClick,
  href,
  className = '',
  size = 'md',
  variant = 'primary',
}: CtaButtonProps) {
  const buttonClass = `rounded-full font-semibold transition-all ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${className}`

  if (href) {
    return (
      <Link href={href}>
        <Button className={buttonClass}>{children}</Button>
      </Link>
    )
  }

  return (
    <Button onClick={onClick} className={buttonClass}>
      {children}
    </Button>
  )
}
