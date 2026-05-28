import Link from 'next/link'

export const metadata = {
  title: '결제 실패 | 안부웍스',
  description: '안부웍스 결제 실패'
}

type SearchParams = Promise<{
  code?: string
  message?: string
  orderId?: string
}>

export default async function PaymentFailPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FFF8F8_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8 text-[#173B36]">
      <section className="mx-auto max-w-3xl">
        <div className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#F3BBBB] sm:p-8">
          <div className="inline-flex rounded-full bg-[#FFF1F1] px-4 py-2 text-sm font-black text-[#8A2525]">
            결제 실패
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            결제가 완료되지 않았습니다.
          </h1>

          <p className="mt-4 text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
            {params.message || '결제 진행 중 오류가 발생했거나 사용자가 결제를 취소했습니다.'}
          </p>

          <div className="mt-5 rounded-2xl bg-[#FFF8E8] p-4 text-sm font-bold leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
            오류 코드: {params.code || '-'} · 주문번호: {params.orderId || '-'}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            
            <Link href="/checkout?plan=basic" className="rounded-2xl bg-[#20C5A8] px-5 py-4 text-sm font-black text-white">
              다시 결제하기
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
