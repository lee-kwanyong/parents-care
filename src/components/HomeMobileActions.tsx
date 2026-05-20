import Link from 'next/link'

export function HomeMobileActions() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E0EFEC] bg-white/95 px-3 py-2 shadow-[0_-12px_35px_rgba(93,139,131,0.15)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        <Link
          href="/login?role=child&next=/care-request"
          className="rounded-2xl bg-[#19B99A] px-3 py-3 text-center text-xs font-black text-white"
        >
          <span className="block text-xl leading-none">🟢</span>
          <span className="mt-1 block">안심케어</span>
        </Link>

        <a
          href="#manager-app"
          className="rounded-2xl bg-[#193B38] px-3 py-3 text-center text-xs font-black text-white"
        >
          <span className="block text-xl leading-none">🧑‍⚕️</span>
          <span className="mt-1 block">매니저</span>
        </a>

        <Link
          href="/app"
          className="rounded-2xl bg-[#F4FAF9] px-3 py-3 text-center text-xs font-black text-[#426C68] ring-1 ring-[#DDEDE9]"
        >
          <span className="block text-xl leading-none">📱</span>
          <span className="mt-1 block">앱선택</span>
        </Link>
      </div>
    </nav>
  )
}
