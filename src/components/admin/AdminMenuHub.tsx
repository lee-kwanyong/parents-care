'use client'

import Link from 'next/link'
import * as adminRegistry from '@/lib/adminMenuRegistry'

type LooseMenuLink = {
  href?: string
  title?: string
  label?: string
  description?: string
  desc?: string
  category?: string
  badge?: string
  roles?: string[]
  opsOnly?: boolean
  priority?: number
}

type AdminMenuHubProps = {
  /**
   * 기존 관리자 메뉴 페이지들이 넘기던 legacy props를 허용합니다.
   * 새 압축형 메뉴에서는 대부분 사용하지 않지만, 타입 호환을 위해 남깁니다.
   */
  [key: string]: unknown
  showAdminOnly?: boolean
  showOpsOnly?: boolean
  showDeveloperOnly?: boolean
  showCustomerOnly?: boolean
  debugMode?: boolean
  compact?: boolean
  role?: string
  title?: string
  subtitle?: string
  embedded?: boolean
  defaultOpenAdvanced?: boolean
}

const fallbackLinks: LooseMenuLink[] = [
  {
    href: '/admin/ops',
    title: '관리자 대시보드',
    description: '오늘 확인필요, 주의, 가입자, 스마트링 상태를 요약합니다.',
    badge: '홈',
    category: '핵심'
  },
  {
    href: '/admin/ops/families',
    title: '가입자 통합관리',
    description: '가입자, 가족, 보호자, 부모님, 스마트링을 한 화면에서 관리합니다.',
    badge: '필수',
    category: '핵심'
  },
  {
    href: '/admin/ops/gov-rnd',
    title: '지자체·R&D',
    description: '지자체, R&D, 스마트링 공급사 파이프라인을 관리합니다.',
    badge: '영업',
    category: '핵심'
  },
  {
    href: '/admin/ops/proposal-reality-check',
    title: '제안 표현 점검',
    description: '의료·119·오탐률 표현을 비의료 안부 참고 문장으로 점검합니다.',
    badge: '점검',
    category: '핵심'
  },
  {
    href: '/admin/ops/ring-pilot-dashboard',
    title: '스마트링 실증 대시보드',
    description: '모델, 샘플, 착용률, 데이터 품질을 관리합니다.',
    badge: '고급',
    category: '스마트링'
  },
  {
    href: '/admin/ops/ring-csv-import',
    title: '스마트링 CSV 업로드',
    description: '스마트링 데이터를 업로드합니다.',
    badge: '고급',
    category: '스마트링'
  },
  {
    href: '/admin/ops/ring-report-lab',
    title: '리포트 실험실',
    description: '안부완료 리포트 산식을 테스트합니다.',
    badge: '고급',
    category: '스마트링'
  }
]

function registryLinks() {
  const registry = adminRegistry as Record<string, unknown>
  const candidates = [
    registry.allMenuLinks,
    registry.adminMenuLinks,
    registry.developerMenuLinks,
    registry.menuLinks,
    registry.customerMenuLinks
  ]

  const merged: LooseMenuLink[] = []

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      merged.push(...candidate as LooseMenuLink[])
    }
  }

  const links = merged.length ? merged : fallbackLinks
  const seen = new Set<string>()

  return [...fallbackLinks, ...links]
    .filter((item) => item.href && item.title)
    .filter((item) => {
      const href = item.href || ''
      if (seen.has(href)) return false
      seen.add(href)
      return true
    })
}

function isCore(item: LooseMenuLink) {
  const href = item.href || ''

  return [
    '/admin/ops',
    '/ops',
    '/admin/ops/families',
    '/ops/families',
    '/admin/ops/users',
    '/admin/ops/subscribers',
    '/admin/ops/gov-rnd',
    '/admin/ops/proposal-reality-check'
  ].includes(href)
}

function compactTitle(item: LooseMenuLink) {
  return item.title || item.label || '메뉴'
}

function compactDesc(item: LooseMenuLink) {
  return item.description || item.desc || '관리자 기능'
}

function MenuCard({ item, core = false }: { item: LooseMenuLink; core?: boolean }) {
  return (
    <Link
      href={item.href || '#'}
      className={
        core
          ? 'rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(49,151,136,0.08)]'
          : 'rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]'
      }
    >
      <span className={
        core
          ? 'rounded-full bg-[#EFFFFA] px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#CDEFE7]'
          : 'rounded-full bg-white px-3 py-1 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]'
      }>
        {item.badge || item.category || (core ? '핵심' : '고급')}
      </span>

      <h3 className={core ? 'mt-4 text-2xl font-black tracking-[-0.06em]' : 'mt-3 text-lg font-black tracking-[-0.04em]'}>
        {compactTitle(item)}
      </h3>

      <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
        {compactDesc(item)}
      </p>
    </Link>
  )
}

export function AdminMenuHub({
  title = '관리자 메뉴',
  subtitle = '핵심 관리 화면만 먼저 보여주고, 나머지는 고급 메뉴로 접습니다.',
  embedded = false,
  defaultOpenAdvanced = false
}: AdminMenuHubProps) {
  const links = registryLinks()
  const core = links.filter(isCore).slice(0, 8)
  const advanced = links.filter((item) => !isCore(item))

  const content = (
    <section className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-[2.5rem] bg-white/95 p-6 shadow-[0_24px_80px_rgba(49,151,136,0.10)] ring-1 ring-[#D6EDE7] sm:p-9">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
            Admin
          </span>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            압축 메뉴
          </span>
        </div>

        <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.08em] sm:text-6xl">
          {title}
        </h1>

        <p className="mt-5 max-w-3xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
          {subtitle}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {core.map((item) => (
          <MenuCard key={item.href} item={item} core />
        ))}
      </section>

      <details
        open={defaultOpenAdvanced}
        className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7]"
      >
        <summary className="cursor-pointer text-lg font-black tracking-[-0.04em]">
          고급 메뉴 보기
        </summary>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {advanced.map((item) => (
            <MenuCard key={item.href} item={item} />
          ))}
        </div>
      </details>
    </section>
  )

  if (embedded) return content

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#E7FFF7_0%,#F7FFFC_34%,#FFFFFF_72%)] px-4 py-8 text-[#17443F]">
      {content}
    </main>
  )
}

export default AdminMenuHub
