import { SupabaseSetupPanel } from '@/components/SupabaseSetupPanel'

export const metadata = {
  title: 'Supabase DB 설정 | 안부웍스',
  description: '안부웍스 Supabase 서버 저장 설정 및 점검'
}

export default function SupabaseSetupPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)]">
      <SupabaseSetupPanel />
    </main>
  )
}
