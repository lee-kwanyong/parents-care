'use client'

import { useState } from 'react'

const requestTypes = [
  { value: 'delete_account', label: '계정/연결 정보 삭제 요청' },
  { value: 'delete_parent_data', label: '부모님 안부 기록 삭제 요청' },
  { value: 'export_data', label: '내 데이터 열람/사본 요청' },
  { value: 'correct_data', label: '개인정보 수정 요청' },
  { value: 'withdraw_consent', label: '동의 철회 요청' },
  { value: 'contact', label: '일반 문의' }
]

export function DataRequestForm({ defaultType = 'delete_account' }: { defaultType?: string }) {
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    const form = new FormData(event.currentTarget)

    const payload = {
      requestType: String(form.get('requestType') || defaultType),
      requesterName: String(form.get('requesterName') || ''),
      phone: String(form.get('phone') || ''),
      email: String(form.get('email') || ''),
      familyCode: String(form.get('familyCode') || ''),
      details: String(form.get('details') || ''),
      consent: form.get('consent') === 'on'
    }

    try {
      const response = await fetch('/api/data-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '요청 접수에 실패했습니다.')
      }

      event.currentTarget.reset()
      setMessage('요청이 접수되었습니다. 운영실에서 확인 후 연락드리겠습니다.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청 접수 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
      <h2 className="text-2xl font-black tracking-[-0.05em]">요청 접수</h2>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm font-black text-[#55736E]">요청 유형</span>
          <select
            name="requestType"
            defaultValue={defaultType}
            className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
          >
            {requestTypes.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>

        <Input name="requesterName" label="이름" placeholder="예: 이가영" required />
        <Input name="phone" label="연락처" placeholder="예: 010-0000-0000" />
        <Input name="email" label="이메일" placeholder="예: name@example.com" />
        <Input name="familyCode" label="부모님 연결코드" placeholder="선택 입력. 예: 2580" />
      </div>

      <label className="mt-5 grid gap-2">
        <span className="text-sm font-black text-[#55736E]">요청 내용</span>
        <textarea
          name="details"
          required
          className="min-h-32 rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
          placeholder="삭제, 열람, 수정, 동의 철회 등 요청 내용을 적어주세요."
        />
      </label>

      <label className="mt-5 block rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D8EEE8]">
        <input name="consent" type="checkbox" required className="mr-2" />
        요청 처리를 위해 입력한 연락처와 요청 내용을 안부웍스 운영실이 확인하는 데 동의합니다.
      </label>

      {message ? (
        <div className="mt-5 rounded-2xl bg-[#EFFFF9] p-4 text-sm font-black leading-7 text-[#116D5F] ring-1 ring-[#CDEFE5]">
          {message}
        </div>
      ) : null}

      <button
        disabled={saving}
        className="mt-5 rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
      >
        {saving ? '접수 중...' : '요청 접수하기'}
      </button>
    </form>
  )
}

function Input({
  name,
  label,
  placeholder,
  required = false
}: {
  name: string
  label: string
  placeholder: string
  required?: boolean
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#55736E]">{label}</span>
      <input
        name={name}
        required={required}
        className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
        placeholder={placeholder}
      />
    </label>
  )
}
