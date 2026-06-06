import { AppPermissionCenter } from '@/components/AppPermissionCenter'

export const metadata = {
  title: '앱 권한 설정 | 안부웍스',
  description: '안부웍스 앱 알림, 위치, 접근성 지원 설정'
}

export default function AppPermissionsPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)]">
      <AppPermissionCenter />
    </main>
  )
}
