import Link from 'next/link'
import { adminMenuLinks, type MenuLink } from '@/lib/adminMenuRegistry'

function groupByCategory(links: MenuLink[]) {
  return links.reduce<Record<string, MenuLink[]>>((acc, link) => {
    acc[link.category] = acc[link.category] || []
    acc[link.category].push(link)
    return acc
  }, {})
}

const categoryOrder = ['운영', '안부리포트·R&D', '지자체·R&D', '문자·알림', '시스템']

function toneClass(category: string) {
  if (category === '운영') return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (category === '안부리포트·R&D') return 'bg-[#F6F4FF] text-[#4A3A8A] ring-[#DED8FF]'
  if (category === '지자체·R&D') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (category === '문자·알림') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  return 'bg-white text-[#17443F] ring-[#D6EDE7]'
}

export function AdminOpsHubPanel() {
  const grouped = groupByCategory(adminMenuLinks)
  const categories = [
    ...categoryOrder.filter((item) => grouped[item]?.length),
    ...Object.keys(grouped).filter((item) => !categoryOrder.includes(item))
  ]

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-8 text-[#17443F]">
      <section className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] bg-white/95 p-6 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            Admin 운영실
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            운영·지자체·R&D를
            <br />
            여기서 같이 관리합니다.
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            고객 메뉴에는 고객이 쓰는 기능만 남기고, 운영실·지자체/B2G·R&D·안부리포트·문자·실증 관리는 모두 Admin에서 관리합니다.
          </p>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            고객 화면에는 운영실, 지자체, B2G, R&D, CSV, 실증 운영센터가 보이면 안 됩니다.
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              고객 홈
            </Link>
            <Link href="/guide" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              고객 가이드
            </Link>
            <Link href="/admin/ops/gov-rnd" className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white">
              지자체·R&D 관리
            </Link>
          </div>
        </section>

        {categories.map((category) => (
          <section key={category} className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className={'inline-flex rounded-full px-4 py-2 text-sm font-black ring-1 ' + toneClass(category)}>
                  {category}
                </div>
                <h2 className="mt-4 text-3xl font-black tracking-[-0.06em]">{category} 메뉴</h2>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {grouped[category]
                .slice()
                .sort((a, b) => (a.priority || 999) - (b.priority || 999))
                .map((link) => (
                  <Link key={link.href} href={link.href} className="rounded-2xl bg-[#FAFFFD] p-5 ring-1 ring-[#D6EDE7] hover:bg-white">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                        {link.badge || category}
                      </span>
                    </div>
                    <h3 className="mt-3 text-xl font-black tracking-[-0.05em]">{link.title}</h3>
                    <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{link.description}</p>
                  </Link>
                ))}
            </div>
          </section>
        ))}
      </section>
    </main>
  )
}

export default AdminOpsHubPanel
