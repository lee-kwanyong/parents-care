import { clsx } from 'clsx'

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={clsx('rounded-3xl border border-slate-200 bg-white p-5 shadow-sm', className)}>{children}</section>
}

export function CardTitle({ eyebrow, title, desc }: { eyebrow?: string; title: string; desc?: string }) {
  return (
    <div className="mb-4">
      {eyebrow ? <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{eyebrow}</p> : null}
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      {desc ? <p className="mt-1 text-sm text-slate-600">{desc}</p> : null}
    </div>
  )
}
