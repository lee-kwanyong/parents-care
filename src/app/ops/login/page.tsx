export const metadata = {
  title: '운영실 로그인 | 부모님 안심케어',
  description: '운영실 비밀번호를 입력합니다.'
}

export default function OpsLoginPage() {
  return (
    <main className="min-h-[60vh] bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-8 text-[#173B36]">
      <section className="mx-auto max-w-xl rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-[#D8EEE8]">
        <div className="text-2xl font-black tracking-[-0.05em]">
          운영실 인증이 완료되었습니다.
        </div>
        <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
          운영실 화면으로 이동해주세요.
        </p>
        <a
          href="/ops"
          className="mt-6 inline-flex rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white"
        >
          운영실로 이동
        </a>
      </section>
    </main>
  )
}
