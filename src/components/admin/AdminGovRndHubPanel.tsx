import Link from 'next/link'

const blocks = [
  {
    title: '지자체/B2G 제안',
    desc: '지자체 제안서, 공공 실증, 조달 전략, 표현 점검을 관리합니다.',
    links: [
      ['/admin/ops/proposal-reality-check', '제안 표현 점검'],
      ['/admin/ops/pilot-report', '실증 리포트'],
      ['/admin/ops/consent-risk-center', '동의·책임범위']
    ]
  },
  {
    title: 'R&D·바이오헬스',
    desc: '스마트링, 바이오헬스 데이터, R&D 실증, 협력기관 대응을 관리합니다.',
    links: [
      ['/admin/ops/ring-report-lab', '안부완료 리포트 실험실'],
      ['/admin/ops/ring-csv-import', '스마트링 CSV 업로드'],
      ['/admin/ops/training-center', '교육·가이드 센터']
    ]
  },
  {
    title: '컴플라이언스',
    desc: '비의료 고지, 개인정보, 응급 표현, 119 표현을 안전하게 정리합니다.',
    links: [
      ['/consent', '고객 동의 화면'],
      ['/admin/ops/consent-risk-center', '동의 리스크 센터'],
      ['/admin/ops/preflight-test', '전체 기능 테스트']
    ]
  }
]

export function AdminGovRndHubPanel() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-8 text-[#17443F]">
      <section className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] bg-white/95 p-6 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:p-8">
          <div className="inline-flex rounded-full bg-[#FFF9EE] px-4 py-2 text-sm font-black text-[#795C22] ring-1 ring-[#F3DEB5]">
            지자체·R&D Admin
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            지자체와 R&D는
            <br />
            고객 메뉴가 아니라 Admin에서 관리합니다.
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            B2G, 조달, R&D, 바이오헬스, 스마트링 실증, 컴플라이언스는 고객에게 노출하지 않고 운영실 내부에서 관리합니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/admin/ops" className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white">
              Admin 운영실
            </Link>
            <Link href="/" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              고객 홈
            </Link>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {blocks.map((block) => (
            <article key={block.title} className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7]">
              <h2 className="text-2xl font-black tracking-[-0.06em]">{block.title}</h2>
              <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">{block.desc}</p>

              <div className="mt-5 space-y-3">
                {block.links.map(([href, label]) => (
                  <Link key={href} href={href} className="block rounded-2xl bg-[#FAFFFD] px-4 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                    {label}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  )
}

export default AdminGovRndHubPanel
