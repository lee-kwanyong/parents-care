import Link from 'next/link'

const packTitleByCode: Record<string, string> = {
  hospital_day: '병원 가는 날 안심팩',
  meal_delivery: '안심밥상 케어',
  medication_check: '약 챙김 안심팩',
  discharge_7days: '퇴원 후 7일 안심팩',
  documents_insurance: '보험서류 챙김팩',
  regular_care: '정기진료·정기케어 자동관리',
  wellbeing_check: '정기 안부 확인',
  urgent_help: '긴급 확인 요청',
  not_sure_consult: '뭘 해야 할지 모르겠어요 상담'
}

export default async function CareRequestThanksPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = searchParams ? await searchParams : {}
  const packValue = typeof params.pack === 'string' ? params.pack : 'not_sure_consult'
  const intakeId = typeof params.intake === 'string' ? params.intake : ''
  const isDemo = params.demo === '1'
  const title = packTitleByCode[packValue] || '부모님 케어 상담'

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-black text-emerald-700">접수 완료</p>
        <h1 className="mt-3 text-3xl font-black md:text-5xl">
          부모님 걱정이 접수됐습니다.
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          추천 케어팩은 <b>{title}</b> 입니다. 운영실이 확인하면 가족용 간편 케어플랜으로 정리됩니다.
        </p>

        <div className="mt-6 rounded-2xl bg-slate-50 p-5">
          <div className="text-sm font-black text-slate-500">접수번호</div>
          <div className="mt-2 break-all text-lg font-black">{intakeId || '임시 접수'}</div>
          {isDemo ? (
            <p className="mt-3 text-sm font-bold text-amber-700">
              현재 Supabase 환경변수가 없어 데모 접수로 처리됐습니다.
            </p>
          ) : null}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {intakeId ? (
            <Link href={`/care-request/status/${intakeId}`} className="rounded-2xl bg-emerald-600 px-5 py-4 text-center font-black text-white">
              가족용 케어플랜 보기
            </Link>
          ) : null}
          <Link href="/ops/plan-builder" className="rounded-2xl bg-slate-900 px-5 py-4 text-center font-black text-white">
            운영실에서 플랜 만들기
          </Link>
          <Link href="/care-request" className="rounded-2xl bg-slate-100 px-5 py-4 text-center font-black">
            또 다른 걱정 접수
          </Link>
          <Link href="/" className="rounded-2xl bg-slate-100 px-5 py-4 text-center font-black">
            홈으로
          </Link>
        </div>
      </section>
    </main>
  )
}
