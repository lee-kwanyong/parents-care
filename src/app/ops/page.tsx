import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { Card, CardTitle } from '@/components/Card'

const cards = [
  { href: '/ops/assignments', title: '매니저 심사/승인·배정', desc: '지원서 확인, 승인, 일정별 매니저 배정' },
  { href: '/ops/risks', title: '사고/법무/운영 리스크 보드', desc: '위험 플래그, 차량/픽업 정책, 동의 누락, 지연 관리' },
  { href: '/ops/reports', title: '리포트 검수/발송', desc: '매니저 초안 검수 후 보호자에게 발송' }
]

const logs = [
  '08:30 운영실: 김도윤 매니저 배정 완료',
  '08:35 시스템: 가족 공동조회 코드 생성',
  '09:10 매니저: 현장 체크리스트 시작',
  '09:20 매니저: 만남 암호 확인 완료'
]

export default function OpsHomePage() {
  return (
    <AppShell title="운영실" subtitle="심사, 배정, 위험 플래그, 리포트 검수, 운영 로그를 관리합니다.">
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Link href={card.href} key={card.href}>
            <Card className="h-full transition hover:-translate-y-1 hover:border-blue-300">
              <CardTitle title={card.title} desc={card.desc} />
              <span className="font-bold text-blue-700">관리하기 →</span>
            </Card>
          </Link>
        ))}
      </div>
      <Card className="mt-5">
        <CardTitle title="운영 로그" desc="상태 변경과 민감정보 접근은 감사 로그로 남깁니다." />
        <ul className="space-y-2">
          {logs.map((log) => <li key={log} className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">{log}</li>)}
        </ul>
      </Card>
    </AppShell>
  )
}
