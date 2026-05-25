import type { ReactNode } from 'react'

export function AppShell({ children, title, subtitle }: { children: ReactNode; title?: string; subtitle?: string }) {
  return (
    <div className="min-h-screen bg-slate-50 text-[#2F4948]">
      <main className="mx-auto max-w-6xl px-4 py-8">
        {title ? (
          <section className="mb-8 rounded-[2rem] border border-[#E0EFEC] bg-white p-6 shadow-[0_12px_34px_rgba(82,112,108,0.08)]">
            <p className="mb-2 text-sm font-bold text-[#159B84]">
              40대 이상 보호자 맞춤 · 쉬운 케어
            </p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
            {subtitle ? <p className="mt-3 max-w-3xl text-lg leading-8 text-[#4E6D69]">{subtitle}</p> : null}
          </section>
        ) : null}

        {children}
      </main>
    </div>
  )
}
