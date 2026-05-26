'use client'

import Link from 'next/link'

type PWAInstallButtonProps = {
  className?: string
  label?: string
}

export function PWAInstallButton({
  className = '',
  label = '홈추가'
}: PWAInstallButtonProps) {
  return (
    <Link
      href="/install"
      className={
        className ||
        'rounded-full bg-[#F2FAF8] px-2.5 py-2 text-xs font-black text-[#537875] ring-1 ring-[#DDEEEA] transition hover:bg-[#E4F7F2] sm:px-4 sm:text-sm'
      }
    >
      {label}
    </Link>
  )
}
