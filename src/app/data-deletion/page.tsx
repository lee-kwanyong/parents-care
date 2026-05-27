import { LegalCard, LegalPageShell } from '@/components/LegalPageShell'
import { DataRequestForm } from '@/components/DataRequestForm'

export const metadata = {
  title: '데이터 삭제 요청 | 안부웍스',
  description: '안부웍스 계정 및 데이터 삭제 요청'
}

export default function DataDeletionPage() {
  return (
    <LegalPageShell
      eyebrow="데이터 삭제 요청"
      title="계정, 부모님 연결 정보, 안부 기록 삭제를 요청할 수 있습니다."
      description="이용자는 개인정보 열람, 정정, 삭제, 처리정지, 동의 철회를 요청할 수 있습니다."
    >
      <LegalCard title="삭제 요청 처리 범위">
        <p>
          삭제 요청이 접수되면 운영실은 본인 확인 후 부모님 연결 정보, 안부 기록, 알림 기록, 위치 관련 기록, 문의 기록을 확인합니다.
          법령상 보관이 필요한 결제·정산·분쟁 대응 정보는 필요한 기간 동안 별도 보관될 수 있습니다.
        </p>
      </LegalCard>

      <LegalCard title="처리 절차">
        <p>
          요청 접수 → 본인 확인 → 삭제 대상 확인 → 삭제 또는 보관 필요 사유 안내 → 처리 결과 회신 순서로 진행합니다.
        </p>
      </LegalCard>

      <DataRequestForm defaultType="delete_account" />
    </LegalPageShell>
  )
}
