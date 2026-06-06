'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { AnbuPlanId } from '@/lib/anbu-plan-definitions'
import { getAnbuPlanDefinition, hasMinimumPlan } from '@/lib/anbu-plan-definitions'

type BillingStatus = {
  ok: boolean
  connected: boolean
  plan: {
    id: string
    name: string
    displayPrice: string
    level: number
  }
}

export function PlanGate({
  children,
  minimumPlan = 'basic',
  featureTitle = '이 기능',
  description = '이 기능은 상위 플랜에서 사용할 수 있습니다.'
}: {
  children: ReactNode
  minimumPlan?: AnbuPlanId
  featureTitle?: string
  description?: string
}) {
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const required = getAnbuPlanDefinition(minimumPlan)

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/billing/status', { cache: 'no-store' })
        const data = await response.json()
        setStatus(data)
      } catch {
        setStatus(null)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return (
      <div className="rounded-[2rem] bg-white p-6 text-center font-black shadow-sm ring-1 ring-[#D6EDE7]">
        플랜 확인 중...
      </div>
    )
  }

  if (!status?.connected) {
    return (
      <LockedCard
        title="부모님 연결이 필요합니다."
        desc="구독 상태는 부모님 연결코드 기준으로 확인합니다. 먼저 부모님을 연결해주세요."
        href="/family-link"
        cta="부모님 연결하기"
      />
    )
  }

  if (!hasMinimumPlan(status.plan?.id, minimumPlan)) {
    return (
      <LockedCard
        title={`${featureTitle}은 ${required.name} 이상에서 사용할 수 있어요.`}
        desc={description}
        href={`/checkout?plan=${required.id}`}
        cta={`${required.name}으로 전환`}
        subLink="/pricing"
        subCta="요금제 보기"
      />
    )
  }

  return <>{children}</>
}

function LockedCard({
  title,
  desc,
  href,
  cta,
  subLink,
  subCta
}: {
  title: string
  desc: string
  href: string
  cta: string
  subLink?: string
  subCta?: string
}) {
  return (
    <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:p-8">
      <div className="inline-flex rounded-full bg-[#FFF9EE] px-4 py-2 text-sm font-black text-[#795C22]">
        플랜 업그레이드 필요
      </div>

      <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] text-[#17443F] sm:text-5xl">
        {title}
      </h1>

      <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
        {desc}
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={href} className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white">
          {cta}
        </Link>
        {subLink && subCta ? (
          <Link href={subLink} className="rounded-2xl bg-[#F2FAF8] px-5 py-4 text-sm font-black text-[#2AA897] ring-1 ring-[#CDEFE7]">
            {subCta}
          </Link>
        ) : null}
      </div>
    </section>
  )
}
