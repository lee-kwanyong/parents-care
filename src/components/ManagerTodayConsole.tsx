import { demoTimeline } from '@/lib/mock-data'
import { Card, CardTitle } from './Card'
import { StatusTimeline } from './StatusTimeline'
export function ManagerTodayConsole() { return <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"><Card><CardTitle eyebrow="현장 체크" title="오늘 해야 할 일" description="매니저 화면은 긴 입력보다 체크·사진·짧은 메모 중심입니다." /><ul className="space-y-3 text-sm font-semibold text-[#4E6D69]">{['도착 전 안심전화', '만남 암호 확인', '병원 접수', '진료 내용 메모', '약/서류 확인', '안전 종료'].map((item) => <li key={item} className="rounded-2xl bg-slate-50 p-4">✓ {item}</li>)}</ul></Card><Card><CardTitle title="단계별 진행상태" /><StatusTimeline items={demoTimeline} /></Card></div> }
