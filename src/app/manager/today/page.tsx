import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { Card, CardTitle } from '@/components/Card'
import { StatusTimeline } from '@/components/StatusTimeline'
import { demoTimeline } from '@/lib/mock-data'

const checklist = [
  '본인 확인 및 만남 암호 확인',
  '이동 방식 재확인: 택시 동행/제휴 이동지원/병원 앞 만남',
  '접수 위치 및 진료과 확인',
  '보호자 질문 리스트 확인',
  '수납/약국/다음 예약 확인',
  '리포트 초안 작성'
]

const questions = [
  '무릎 통증이 심해진 원인이 무엇인지 확인',
  '약 복용 시 주의사항 확인',
  '물리치료 필요 여부와 횟수 확인',
  '다음 예약 필요 여부 확인'
]

export default function ManagerTodayPage() {
  return (
    <AppShell title="동행매니저앱" subtitle="오늘 배정 일정, 현장 체크리스트, 보호자 질문, 진행상태 업데이트를 관리합니다.">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <Card>
            <CardTitle title="오늘 배정 일정" desc="김영희님 · 서울튼튼병원 · 10:30 정형외과" />
            <div className="rounded-2xl bg-yellow-100 p-4 text-center">
              <p className="text-sm font-bold text-yellow-900">만남 암호</p>
              <p className="mt-1 text-3xl font-black text-yellow-950">봄길 27</p>
            </div>
            <Link href="/manager/apply" className="mt-4 block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center font-bold text-slate-900">지원서 정보 수정</Link>
          </Card>
          <Card>
            <CardTitle title="현장 체크리스트" />
            <ul className="space-y-2">
              {checklist.map((item) => (
                <li key={item} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                  <input type="checkbox" className="h-5 w-5" />
                  <span className="font-medium text-slate-800">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="space-y-5">
          <Card>
            <CardTitle title="보호자가 의사에게 확인할 질문" />
            <ul className="space-y-2 text-sm text-slate-700">
              {questions.map((item) => <li key={item} className="rounded-2xl bg-blue-50 p-3">• {item}</li>)}
            </ul>
          </Card>
          <Card>
            <CardTitle title="단계별 진행상태 업데이트" desc="업데이트는 자녀앱 타임라인과 운영실 로그에 반영됩니다." />
            <StatusTimeline items={demoTimeline} />
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              {['병원 도착', '진료 중', '리포트 작성'].map((label) => (
                <button key={label} className="rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white">{label}</button>
              ))}
            </div>
          </Card>
          <Card>
            <CardTitle title="리포트 초안 작성" />
            <textarea className="min-h-36 w-full rounded-2xl border border-slate-200 p-4" placeholder="진료 진행 내용, 안내사항, 검사/약/다음 예약, 비용, 컨디션, 다음 액션" />
            <button className="mt-3 w-full rounded-2xl bg-slate-950 px-4 py-3 font-bold text-white">운영실 검수 요청</button>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
