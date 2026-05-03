import { AppShell } from '@/components/AppShell'
import { Card, CardTitle } from '@/components/Card'

const risks = [
  { level: '높음', title: '직접 운송 요청 감지', desc: '기본 서비스 범위를 벗어나는 요청입니다. 제휴 이동지원 또는 택시 동행으로 전환 필요.' },
  { level: '중간', title: '동의 범위 미확인', desc: '의료진 안내사항과 비용 공유에 대한 부모님 동의 확인 필요.' },
  { level: '낮음', title: '대기시간 지연', desc: '예상 소요시간보다 30분 이상 지연될 가능성.' }
]

export default function RisksPage() {
  return (
    <AppShell title="사고/법무/운영 리스크 보드" subtitle="차량/픽업 정책, 동의, 사고, 지연, 민감정보 접근을 관리합니다.">
      <div className="grid gap-4">
        {risks.map((risk) => (
          <Card key={risk.title}>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-700">{risk.level}</span>
                <h2 className="mt-3 text-xl font-bold text-slate-950">{risk.title}</h2>
                <p className="mt-1 text-slate-600">{risk.desc}</p>
              </div>
              <button className="rounded-2xl bg-slate-950 px-4 py-3 font-bold text-white">처리 기록</button>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  )
}
