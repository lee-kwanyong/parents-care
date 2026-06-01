import { RoleAwareLoginPage } from '@/components/auth/RoleAwareLoginPage'

export const metadata = {
  title: '로그인·회원가입 | 부모님 안심케어',
  description: '역할에 맞는 화면으로 시작합니다.'
}

export default function LoginPage() {
  return <RoleAwareLoginPage />
}
