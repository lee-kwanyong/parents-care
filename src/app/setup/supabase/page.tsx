import { SupabaseSetupPanel } from '@/components/SupabaseSetupPanel'

export const metadata = {
  title: 'Supabase DB 설정 | 안부웍스',
  description: '안부웍스 Supabase 서버 저장 설정 및 점검'
}

export default function SupabaseSetupPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)]">
      <SupabaseSetupPanel />
    </main>
  )
}
