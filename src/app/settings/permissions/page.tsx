import { AppPermissionCenter } from '@/components/AppPermissionCenter'

export const metadata = {
  title: '앱 권한 설정 | 안부웍스',
  description: '안부웍스 앱 알림, 위치, 접근성 지원 설정'
}

export default function AppPermissionsPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)]">
      <AppPermissionCenter />
    </main>
  )
}
