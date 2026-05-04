import Link from 'next/link'
import type { ReactNode } from 'react'

type CareButtonProps = {
  href?: string
  children: ReactNode
  className?: string
  tone?: 'primary' | 'dark' | 'soft' | 'danger' | 'amber' | 'white'
  size?: 'md' | 'lg' | 'xl'
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
}

const tones = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
  dark: 'bg-slate-950 text-white hover:bg-slate-800 shadow-sm',
  soft: 'bg-slate-100 text-slate-950 hover:bg-slate-200',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  amber: 'bg-amber-100 text-amber-950 hover:bg-amber-200',
  white: 'bg-white text-slate-950 hover:bg-slate-50 ring-1 ring-slate-200'
}

const sizes = {
  md: 'px-5 py-4 text-base',
  lg: 'px-6 py-5 text-lg',
  xl: 'px-7 py-6 text-xl md:text-2xl'
}

export function CareButton({
  href,
  children,
  className = '',
  tone = 'primary',
  size = 'lg',
  type = 'button',
  disabled,
  onClick
}: CareButtonProps) {
  const base = `inline-flex w-full items-center justify-center rounded-3xl font-black transition disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 md:w-auto ${tones[tone]} ${sizes[size]} ${className}`

  if (href) {
    return (
      <Link href={href} className={base}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={base}>
      {children}
    </button>
  )
}
