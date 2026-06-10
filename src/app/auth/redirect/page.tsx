import { AuthRedirectPanel } from '@/components/auth/AuthRedirectPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '로그인 후 이동 | 안부웍스',
  description: '저장된 역할에 따라 보호자, 부모님, 파트너, 운영실 화면으로 이동합니다.'
}

export default function AuthRedirectPage() {
  return <AuthRedirectPanel />
}
