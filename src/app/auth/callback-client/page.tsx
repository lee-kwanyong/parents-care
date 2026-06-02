import { AuthCallbackClient } from '@/components/auth/AuthCallbackClient'

export const metadata = {
  title: '로그인 처리 | 부모님 안심케어',
  description: '보호자 로그인 세션을 저장합니다.'
}

export default function AuthCallbackClientPage() {
  return <AuthCallbackClient />
}
