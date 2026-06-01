import { GuardianFamilyLinkPanel } from '@/components/guardian/GuardianFamilyLinkPanel'

export const metadata = {
  title: '자녀-부모 연결 | 부모님 안심케어',
  description: '보호자가 부모님께 전달할 6자리 연결코드를 만듭니다.'
}

export default function FamilyLinkPage() {
  return <GuardianFamilyLinkPanel />
}
