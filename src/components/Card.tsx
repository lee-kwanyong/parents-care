import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
export function Card({ children, className }: { children: ReactNode; className?: string }) { return <section className={cn('rounded-3xl border border-[#E0EFEC] bg-white p-5 shadow-soft', className)}>{children}</section> }
export function CardTitle({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) { return <div className="mb-4">{eyebrow ? <p className="mb-1 text-sm font-bold text-care-700">{eyebrow}</p> : null}<h2 className="text-xl font-black tracking-tight">{title}</h2>{description ? <p className="mt-2 leading-7 text-[#63807C]">{description}</p> : null}</div> }
