import Link from 'next/link'

type QuickNavItem = {
  href: string
  label: string
  emoji: string
}

const defaultItems: QuickNavItem[] = [
  { href: '/child', label: '홈', emoji: '🏠' },
  { href: '/care-intake', label: '맡기기', emoji: '📷' },
  { href: '/child/tasks', label: '할 일', emoji: '✅' },
  { href: '/child/today', label: '안심판', emoji: '🟢' }
]

export function MobileQuickNav({ items = defaultItems }: { items?: QuickNavItem[] }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-3 py-2 shadow-2xl backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {items.slice(0, 4).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl px-2 py-2 text-center text-xs font-black text-slate-700 active:bg-emerald-50"
          >
            <span className="block text-xl leading-none">{item.emoji}</span>
            <span className="mt-1 block">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
