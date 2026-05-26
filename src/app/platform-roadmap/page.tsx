import { PlatformRoadmapMvp } from '@/components/AnbuWorksBuildout'

export const metadata = {
  title: '플랫폼 구조 | 안부웍스',
  description: 'AI 안부확인에서 케어파트너 연결까지 이어지는 플랫폼 구조입니다.'
}

export default function PlatformRoadmapPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8">
      <section className="mx-auto max-w-6xl">
        <PlatformRoadmapMvp />
      </section>
    </main>
  )
}
