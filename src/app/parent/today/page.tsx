import Link from 'next/link'
import { cookies } from 'next/headers'
import { ParentDailyCareButtons } from '@/components/ParentDailyCareButtons'

export default async function ParentTodayPage() {
  const cookieStore = await cookies()
  const role = cookieStore.get('pc_role')?.value || cookieStore.get('anbu_role')?.value || ''
  const familyCode = cookieStore.get('pc_parent_invite_code')?.value || cookieStore.get('anbu_family_code')?.value || ''
  const parentName = cookieStore.get('pc_parent_name')?.value || '부모님'

  const isParentLoggedIn = role === 'parent' && Boolean(familyCode)

  if (!isParentLoggedIn) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#F2FFFB_0%,#FFFFFF_58%,#F7FBFF_100%)] px-5 py-8 text-[#173B36]">
        <section className="mx-auto max-w-xl">
          <div className="rounded-[2rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8]">
            <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
              안부웍스 · 안부온
            </div>

            <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.06em] sm:text-5xl">
              부모님 체크는
              <br />
              연결 후 사용할 수 있어요.
            </h1>

            <p className="mt-4 text-lg font-bold leading-8 text-[#647C77]">
              식사, 약, 몸 상태 버튼은 보호자가 만든 연결코드로 접속한 부모님만 보낼 수 있습니다.
              로그인하지 않은 상태에서는 안부 기록이 저장되지 않습니다.
            </p>

            <div className="mt-6 grid gap-3">
              <Link
                href="/parent/login"
                className="rounded-[1.5rem] bg-[#123F38] px-6 py-5 text-center text-xl font-black text-white shadow-sm"
              >
                부모님 연결코드 입력
              </Link>

              <Link
                href="/family-link"
                className="rounded-[1.5rem] bg-[#EFFFF9] px-6 py-5 text-center text-xl font-black text-[#116D5F] shadow-sm ring-1 ring-[#CDEFE5]"
              >
                보호자가 코드 만들기
              </Link>
            </div>
          </div>

          <div className="mt-5 rounded-[2rem] bg-[#F7FBFF] p-5 text-sm font-bold leading-7 text-[#5F7772] ring-1 ring-[#DCEDE7]">
            안부온은 부모님 본인 동의 후 자녀에게 안부 기록을 전달하는 기능입니다.
            응급상황은 119 또는 의료기관에 연락하세요.
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F2FFFB_0%,#FFFFFF_58%,#F7FBFF_100%)] px-5 py-5 text-[#173B36]">
      <section className="mx-auto max-w-xl space-y-5">
        <div className="rounded-[2rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8]">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            안부웍스 · 안부온
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.06em] sm:text-5xl">
            오늘 안부를
            <br />
            버튼으로 알려주세요.
          </h1>

          <p className="mt-4 text-lg font-bold leading-8 text-[#647C77]">
            식사, 약, 몸 상태, 기분을 누르면 자녀가 오늘 상태를 바로 확인할 수 있습니다.
          </p>
        </div>

        <ParentDailyCareButtons elderName={parentName} />

        <div className="grid gap-3">
          <Link
            href="tel:119"
            className="rounded-[1.5rem] bg-[#FFE7E7] px-6 py-5 text-center text-xl font-black text-[#8A2525] shadow-sm"
          >
            긴급하면 119
          </Link>
          <Link
            href="/child/daily-care"
            className="rounded-[1.5rem] bg-white px-6 py-5 text-center text-xl font-black text-[#173B36] shadow-sm ring-1 ring-[#D8EEE8]"
          >
            보호자 화면 보기
          </Link>
        </div>

        <div className="rounded-[2rem] bg-[#F7FBFF] p-5 text-sm font-bold leading-7 text-[#5F7772] ring-1 ring-[#DCEDE7]">
          안부온은 의료 진단이 아니라 가족의 안부 확인을 돕는 기능입니다.
          몸이 많이 아프거나 응급상황이면 119에 연락하세요.
        </div>
      </section>
    </main>
  )
}
