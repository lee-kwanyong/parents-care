import { Suspense } from 'react'
import { AnbuOpsLogin } from '@/components/AnbuOpsLogin'

export const metadata = {
  title: '운영실 로그인 | 안부웍스',
  description: '안부웍스 운영실 접근코드 로그인'
}

export default function OpsLoginPage() {
  return (
    <Suspense>
      <AnbuOpsLogin />
    </Suspense>
  )
}
