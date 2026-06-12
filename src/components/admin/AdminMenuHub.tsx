import Link from 'next/link'
import {
  getAdminMenuLinks,
  getMenuLinksForRole,
  roleMeta,
  type MenuLink,
  type PortalRole
} from '@/lib/adminMenuRegistry'

export type AdminMenuHubProps = {
  role?: PortalRole
  title?: string
  subtitle?: string
  debugMode?: boolean
  showAdminOnly?: boolean
  embedded?: boolean
  compact?: boolean
  hideHeader?: boolean
  className?: string
  [key: string]: unknown
}

function normalizeRole(role?: PortalRole): PortalRole {
  if (role === 'careWorker') return 'care-worker'
  return role || 'all'
}

function groupByCategory(links: MenuLink[]) {
  return links.reduce<Record<string, MenuLink[]>>((acc, link) => {
    if (!acc[link.category]) acc[link.category] = []
    acc[link.category].push(link)
    return acc
  }, {})
}

const categoryOrder = [
  '운영',
  '스마트링·R&D',
  '지자체·R&D',
  '문자·알림',
  '시스템',
  '공통',
  '부모님',
  '보호자',
  '가이드'
]

export function AdminMenuHub({
  role = 'all',
  title,
  subtitle,
  debugMode = false,
  showAdminOnly = false,
  embedded = false,
  hideHeader = false,
  className = ''
}: AdminMenuHubProps) {
  const normalizedRole = normalizeRole(role)
  const meta = roleMeta[normalizedRole] || roleMeta.all

  const visibleLinks =
    showAdminOnly || normalizedRole === 'admin' || normalizedRole === 'ops'
      ? getAdminMenuLinks()
      : getMenuLinksForRole(normalizedRole, debugMode)

  const grouped = groupByCategory(visibleLinks)
  const categories = [
    ...categoryOrder.filter((item) => grouped[item]?.length),
    ...Object.keys(grouped).filter((item) => !categoryOrder.includes(item))
  ]

  const pageTitle =
    title ||
    (showAdminOnly || normalizedRole === 'admin' || normalizedRole === 'ops'
      ? 'Admin 통합 메뉴'
      : meta.title)

  const pageSubtitle =
    subtitle ||
    (showAdminOnly || normalizedRole === 'admin' || normalizedRole === 'ops'
      ? '운영실, 지자체/B2G, R&D, 스마트링, 문자 관련 기능을 한곳에서 관리합니다.'
      : meta.description)

  const content = (
    <section className={`mx-auto max-w-7xl space-y-6 ${className}`}>
      {!hideHeader ? (
        <section className="rounded-[2rem] bg-white/95 p-6 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            {showAdminOnly || normalizedRole === 'admin' || normalizedRole === 'ops'
              ? 'Admin'
              : meta.shortTitle}
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            {pageTitle}
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            {pageSubtitle}
          </p>

          {showAdminOnly || normalizedRole === 'admin' || normalizedRole === 'ops' ? (
            <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
              고객 메뉴에는 운영실, 지자체, B2G, R&D, CSV, 알림 발송센터가 보이면 안 됩니다.
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
            >
              고객 홈
            </Link>

            <Link
              href="/admin"
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
            >
              Admin 로그인
            </Link>

            <Link
              href="/admin/ops"
              className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white"
            >
              Admin 운영실
            </Link>
          </div>
        </section>
      ) : null}

      {categories.map((category) => (
        <section
          key={category}
          className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6"
        >
          <h2 className="text-2xl font-black tracking-[-0.06em]">
            {category}
          </h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {grouped[category]
              .slice()
              .sort((a, b) => (a.priority || 999) - (b.priority || 999))
              .map((link: MenuLink) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl bg-[#FAFFFD] p-5 ring-1 ring-[#D6EDE7] hover:bg-white"
                >
                  <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                    {link.badge || category}
                  </div>

                  <h3 className="mt-3 text-xl font-black tracking-[-0.05em]">
                    {link.title}
                  </h3>

                  <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                    {link.description}
                  </p>

                  <div className="mt-4 text-xs font-black text-[#2AA897]">
                    {link.href}
                  </div>
                </Link>
              ))}
          </div>
        </section>
      ))}
    </section>
  )

  if (embedded) return content

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-8 text-[#17443F]">
      {content}
    </main>
  )
}

export default AdminMenuHub
