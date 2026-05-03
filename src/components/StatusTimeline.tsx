import type { TimelineItem } from '@/lib/types'

export function StatusTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li key={item.id} className="grid grid-cols-[28px_1fr] gap-3">
          <div className="flex flex-col items-center">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {index + 1}
            </div>
            {index !== items.length - 1 ? <div className="mt-2 h-full w-px bg-slate-200" /> : null}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <h3 className="font-semibold text-slate-950">{item.title}</h3>
              <span className="text-sm text-slate-500">{item.actualAt ?? item.scheduledAt ?? '시간 미정'}</span>
            </div>
            {item.note ? <p className="mt-2 text-sm text-slate-700">{item.note}</p> : null}
            {item.actor ? <p className="mt-2 text-xs text-slate-500">업데이트: {item.actor}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
