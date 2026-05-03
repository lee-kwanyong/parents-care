import { AppShell } from '@/components/AppShell'
import { Card, CardTitle } from '@/components/Card'
import { pickupModeLabels } from '@/lib/constants'

export default function NewAppointmentPage() {
  return (
    <AppShell title="부모님 병원 일정 등록" subtitle="일정, 병원, 이동 방식, 공유 범위를 등록합니다.">
      <Card>
        <CardTitle title="새 병원동행 일정" desc="차량 보유와 직접 운송 가능 여부는 분리해서 고지합니다." />
        <form className="grid gap-4 md:grid-cols-2">
          <Field label="부모님 성함" placeholder="예: 김영희" />
          <Field label="병원명" placeholder="예: 서울튼튼병원" />
          <Field label="진료과" placeholder="예: 정형외과" />
          <Field label="진료 일시" type="datetime-local" />
          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-slate-700">픽업/이동 방식</span>
            <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3">
              {Object.entries(pickupModeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </label>
          <Field label="만남 장소" placeholder="예: 아파트 정문 / 병원 1층 접수처" />
          <Field label="가족 공동조회 코드 받을 연락처" placeholder="예: 010-0000-0000" />
          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-slate-700">보호자 질문 리스트</span>
            <textarea className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="예: 무릎 통증 원인, 약 복용 주의사항, 다음 예약 필요 여부" />
          </label>
          <label className="md:col-span-2 flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-950">
            <input type="checkbox" className="mt-1" />
            <span>매니저 차량 보유 여부는 참고 정보이며, 기본 서비스는 병원 앞 만남·집 앞 만남 후 택시 동행·제휴 이동지원 기준임을 확인했습니다.</span>
          </label>
          <button type="button" className="md:col-span-2 rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white">일정 등록</button>
        </form>
      </Card>
    </AppShell>
  )
}

function Field({ label, placeholder, type = 'text' }: { label: string; placeholder?: string; type?: string }) {
  return (
    <label>
      <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
      <input type={type} className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder={placeholder} />
    </label>
  )
}
