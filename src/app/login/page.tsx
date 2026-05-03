import { AppShell } from '@/components/AppShell'
import { Card, CardTitle } from '@/components/Card'

export default function LoginPage() {
  return (
    <AppShell title="로그인" subtitle="MVP에서는 Supabase Auth로 이메일/휴대폰 로그인을 연결합니다.">
      <Card className="mx-auto max-w-lg">
        <CardTitle title="안심동행 로그인" desc="실서비스에서는 자녀, 부모님, 매니저, 운영실 권한을 프로필과 RLS로 분리합니다." />
        <form className="space-y-3">
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="이메일 또는 휴대폰" />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="비밀번호 또는 인증번호" />
          <button type="button" className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white">로그인</button>
        </form>
      </Card>
    </AppShell>
  )
}
