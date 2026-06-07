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

export function RolePortalMenu({ role, title, subtitle }: RolePortalMenuProps) {
  const meta = roleMeta[role]
  const links = linksForRole(role, false).filter((link) => !hideFromRolePortal(link, role))
  const groups = groupLinks(links)

  return (
    <main className="anbu-role-portal min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-5xl space-y-5">
        <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            {roleBadge[role]} 전용 메뉴
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] text-[#17443F] sm:text-5xl">
            {title || meta.title}
          </h1>

          <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-[#637B76]">
            {subtitle || meta.description}
          </p>

          {role !== 'ops' ? (
            <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
              이 화면에는 해당 역할에 필요한 메뉴만 표시됩니다. 운영실·지자체·관리자 전용 메뉴는 운영자 화면에서만 확인할 수 있습니다.
            </div>
          ) : (
            <div className="mt-5 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
              운영자 화면입니다. 운영실, 지자체, 보고서, 제출 패키지, 개인정보 감사 메뉴를 확인할 수 있습니다.
            </div>
          )}
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
                        className="anbu-role-menu-row grid gap-2 px-5 py-4 transition hover:bg-[#EFFFFA] sm:grid-cols-[14rem_1fr_auto] sm:items-center"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          {link.badge ? (
                            <span className="anbu-role-menu-badge whitespace-nowrap break-keep rounded-full bg-white px-3 py-1 text-xs font-black text-[#2AA897] ring-1 ring-[#D6EDE7]">
                              {link.badge}
                            </span>
                          ) : null}
                          <span className="anbu-role-menu-title text-base font-black text-[#17443F]">{link.title}</span>
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

export default RolePortalMenu
