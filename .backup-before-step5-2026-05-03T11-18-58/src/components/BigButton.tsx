import Link from 'next/link'
import type { ReactNode } from 'react'
export function BigButton({ href, children, tone = 'primary' }: { href: string; children: ReactNode; tone?: 'primary' | 'secondary' | 'danger' }) { const toneClass = tone === 'danger' ? 'bg-rose-600 text-white' : tone === 'secondary' ? 'bg-white text-slate-900 border border-slate-200' : 'bg-care-500 text-white'; return <Link href={href} className={`${toneClass} block rounded-3xl px-6 py-5 text-center text-xl font-black shadow-soft big-touch`}>{children}</Link> }
