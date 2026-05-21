import Link from 'next/link'

type BrandLogoProps = {
  href?: string
  title?: string
  subtitle?: string
  compact?: boolean
}

export function BrandLogo({
  href = '/',
  title = '부모님 안심케어',
  subtitle = '부모님 안심케어를 간단히 시작하는 앱',
  compact = false
}: BrandLogoProps) {
  const boxSize = compact ? 'h-11 w-11' : 'h-14 w-14'
  const imageSize = compact ? 'h-10 w-10' : 'h-12 w-12'

  return (
    <Link href={href} aria-label="부모님 안심케어 홈" className="flex min-w-0 items-center gap-3">
      <span className={`flex ${boxSize} shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#DCF8F1] shadow-[0_8px_22px_rgba(25,185,154,0.16)] ring-1 ring-[#DDEEEA]`}>
        <img
          src="/icons/parents-care-logo.svg"
          alt="부모님 안심케어 로고"
          className={`${imageSize} rounded-2xl object-cover`}
        />
      </span>

      <span className="block min-w-0">
        <span className="block truncate text-lg font-black tracking-[-0.03em] text-[#24423F]">
          {title}
        </span>
        <span className="block truncate text-xs font-bold text-[#6C8883]">
          {subtitle}
        </span>
      </span>
    </Link>
  )
}
