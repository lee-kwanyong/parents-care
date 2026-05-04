
import Link from 'next/link'

const loginOptions = [
  {
    title: '휴대폰 번호 인증',
    desc: '배포 직전에 SMS 인증을 연결합니다. 40대 이상 보호자에게 가장 쉬운 방식입니다.',
    badge: '1순위'
  },
  {
    title: '카카오 로그인',
    desc: '배포 직전에 카카오 OAuth를 연결합니다. 카톡에 익숙한 보호자에게 적합합니다.',
    badge: '2순위'
  },
  {
    title: '이메일 로그인',
    desc: '운영실, 관리자, 이메일이 편한 보호자를 위한 보조 수단입니다.',
    badge: '보조'
  }
]

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto max-w-5xl">
        <p className="mb-3 text-sm font-black text-care-700">로그인 연동 보류</p>
        <h1 className="text-3xl font-black tracking-tight md:text-5xl">
          지금은 로그인보다 부모님 걱정 접수 흐름을 먼저 완성합니다.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
          휴대폰 인증, 카카오 로그인, 이메일 로그인은 배포 직전에 연결합니다.
          현재 개발 단계에서는 로그인 없이 걱정을 접수하고 운영실에서 확인하는 흐름을 우선 만듭니다.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {loginOptions.map((option) => (
            <article key={option.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="rounded-full bg-care-50 px-3 py-1 text-xs font-black text-care-800">
                {option.badge}
              </span>
              <h2 className="mt-4 text-xl font-black">{option.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{option.desc}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">지금 가능한 흐름</h2>
          <p className="mt-3 text-slate-600">
            앱 사용이 어려운 보호자도 바로 부모님 걱정을 맡길 수 있도록 비로그인 접수를 먼저 사용합니다.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/care-request" className="rounded-2xl bg-care-600 px-5 py-4 text-lg font-black text-white">
              부모님 걱정 접수하기
            </Link>
            <Link href="/ops/worry-center" className="rounded-2xl bg-slate-900 px-5 py-4 text-lg font-black text-white">
              운영실 접수 보기
            </Link>
            <Link href="/" className="rounded-2xl bg-slate-100 px-5 py-4 text-lg font-black">
              홈으로
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
