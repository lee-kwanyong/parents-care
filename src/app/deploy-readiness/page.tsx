import { DeployReadinessBoard } from '@/components/DeployReadinessBoard'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { SectionHeader } from '@/components/ui/SectionHeader'

export default function DeployReadinessPage() {
  return (
    <AppFrame title="배포 전 점검" subtitle="Vercel 배포 전에 환경변수와 보안을 확인합니다" backHref="/ops" showMobileNav={false}>
      <SectionHeader
        eyebrow="Vercel 배포 준비"
        title={
          <>
            배포 전에
            <br />
            위험한 설정을 확인합니다.
          </>
        }
        description="Service Role Key는 서버에서만 쓰고, 공개 환경변수와 서버 시크릿을 분리합니다. Supabase 연결, Storage bucket, PWA, QA 상태까지 배포 전 확인합니다."
        actions={
          <>
            <CareButton href="/admin/ops/qa" tone="dark">
              QA 보드
            </CareButton>
            <CareButton href="/mobile-check" tone="soft">
              모바일 점검
            </CareButton>
          </>
        }
      />

      <div className="mt-8">
        <DeployReadinessBoard />
      </div>
    </AppFrame>
  )
}
