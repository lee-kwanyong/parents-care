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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E0EFEC] bg-white px-3 py-2 shadow-[0_-12px_35px_rgba(93,139,131,0.15)] md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {items.slice(0, 4).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl px-2 py-2 text-center text-xs font-black text-[#5B7774] active:bg-[#E5F8F4]"
          >
            <span className="block text-xl leading-none">{item.emoji}</span>
            <span className="mt-1 block">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
