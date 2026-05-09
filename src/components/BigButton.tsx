import Link from 'next/link'
import type { ReactNode } from 'react'
export function BigButton({ href, children, tone = 'primary' }: { href: string; children: ReactNode; tone?: 'primary' | 'secondary' | 'danger' }) { const toneClass = tone === 'danger' ? 'bg-rose-600 text-[#2E504D]' : tone === 'secondary' ? 'bg-white text-[#2E504D] border border-[#E0EFEC]' : 'bg-care-500 text-[#2E504D]'; return <Link href={href} className={`${toneClass} block rounded-3xl px-6 py-5 text-center text-xl font-black shadow-soft big-touch`}>{children}</Link> }
