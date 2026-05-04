import { Card, CardTitle } from './Card'
const days = ['1일차 귀가·약 정리', '2일차 식사 확인', '3일차 복약 확인', '4일차 통증 확인', '5일차 낙상 위험 확인', '6일차 다음 외래 확인', '7일차 최종 안심 리포트']
export function DischargeCarePanel() { return <Card><CardTitle eyebrow="퇴원 후 7일" title="집에 돌아온 뒤가 더 중요합니다" description="퇴원 직후의 약·식사·통증·낙상·다음 외래 걱정을 7일짜리 실행 플랜으로 만듭니다." /><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{days.map((day) => <div key={day} className="rounded-2xl bg-slate-50 p-4 font-bold">{day}</div>)}</div></Card> }
