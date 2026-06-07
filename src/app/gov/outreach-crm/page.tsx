import { OutreachCrmPanel } from '@/components/ops/OutreachCrmPanel'

export const metadata = {
  title: '지자체 실증 협업 관리 | 안부웍스',
  description: '지자체 실증 협업 제안 대상과 접촉 상태를 관리합니다.'
}

export default function GovOutreachCrmPage() {
  return (
    <OutreachCrmPanel
      title="지자체 실증 협업 관리"
      subtitle="고령친화도시 후보 지자체의 전화 확인, 이메일 발송, 회신, 시연 미팅 상태를 관리합니다."
    />
  )
}
