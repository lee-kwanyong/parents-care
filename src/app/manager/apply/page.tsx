import { AppShell } from '@/components/AppShell'
import { Card, CardTitle } from '@/components/Card'

export default function ManagerApplyPage() {
  return (
    <AppShell title="동행매니저 지원서" subtitle="차량 보유, 가능 지역, 전문분야, 경력/자격 정보를 분리해서 입력합니다.">
      <Card>
        <CardTitle title="매니저 지원 정보" desc="운영실 심사 후 승인된 매니저만 배정할 수 있습니다." />
        <form className="grid gap-4 md:grid-cols-2">
          <Field label="이름" placeholder="예: 김도윤" />
          <Field label="휴대폰" placeholder="예: 010-0000-0000" />
          <label>
            <span className="mb-1 block text-sm font-semibold text-slate-700">차량 보유 여부</span>
            <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <option>차량 있음</option>
              <option>차량 없음</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold text-slate-700">직접 운송 가능 여부</span>
            <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <option>기본 서비스 미포함</option>
              <option>별도 정책/계약 검토 필요</option>
            </select>
          </label>
          <Field label="가능 지역" placeholder="예: 강남구, 서초구, 송파구" />
          <Field label="전문분야" placeholder="예: 정형외과, 검진센터, 투석" />
          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-slate-700">경력/자격/소개</span>
            <textarea className="min-h-36 w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="병원동행, 요양보호, 간병, 응급대응, 보호자 커뮤니케이션 경험" />
          </label>
          <button type="button" className="md:col-span-2 rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white">지원서 제출</button>
        </form>
      </Card>
    </AppShell>
  )
}

function Field({ label, placeholder }: { label: string; placeholder?: string }) {
  return (
    <label>
      <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
      <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder={placeholder} />
    </label>
  )
}
