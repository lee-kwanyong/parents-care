import Link from 'next/link'
import { linksForRole, roleMeta, type MenuLink, type PortalRole } from '@/lib/adminMenuRegistry'

type RolePortalMenuProps = {
  role: Exclude<PortalRole, 'all'>
  title?: string
  subtitle?: string
}

const roleBadge: Record<Exclude<PortalRole, 'all'>, string> = {
  parent: '부모님',
  child: '자녀·보호자',
  careWorker: '요양보호사·케어파트너',
  ops: '운영실'
}

function cleanHref(href: string) {
  const base = href.split('?', 1)[0] || '/'
  if (base !== '/' && base.endsWith('/')) return base.slice(0, -1)
  return base
}

function hideFromRolePortal(link: MenuLink, role: Exclude<PortalRole, 'all'>) {
  const href = cleanHref(link.href)

  if (href === '/menu') return true
  if (href === '/admin-menu' && role !== 'ops') return true

  if (role !== 'ops') {
    if (link.opsOnly) return true
    if (link.href.includes('scope=ops')) return true
    if (href.startsWith('/ops')) return true
    if (href.startsWith('/gov')) return true
  }

  return false
}

function groupLinks(links: MenuLink[]) {
  return links.reduce<Record<string, MenuLink[]>>((acc, link) => {
    const category = link.category || '기타'
    acc[category] = acc[category] || []
    acc[category].push(link)
    return acc
  }, {})
}

function categoryOrder(category: string) {
  if (category.includes('운영실 필수')) return 1
  if (category.includes('운영실 추가')) return 2
  if (category.includes('정부') || category.includes('지자체')) return 3
  if (category.includes('공통')) return 4
  return 9
}

function sortedGroups(groups: Record<string, MenuLink[]>) {
  return Object.entries(groups).sort(([a], [b]) => {
    const orderA = categoryOrder(a)
    const orderB = categoryOrder(b)

    if (orderA !== orderB) return orderA - orderB
    return a.localeCompare(b)
  })
}

function compactTitle(title: string) {
  return title
    .replace('운영실 ', '')
    .replace('지자체 ', '')
    .replace('개인정보 동의·열람 감사센터', '개인정보 감사')
    .replace('운영실 자동운영 Heartbeat', 'Heartbeat')
    .replace('알림 기록 정리센터', '알림 정리')
    .replace('운영실 후속조치 관제', '후속조치 관제')
    .replace('운영실 오토파일럿', '오토파일럿')
}

