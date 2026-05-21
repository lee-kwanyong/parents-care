import Link from 'next/link'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'

const mainMenus = [
  {
    href: '/signup/guardian',
    icon: '👨‍👩‍👧',
    title: '보호자 가입',
    desc: '보호자가 가입하고 부모님 4자리 코드를 만듭니다.',
    badge: '시작'
  },
  {
    href: '/parent/login',
    icon: '🔢',
    title: '부모님 4자리 접속',
    desc: '부모님은 회원가입 없이 4자리 코드만 입력합니다.',
    badge: '부모님'
  },
  {
    href: '/care-request',
    icon: '💚',
    title: '안심케어 신청',
    desc: '병원·식사·약·서류 걱정을 운영실에 맡깁니다.',
    badge: '신청'
  },
  {
    href: '/child/matching',
    icon: '🔗',
    title: '매칭 확인',
    desc: '추천 케어파트너와 신뢰카드를 확인합니다.',
    badge: '보호자'
  }
]

const subMenus = [
  {
    href: '/child/reports',
    icon: '📋',
    title: '보호자 리포트',
    desc: '오늘 진행 결과와 다음 할 일을 확인합니다.'
  },
  {
    href: '/signup/manager',
    icon: '🧑‍⚕️',
    title: '케어파트너 지원',
    desc: '케어파트너로 활동을 신청합니다.'
  },
  {
    href: '/manager',
    icon: '📩',
    title: '케어파트너 화면',
    desc: '제안 확인, 수락, 현장 체크를 진행합니다.'
  },
  {
    href: '/care-scope',
    icon: '🧭',
    title: '케어 범위',
    desc: '포함되는 일과 포함되지 않는 일을 확인합니다.'
  },
  {
    href: '/trust',
    icon: '🛡️',
    title: '신뢰 기준',
    desc: '검증, 리포트, 후기 기준을 확인합니다.'
  },
  {
    href: '/install',
    icon: '⬇️',
    title: '홈 화면 추가',
    desc: '모바일에서 앱처럼 바로 실행합니다.'
  }
]

const adminMenus = [
  {
    href: '/admin',
    icon: '🔐',
    title: '운영실 Admin',
    desc: '관리자 코드로 운영실에 접속합니다.'
  },
  {
    href: '/ops',
    icon: '🧭',
    title: '운영실 대시보드',
    desc: '접수, 매칭, 리포트, 알림센터를 관리합니다.'
  }
]

export default function AppSelectPage() {
  return (
    <AppFrame
      title="메뉴"
      subtitle="부모님 안심케어에서 필요한 화면을 선택하세요"
    >
      <section className="mx-auto max-w-6xl space-y-6 pb-20 md:pb-0">
        <CareCard tone="green" className="p-5 md:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill text="메뉴" tone="green" />
            <StatusPill text="보호자·부모님·케어파트너" tone="slate" />
          </div>

          <h1 className="mt-4 text-4xl font-black leading-tight tracking-[-0.05em] md:text-6xl">
            필요한 화면으로
            <br />
            바로 이동하세요.
          </h1>

          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#4E6D69] md:text-lg">
            보호자는 가입 후 부모님을 초대하고, 부모님은 4자리 코드만 입력합니다.
            케어파트너와 운영실은 각각 별도 화면에서 진행합니다.
          </p>
        </CareCard>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-2xl font-black text-[#24423F]">자주 쓰는 메뉴</h2>
            <span className="text-sm font-bold text-[#78908C]">모바일 추천</span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {mainMenus.map((item) => (
              <MenuCard key={item.href} item={item} primary />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-black text-[#24423F]">전체 메뉴</h2>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {subMenus.map((item) => (
              <MenuCard key={item.href} item={item} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-black text-[#24423F]">운영실</h2>

          <div className="grid gap-3 md:grid-cols-2">
            {adminMenus.map((item) => (
              <MenuCard key={item.href} item={item} admin />
            ))}
          </div>
        </section>

        <CareCard tone="amber" className="p-4 md:p-5">
          <div className="text-lg font-black">카카오 로그인이 안 될 때</div>
          <p className="mt-2 text-sm font-bold leading-6 text-[#6F5B31]">
            KOE205가 보이면 Kakao Developers의 REST API 키, Client Secret, Redirect URI, Web 플랫폼 도메인을 확인하세요.
          </p>
          <Link
            href="/kakao-checklist"
            className="mt-4 inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#8A6C35] ring-1 ring-[#F0E0C4]"
          >
            KOE205 체크리스트 보기
          </Link>
        </CareCard>
      </section>
    </AppFrame>
  )
}

function MenuCard({
  item,
  primary = false,
  admin = false
}: {
  item: {
    href: string
    icon: string
    title: string
    desc: string
    badge?: string
  }
  primary?: boolean
  admin?: boolean
}) {
  return (
    <Link
      href={item.href}
      className={
        'block rounded-[1.5rem] border p-4 shadow-[0_10px_28px_rgba(93,139,131,0.08)] transition hover:-translate-y-0.5 ' +
        (primary
          ? 'border-[#CDEFE7] bg-[#F3FFFB]'
          : admin
            ? 'border-[#F0E0C4] bg-[#FFF9EF]'
            : 'border-[#E3EFEC] bg-white')
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ' +
            (primary ? 'bg-[#DFF8F1]' : admin ? 'bg-white' : 'bg-[#F4FAF9]')
          }
        >
          {item.icon}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-[#24423F]">{item.title}</h3>
            {item.badge ? (
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-[#2F756B] ring-1 ring-[#D3ECE6]">
                {item.badge}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
            {item.desc}
          </p>
        </div>
      </div>
    </Link>
  )
}
