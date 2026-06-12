import Link from 'next/link'
import {
  getMenuLinksForRole,
  roleMeta,
  type MenuLink,
  type PortalRole
} from '@/lib/adminMenuRegistry'

type RolePortalMenuProps = {
  role: PortalRole
  title?: string
  subtitle?: string
  embedded?: boolean
  hideHeader?: boolean
  [key: string]: unknown
}

function normalizeRole(role: PortalRole): PortalRole {
  if (role === 'careWorker') return 'care-worker'
  return role
}

export function RolePortalMenu({
  role,
  title,
  subtitle,
  embedded = false,
  hideHeader = false
}: RolePortalMenuProps) {
  const normalizedRole = normalizeRole(role)
  const meta = roleMeta[normalizedRole] || roleMeta.all
  const links = getMenuLinksForRole(normalizedRole, false)

  const content = (
    <section className="mx-auto max-w-5xl space-y-5">
      {!hideHeader ? (
        <section className="rounded-[2rem] bg-white/95 p-6 shadow-sm ring-1 ring-[#D6EDE7]">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            {meta.shortTitle}
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-[-0.07em]">
            {title || meta.title}
          </h1>

          <p className="mt-4 text-sm font-bold leading-7 text-[#637B76]">
            {subtitle || meta.description}
          </p>
        </section>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2">
        {links.map((link: MenuLink) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-2xl bg-white/95 p-5 ring-1 ring-[#D6EDE7]"
          >
            <div className="inline-flex rounded-full bg-[#FAFFFD] px-3 py-1 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              {link.badge || link.category}
            </div>

            <h2 className="mt-3 text-xl font-black tracking-[-0.05em]">
              {link.title}
            </h2>

            <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
              {link.description}
            </p>
          </Link>
        ))}
      </section>
    </section>
  )

  if (embedded) return content

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-8 text-[#17443F]">
      {content}
    </main>
  )
}

export default RolePortalMenu