function OpsHorizontalMenu({
  links,
  title,
  subtitle
}: {
  links: MenuLink[]
  title: string
  subtitle: string
}) {
  const groups = groupLinks(links)

  const priorityLinks = links.filter((link) => {
    const href = cleanHref(link.href)

    return [
      '/ops',
      '/ops/autopilot',
      '/ops/heartbeat',
      '/ops/incidents',
      '/ops/notification-dispatch',
      '/ops/network',
      '/ops/households',
      '/gov/reports',
      '/gov/submission-package',
      '/ops/privacy-audit',
      '/ops/demo-runner',
      '/ops/proposal-leads'
    ].includes(href)
  })

  const railLinks = priorityLinks.length > 0 ? priorityLinks : links.slice(0, 16)

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            운영실 전용 메뉴
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] text-[#17443F] sm:text-5xl">
            {title}
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76]">
            {subtitle}
          </p>

          <div className="mt-5 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
            운영실 핵심 기능을 세로 목록이 아니라 가로 한 줄 메뉴로 정리했습니다. 오른쪽으로 넘기면서 필요한 화면으로 바로 이동할 수 있습니다.
          </div>
        </section>

        <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.06em]">운영실 핵심 메뉴</h2>
              <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                오토파일럿, 관제, 알림, 보고서, 제출 기능을 한 줄로 배치했습니다.
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href="/admin-menu"
                className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
              >
                전체 메뉴
              </Link>
              <Link
                href="/"
                className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
              >
                홈
              </Link>
            </div>
          </div>

          <div className="anbu-horizontal-scroll mt-5 flex gap-3 overflow-x-auto pb-3">
            {railLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group inline-flex min-w-max shrink-0 items-center gap-3 rounded-full bg-[#FAFFFD] px-4 py-3 text-sm font-black text-[#17443F] shadow-sm ring-1 ring-[#D6EDE7] transition hover:-translate-y-0.5 hover:bg-[#EFFFFA] hover:shadow-lg"
              >
                {link.badge ? (
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#2AA897] ring-1 ring-[#D6EDE7]">
                    {link.badge}
                  </span>
                ) : null}
                <span className="whitespace-nowrap">{compactTitle(link.title)}</span>
                <span className="text-[#247A71]">→</span>
              </Link>
            ))}
          </div>
        </section>

        {sortedGroups(groups).map(([category, items]) => (
          <section
            key={category}
            className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black tracking-[-0.05em]">{category}</h2>
                <p className="mt-1 text-sm font-bold text-[#637B76]">{items.length}개 메뉴</p>
              </div>
            </div>

            <div className="anbu-horizontal-scroll mt-5 flex gap-3 overflow-x-auto pb-3">
              {items.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex min-w-[17rem] max-w-[20rem] shrink-0 items-center gap-3 rounded-2xl bg-[#FAFFFD] px-4 py-4 text-[#17443F] shadow-sm ring-1 ring-[#D6EDE7] transition hover:-translate-y-0.5 hover:bg-[#EFFFFA] hover:shadow-lg"
                >
                  {link.badge ? (
                    <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-[#2AA897] ring-1 ring-[#D6EDE7]">
                      {link.badge}
                    </span>
                  ) : null}

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-black tracking-[-0.03em]">
                      {compactTitle(link.title)}
                    </span>
                    <span className="mt-1 block truncate text-xs font-bold text-[#637B76]">
                      {link.description}
                    </span>
                  </span>

                  <span className="shrink-0 text-sm font-black text-[#247A71]">이동 →</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </section>
    </main>
  )
}

function DefaultRoleMenu({
  role,
  links,
  title,
  subtitle
}: {
  role: Exclude<PortalRole, 'all'>
  links: MenuLink[]
  title: string
  subtitle: string
}) {
  const groups = groupLinks(links)

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-5xl space-y-5">
        <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            {roleBadge[role]} 전용 메뉴
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] text-[#17443F] sm:text-5xl">
            {title}
          </h1>

          <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-[#637B76]">
            {subtitle}
          </p>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            이 화면에는 해당 역할에 필요한 메뉴만 표시됩니다. 운영실·지자체·관리자 전용 메뉴는 운영자 화면에서만 확인할 수 있습니다.
          </div>
        </section>

        <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.06em]">필요한 메뉴</h2>
              <p className="mt-2 text-sm font-bold text-[#637B76]">
                {links.length}개의 메뉴가 표시됩니다.
              </p>
            </div>

            <Link
              href="/"
              className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
            >
              홈
            </Link>
          </div>

          <div className="mt-6 space-y-5">
            {Object.entries(groups).length === 0 ? (
              <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-black text-[#637B76] ring-1 ring-[#D6EDE7]">
                표시할 메뉴가 없습니다.
              </div>
            ) : (
              Object.entries(groups).map(([category, items]) => (
                <section key={category} className="overflow-hidden rounded-3xl bg-[#FAFFFD] ring-1 ring-[#D6EDE7]">
                  <div className="flex items-center justify-between gap-3 border-b border-[#D6EDE7] px-5 py-4">
                    <div>
                      <h3 className="text-lg font-black tracking-[-0.04em]">{category}</h3>
                      <p className="mt-1 text-xs font-bold text-[#637B76]">{items.length}개 메뉴</p>
                    </div>
                  </div>

                  <div className="divide-y divide-[#D6EDE7]">
                    {items.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="grid gap-2 px-5 py-4 transition hover:bg-[#EFFFFA] sm:grid-cols-[11rem_1fr_auto] sm:items-center"
                      >
                        <div className="flex items-center gap-2">
                          {link.badge ? (
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#2AA897] ring-1 ring-[#D6EDE7]">
                              {link.badge}
                            </span>
                          ) : null}
                          <span className="text-base font-black text-[#17443F]">{link.title}</span>
                        </div>

                        <p className="text-sm font-bold leading-6 text-[#637B76]">{link.description}</p>

                        <span className="text-sm font-black text-[#247A71]">이동 →</span>
                      </Link>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  )
}

export function RolePortalMenu({ role, title, subtitle }: RolePortalMenuProps) {
  const meta = roleMeta[role]
  const links = linksForRole(role, false).filter((link) => !hideFromRolePortal(link, role))
  const resolvedTitle = title || meta.title
  const resolvedSubtitle = subtitle || meta.description

  if (role === 'ops') {
    return (
      <OpsHorizontalMenu
        links={links}
        title={resolvedTitle}
        subtitle={resolvedSubtitle}
      />
    )
  }

  return (
    <DefaultRoleMenu
      role={role}
      links={links}
      title={resolvedTitle}
      subtitle={resolvedSubtitle}
    />
  )
}

export default RolePortalMenu
