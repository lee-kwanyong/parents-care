import { createWorryRequestFormAction } from '@/app/actions'
import { worryLabels } from '@/lib/constants'
import type { IntakeChannel, WorryCategory } from '@/lib/types'
import { Card, CardTitle } from './Card'

const categories = Object.keys(worryLabels) as WorryCategory[]
const channelOptions: Array<{ value: IntakeChannel; label: string; hint: string }> = [
  { value: 'phone', label: '전화로 맡기기', hint: '앱이 어려우면 통화로 접수' },
  { value: 'kakao', label: '카톡으로 맡기기', hint: '카톡 내용 붙여넣기' },
  { value: 'photo', label: '사진으로 맡기기', hint: '예약 문자·진료증 사진' },
  { value: 'simple_form', label: '직접 간단 입력', hint: '짧게 상황만 입력' }
]

export function WorryIntakeCenter({ error }: { error?: string }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <CardTitle
          eyebrow="안심케어 접수센터"
          title="어떤 안심케어가 필요하세요?"
          description="기능을 찾지 않아도 됩니다. 걱정을 누르면 운영실이 해결 플랜으로 정리합니다."
        />
        {error ? <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p> : null}
        <form action={createWorryRequestFormAction} className="space-y-6">
          <fieldset>
            <legend className="mb-3 text-sm font-black text-[#4E6D69]">1. 안심케어 시작</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {categories.map((key) => (
                <label key={key} className="cursor-pointer rounded-3xl border border-[#E0EFEC] bg-white p-5 text-left transition hover:border-care-500 hover:bg-care-50 has-[:checked]:border-care-600 has-[:checked]:bg-care-50">
                  <input className="sr-only" type="radio" name="category" value={key} defaultChecked={key === 'not_sure'} />
                  <span className="block text-lg font-black">{worryLabels[key]}</span>
                  {key === 'not_sure' ? <span className="mt-2 block text-sm font-semibold text-care-700">정확히 몰라도 괜찮습니다.</span> : null}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-sm font-black text-[#4E6D69]">2. 편한 접수 방식</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {channelOptions.map((option) => (
                <label key={option.value} className="cursor-pointer rounded-2xl bg-slate-100 p-4 has-[:checked]:bg-care-100">
                  <input className="mr-2" type="radio" name="channel" value={option.value} defaultChecked={option.value === 'phone'} />
                  <span className="font-black">{option.label}</span>
                  <span className="mt-1 block text-sm text-[#63807C]">{option.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="mb-2 block text-sm font-black text-[#4E6D69]">3. 상황을 한 줄만 적어주세요</span>
            <textarea
              name="memo"
              required
              rows={5}
              placeholder="예: 어머니가 다음 주 정형외과 예약이 있는데 저는 못 갑니다. 약이랑 보험서류도 챙겨주세요."
              className="w-full rounded-3xl border border-[#E0EFEC] bg-white p-4 text-base outline-none focus:border-care-500 focus:ring-4 focus:ring-care-100"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-black text-[#4E6D69]">보호자 이름</span>
              <input name="contactName" className="w-full rounded-2xl border border-[#E0EFEC] p-3 outline-none focus:border-care-500" placeholder="예: 홍길동" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-black text-[#4E6D69]">연락처</span>
              <input name="contactPhone" className="w-full rounded-2xl border border-[#E0EFEC] p-3 outline-none focus:border-care-500" placeholder="예: 010-0000-0000" />
            </label>
          </div>

          <label className="flex gap-3 rounded-2xl bg-care-50 p-4 text-sm font-semibold text-care-900">
            <input type="checkbox" name="socialCare" />
            비용 부담이 있으면 공공지원·후원 쿠폰·지역 복지 연결도 함께 안내받고 싶습니다.
          </label>

          <button className="w-full rounded-3xl bg-care-600 px-6 py-5 text-xl font-black text-[#2E504D] shadow-soft hover:bg-care-700">
            홈 화면에 추가하기
          </button>
        </form>
      </Card>

      <Card>
        <CardTitle eyebrow="실제 저장 연결" title="접수하면 Supabase에 저장됩니다" description="로그인한 보호자의 가족 공간을 만들고 운영실 걱정 해결 센터에 새 요청으로 올라갑니다." />
        <ol className="space-y-3 text-sm leading-6 text-[#4E6D69]">
          <li className="rounded-2xl bg-slate-100 p-4"><strong>1. 로그인 확인</strong><br />로그인이 없으면 로그인 화면으로 보냅니다.</li>
          <li className="rounded-2xl bg-slate-100 p-4"><strong>2. 가족 공간 생성</strong><br />처음 이용자도 자동으로 우리 가족 공간을 만듭니다.</li>
          <li className="rounded-2xl bg-slate-100 p-4"><strong>3. 안심케어 접수 저장</strong><br />care_intake_entries와 운영 이벤트가 같이 기록됩니다.</li>
          <li className="rounded-2xl bg-slate-100 p-4"><strong>4. 운영실 연결</strong><br />전화·카톡·사진 접수도 같은 흐름으로 처리합니다.</li>
        </ol>
      </Card>
    </div>
  )
}
