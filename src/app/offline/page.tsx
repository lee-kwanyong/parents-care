import Link from 'next/link'

export const metadata = {
  title: '오프라인 | 안부웍스 앱',
  description: '네트워크 연결이 필요합니다.'
}

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-[#F7FFFC] px-4 py-8 text-[#17443F]">
      <section className="mx-auto max-w-md rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D6EDE7]">
        <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-xs font-black text-[#2AA897]">
          오프라인
        </div>

        <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.08em]">
          네트워크 연결을
          <br />
          확인해주세요.
        </h1>

        <p className="mt-4 text-sm font-bold leading-7 text-[#637B76]">
          안부 신호 전송과 긴급 요청 확인은 인터넷 연결이 필요합니다. 연결 후 다시 시도해주세요.
        </p>

        <Link href="/mobile" className="mt-5 block rounded-2xl bg-[#247A71] px-5 py-4 text-center text-sm font-black text-white">
          앱 홈으로 돌아가기
        </Link>
      </section>
    </main>
  )
}
