import { GuardianSignupPanel } from '@/components/auth/GuardianSignupPanel'

export const metadata = {
  title: '보호자 회원가입 | 부모님 안심케어',
  description: '보호자 이메일 또는 소셜 로그인으로 부모님 안심케어를 시작합니다.'
}

export default function GuardianSignupPage() {
  return <GuardianSignupPanel />
}
