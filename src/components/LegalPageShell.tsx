import Link from 'next/link'
import type { ReactNode } from 'react'
import { effectiveDate, serviceName, supportEmail } from '@/lib/anbu-legal-content'

export function LegalPageShell({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8 text-[#173B36]">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            {eyebrow}
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            {title}
          </h1>

          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
            {description}
          </p>

          <div className="mt-5 rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D8EEE8]">
            시행일: {effectiveDate} · 서비스명: {serviceName} · 문의: {supportEmail}
          </div>
        </div>

        <div className="mt-5 space-y-5">
          {children}
        </div>

        <section className="mt-5 rounded-[2rem] bg-[#123F38] p-5 text-white sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">문의와 요청</h2>
          <p className="mt-3 text-sm font-bold leading-7 text-[#CDEEE6]">
            개인정보, 데이터 삭제, 결제, 안부 기록, 위치 정보, 케어파트너 정보와 관련한 문의는 고객지원 페이지에서 접수할 수 있습니다.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/contact" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#123F38]">
              문의하기
            </Link>
            <Link href="/data-deletion" className="rounded-2xl bg-[#20C5A8] px-5 py-4 text-sm font-black text-white">
              데이터 삭제 요청
            </Link>
          </div>
        </section>
      </section>
    </main>
  )
}

export function LegalCard({
  title,
  children
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
      <h2 className="text-2xl font-black tracking-[-0.05em]">{title}</h2>
      <div className="mt-4 text-sm font-bold leading-7 text-[#637B76]">
        {children}
      </div>
    </section>
  )
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold leading-7 text-[#5F7772] ring-1 ring-[#D8EEE8]">
          {item}
        </li>
      ))}
    </ul>
  )
}
