import { LegalCard, LegalPageShell } from '@/components/LegalPageShell'

export const metadata = {
  title: '위치정보 안내 | 안부웍스',
  description: '안부웍스 위치정보 사용 안내'
}

export default function LocationNoticePage() {
  return (
    <LegalPageShell
      eyebrow="위치정보 안내"
      title="위치는 동의한 경우에만 안부 확인과 케어 배정에 사용합니다."
      description="병원동행, 귀가확인, 가까운 케어파트너 배정을 위해 위치 또는 활동 지역 정보를 사용할 수 있습니다."
    >
      <LegalCard title="위치정보 사용 목적">
        <p>
          위치정보는 병원동행, 귀가 확인, 지역 기반 케어파트너 배정, 응급상황에서 보호자 확인을 돕기 위한 목적으로만 사용합니다.
          사용자가 위치 권한을 허용하지 않아도 기본 안부 체크 기능은 사용할 수 있습니다.
        </p>
      </LegalCard>

      <LegalCard title="위치정보 제공 범위">
        <p>
          운영실과 케어파트너에게는 해당 업무 수행에 필요한 최소한의 위치 또는 활동 지역만 제공합니다.
          불필요한 실시간 위치 추적 기능은 제공하지 않습니다.
        </p>
      </LegalCard>

      <LegalCard title="철회 방법">
        <p>
          위치 권한은 브라우저 또는 기기 설정에서 언제든 철회할 수 있습니다.
          앱 내 데이터 삭제 요청 화면을 통해 위치 관련 기록 삭제도 요청할 수 있습니다.
        </p>
      </LegalCard>
    </LegalPageShell>
  )
}
