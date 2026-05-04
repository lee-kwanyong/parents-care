import { AppShell } from '@/components/AppShell'
import { Card, CardTitle } from '@/components/Card'
export default function LoginPage() { return <AppShell title="로그인" subtitle="Supabase Auth 연결 전까지는 데모 로그인 화면입니다."><Card><CardTitle title="휴대폰/이메일 로그인 예정" description="자녀, 부모님, 매니저, 운영실 권한은 Supabase profiles.role과 RLS로 분리합니다." /></Card></AppShell> }
