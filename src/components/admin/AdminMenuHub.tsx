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

const categoryOrder = ['운영', '스마트링·R&D', '지자체·R&D', '문자·알림', '시스템', '공통', '부모님', '보호자', '가이드']

function categoryTone(category: string) {
  if (category === '운영') return 'border-[#BDEFE4] bg-[#EFFFFA] text-[#247A71]'
  if (category === '스마트링·R&D') return 'border-[#DED8FF] bg-[#F6F4FF] text-[#4A3A8A]'
  if (category === '지자체·R&D') return 'border-[#F3DEB5] bg-[#FFF9EE] text-[#795C22]'
  if (category === '문자·알림') return 'border-[#F3C8C8] bg-[#FFF4F4] text-[#8A3030]'
  return 'border-[#D6EDE7] bg-white text-[#17443F]'
}

function categoryDesc(category: string) {
  if (category === '운영') return '실증, 가입자, 리포트, 오늘 처리할 운영 항목'
  if (category === '스마트링·R&D') return '스마트링 데이터, CSV 업로드, 안부리듬 리포트'
  if (category === '지자체·R&D') return 'B2G, 공공 제안, R&D, 컴플라이언스'
  if (category === '문자·알림') return '상황별 문자, 발송센터, 알림 대기열'
  if (category === '시스템') return '배포 전 점검과 내부 테스트'
  return '고객용 화면'
}

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

  const isAdminMode = showAdminOnly || normalizedRole === 'admin' || normalizedRole === 'ops'

  const pageTitle =
    title ||
    (isAdminMode
      ? 'Admin 운영실'
      : meta.title)

  const pageSubtitle =
    subtitle ||
    (isAdminMode
      ? '운영실, 지자체/B2G, R&D, 스마트링, 문자·알림 기능을 한곳에서 관리합니다.'
      : meta.description)

  const content = (
    <section className={`mx-auto max-w-7xl space-y-6 ${className}`}>
      {!hideHeader ? (
        <section className="overflow-hidden rounded-[2.5rem] bg-white/95 shadow-[0_24px_80px_rgba(49,151,136,0.10)] ring-1 ring-[#D6EDE7]">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-6 sm:p-9">
              <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897] ring-1 ring-[#CDEFE7]">
                {isAdminMode ? 'Admin Mission Control' : meta.shortTitle}
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.08em] sm:text-6xl">
                {pageTitle}
              </h1>

              <p className="mt-5 max-w-3xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                {pageSubtitle}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
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
                  운영실 홈
                </Link>
              </div>
            </div>

            <div className="bg-[linear-gradient(135deg,#EFFFFA_0%,#F7FFFC_45%,#FFFFFF_100%)] p-6 sm:p-9">
              <div className="grid gap-3">
                {categories.slice(0, 5).map((category) => (
                  <div key={category} className={`rounded-2xl border p-4 ${categoryTone(category)}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-lg font-black">{category}</div>
                        <div className="mt-1 text-xs font-bold opacity-70">{categoryDesc(category)}</div>
                      </div>
                      <div className="text-2xl font-black tracking-[-0.06em]">
                        {grouped[category]?.length || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {categories.map((category) => (
        <section
          key={category}
          className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className={`inline-flex rounded-full border px-4 py-2 text-sm font-black ${categoryTone(category)}`}>
                {category}
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">
                {category} 관리
              </h2>
              <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                {categoryDesc(category)}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {grouped[category]
              .slice()
              .sort((a, b) => (a.priority || 999) - (b.priority || 999))
              .map((link: MenuLink) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group rounded-2xl bg-[#FAFFFD] p-5 ring-1 ring-[#D6EDE7] transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_40px_rgba(49,151,136,0.08)]"
                >
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                      {link.badge || category}
                    </span>
                    {link.opsOnly ? (
                      <span className="rounded-full bg-[#FFF9EE] px-3 py-1 text-xs font-black text-[#795C22] ring-1 ring-[#F3DEB5]">
                        Admin
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-4 text-xl font-black tracking-[-0.05em]">
                    {link.title}
                  </h3>

                  <p className="mt-2 min-h-[3.5rem] text-sm font-bold leading-7 text-[#637B76]">
                    {link.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="truncate text-xs font-black text-[#2AA897]">
                      {link.href}
                    </span>
                    <span className="rounded-full bg-[#EFFFFA] px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#CDEFE7] transition group-hover:bg-[#247A71] group-hover:text-white">
                      열기
                    </span>
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#E7FFF7_0%,#F7FFFC_34%,#FFFFFF_72%)] px-4 py-8 text-[#17443F]">
      {content}
    </main>
  )
}

export default AdminMenuHub
