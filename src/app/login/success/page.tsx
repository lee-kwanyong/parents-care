import { AuthRedirectPanel } from '@/components/auth/AuthRedirectPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '로그인 완료 | 안부웍스',
  description: '로그인 후 역할에 맞는 화면으로 이동합니다.'
}

export default function LoginSuccessPage() {
  return <AuthRedirectPanel />
}
