import { LegalCard, LegalList, LegalPageShell } from '@/components/LegalPageShell'
import { dataCategories, dataSharing, serviceName, supportEmail, usePurposes } from '@/lib/anbu-legal-content'

export const metadata = {
  title: '개인정보처리방침 | 안부웍스',
  description: '안부웍스 부모님 안심케어 개인정보처리방침'
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      eyebrow="개인정보처리방침"
      title="부모님 안부 정보는 최소한으로 수집하고, 필요한 목적에만 사용합니다."
      description={`${serviceName}는 부모님 안부 확인, 보호자 알림, 케어파트너 연결을 위해 필요한 정보만 처리합니다.`}
    >
      <LegalCard title="1. 수집하는 정보">
        <LegalList items={dataCategories} />
      </LegalCard>

      <LegalCard title="2. 이용 목적">
        <LegalList items={usePurposes} />
      </LegalCard>

      <LegalCard title="3. 정보 제공 및 공유">
        <LegalList items={dataSharing} />
      </LegalCard>

      <LegalCard title="4. 보관 기간">
        <p>
          안부 기록, 연결 정보, 알림 기록, 결제 내역은 서비스 제공과 분쟁 대응에 필요한 기간 동안 보관합니다.
          이용자가 삭제를 요청하면 법령상 보관이 필요한 정보를 제외하고 지체 없이 처리합니다.
        </p>
      </LegalCard>

      <LegalCard title="5. 이용자의 권리">
        <p>
          이용자는 개인정보 열람, 정정, 삭제, 처리정지, 동의 철회를 요청할 수 있습니다.
          요청은 <strong>{supportEmail}</strong> 또는 데이터 삭제 요청 화면에서 접수할 수 있습니다.
        </p>
      </LegalCard>

      <LegalCard title="6. 안전조치">
        <p>
          개인정보와 민감한 안부 정보는 서버 접근 권한을 제한하고, 필요한 경우에만 운영실과 케어파트너에게 최소 범위로 제공합니다.
          서비스 운영 과정에서 수집 목적과 무관한 정보는 사용하지 않습니다.
        </p>
      </LegalCard>
    </LegalPageShell>
  )
}
