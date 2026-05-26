import { ParentCodeLogin } from '@/components/AnbuWorksBuildout'

export const metadata = {
  title: '부모님 연결코드 입력 | 안부웍스',
  description: '부모님이 보호자 연결코드로 안부온에 접속합니다.'
}

export default function ParentLoginPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F2FFFB_0%,#FFFFFF_58%,#F7FBFF_100%)] px-5 py-8">
      <section className="mx-auto max-w-xl">
        <ParentCodeLogin />
      </section>
    </main>
  )
}
