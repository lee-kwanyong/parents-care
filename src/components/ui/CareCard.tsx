import type { ReactNode } from 'react'

type CareCardProps = {
  children: ReactNode
  className?: string
  tone?: 'white' | 'soft' | 'dark' | 'green' | 'amber' | 'red' | 'blue'
}

const tones = {
  white: 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-100',
  soft: 'bg-slate-50 text-slate-950 ring-1 ring-slate-100',
  dark: 'bg-slate-950 text-white shadow-sm',
  green: 'bg-emerald-50 text-emerald-950 ring-1 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-950 ring-1 ring-amber-100',
  red: 'bg-red-50 text-red-950 ring-1 ring-red-100',
  blue: 'bg-blue-50 text-blue-950 ring-1 ring-blue-100'
}

export function CareCard({ children, className = '', tone = 'white' }: CareCardProps) {
  return (
    <section className={`rounded-[2rem] p-5 md:p-7 ${tones[tone]} ${className}`}>
      {children}
    </section>
  )
}
