import Link from 'next/link'

export function BigButton({ href, children, tone = 'primary' }: { href: string; children: React.ReactNode; tone?: 'primary' | 'danger' | 'plain' }) {
  const classes = {
    primary: 'bg-blue-600 text-white',
    danger: 'bg-red-600 text-white',
    plain: 'bg-white text-slate-950 border border-slate-200'
  }
  return (
    <Link href={href} className={`block rounded-3xl px-6 py-5 text-center text-2xl font-black shadow-sm ${classes[tone]}`}>
      {children}
    </Link>
  )
}
