import { LegalCard, LegalList, LegalPageShell } from '@/components/LegalPageShell'
import { healthDisclaimerItems } from '@/lib/anbu-legal-content'

export const metadata = {
  title: '건강정보 고지 | 안부웍스',
  description: '안부온 건강정보 및 의료행위 아님 고지'
}

export default function HealthDisclaimerPage() {
  return (
    <LegalPageShell
      eyebrow="건강정보 고지"
      title="안부온은 의료 진단이 아니라 안부 확인을 돕는 기능입니다."
      description="부모님의 생활 신호를 보호자에게 전달하지만, 질병 진단·처방·응급 판단을 대신하지 않습니다."
    >
      <LegalCard title="중요 고지">
        <LegalList items={healthDisclaimerItems} />
      </LegalCard>

      <LegalCard title="확인 필요 신호의 의미">
        <p>
          정상/주의/확인 필요 표시는 부모님의 응답 여부, 식사, 복약, 몸 상태, 기분, 활동 응답을 바탕으로
          보호자가 다시 확인할 수 있도록 돕는 참고 정보입니다. 이 표시는 질병 가능성, 우울증, 치매, 낙상 위험 등을 진단하지 않습니다.
        </p>
      </LegalCard>

      <LegalCard title="응급상황">
        <p>
          부모님이 심한 통증, 호흡곤란, 의식 저하, 낙상, 흉통, 갑작스러운 마비, 극심한 어지러움을 호소하는 경우
          앱 응답을 기다리지 말고 즉시 119 또는 가까운 의료기관에 연락해야 합니다.
        </p>
      </LegalCard>
    </LegalPageShell>
  )
}
