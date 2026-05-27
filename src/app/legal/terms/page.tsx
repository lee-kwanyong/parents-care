import { LegalCard, LegalList, LegalPageShell } from '@/components/LegalPageShell'

export const metadata = {
  title: '이용약관 | 안부웍스',
  description: '안부웍스 부모님 안심케어 이용약관'
}

const serviceScope = [
  '부모님 안부 체크와 보호자 알림',
  '복약·병원 일정 알림',
  '응답 없음, 복약 누락, 식사 미확인 등 확인 필요 신호 표시',
  '주간·월간 돌봄 리포트',
  '운영실 확인 요청 및 케어파트너 연결',
  '요금제 결제, 구독 상태 관리'
]

const userDuties = [
  '보호자는 정확한 연락처와 부모님 연결 정보를 입력해야 합니다.',
  '부모님의 동의 없이 부모님 안부 정보를 등록하거나 공유해서는 안 됩니다.',
  '응급상황에서는 앱 알림보다 119 또는 의료기관 연락을 우선해야 합니다.',
  '케어파트너에게 의료행위, 처방, 투약 결정 등 금지된 업무를 요청해서는 안 됩니다.'
]

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="이용약관"
      title="안부웍스 서비스 이용 기준입니다."
      description="서비스 범위, 이용자 책임, 결제, 제한사항, 면책사항을 정리했습니다."
    >
      <LegalCard title="1. 서비스 범위">
        <LegalList items={serviceScope} />
      </LegalCard>

      <LegalCard title="2. 이용자 의무">
        <LegalList items={userDuties} />
      </LegalCard>

      <LegalCard title="3. 결제와 환불">
        <p>
          안부온 구독은 선택한 요금제에 따라 결제되며, 케어파트너 생활확인·병원동행 등 사람 케어는 별도 건별 비용이 발생할 수 있습니다.
          환불과 취소는 실제 제공 여부, 예약 상태, 외부 결제대행사 정책에 따라 처리됩니다.
        </p>
      </LegalCard>

      <LegalCard title="4. 의료행위 금지">
        <p>
          안부웍스는 의료 진단, 치료, 처방, 투약 결정, 응급 판단을 제공하지 않습니다.
          모든 의료 판단은 의료진과 보호자의 책임이며, 응급상황은 즉시 119 또는 의료기관에 연락해야 합니다.
        </p>
      </LegalCard>

      <LegalCard title="5. 서비스 제한">
        <p>
          허위 정보 입력, 동의 없는 정보 등록, 부정 결제, 운영 방해, 케어파트너에게 금지 업무를 요청하는 경우 서비스 이용이 제한될 수 있습니다.
        </p>
      </LegalCard>
    </LegalPageShell>
  )
}
