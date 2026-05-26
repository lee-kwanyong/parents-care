import { FamilyLinkMvp } from '@/components/AnbuWorksBuildout'

export const metadata = {
  title: '부모님 연결 | 안부웍스',
  description: '자녀와 부모님을 안부온으로 연결합니다.'
}

export default function FamilyLinkPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8">
      <section className="mx-auto max-w-6xl">
        <FamilyLinkMvp />
      </section>
    </main>
  )
}
