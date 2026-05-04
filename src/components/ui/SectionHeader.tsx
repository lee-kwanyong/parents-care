import type { ReactNode } from 'react'

type SectionHeaderProps = {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}

export function SectionHeader({ eyebrow, title, description, actions }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="text-sm font-black text-emerald-700">{eyebrow}</p> : null}
        <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 md:text-xl md:leading-9">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  )
}
