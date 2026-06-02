'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { readParentSession, saveParentSession, type ParentSession } from '@/components/auth/ParentSessionBridge'

function code6(value: string) {
  return value.replace(/[^\d]/g, '').slice(0, 6)
}

function last4(value: string) {
  return value.replace(/[^\d]/g, '').slice(-4)
}

export function ParentLoginPanel() {
  const [familyCode, setFamilyCode] = useState('')
  const [parentPhoneLast4, setParentPhoneLast4] = useState('')
  const [message, setMessage] = useState('')
  const [session, setSession] = useState<ParentSession | null>(null)
  const [loading, setLoading] = useState(false)

  async function connect(code: string, phone4: string, redirect = true) {
    const targetCode = code6(code)
    const targetLast4 = last4(phone4)

    if (!/^\d{6}$/.test(targetCode)) {
      setMessage('6자리 연결코드를 입력해주세요.')
      return
    }

    if (!/^\d{4}$/.test(targetLast4)) {
      setMessage('부모님 휴대폰 번호 뒤 4자리를 입력해주세요.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/parent-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyCode: targetCode, parentPhoneLast4: targetLast4 })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok || !data.session) {
        setMessage(data.message || '연결코드와 부모님 휴대폰 번호를 확인해주세요.')
        return
      }

      saveParentSession(data.session)
      setSession(data.session)
      setFamilyCode(data.session.familyCode)
      setMessage(data.message || '부모님과 보호자 연결이 완료되었습니다.')

      if (redirect) {
        setTimeout(() => {
          window.location.href = '/parent/today?connected=1'
        }, 300)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '연결 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await connect(familyCode, parentPhoneLast4, true)
  }

  useEffect(() => {
    const existing = readParentSession()

    if (existing) {
      window.location.replace('/parent/today?connected=1')
      return
    }

    const params = new URLSearchParams(window.location.search)
    const queryCode = code6(params.get('code') || params.get('familyCode') || '')

    if (queryCode) setFamilyCode(queryCode)
  }, [])

  return (
    <section className="mx-auto w-full max-w-xl rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-8">
      <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
        부모님 6자리 코드입력
      </div>

      <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] text-[#173B36]">
        6자리 코드와
        <br />
        휴대폰 뒤 4자리를 입력하세요.
      </h1>

      <p className="mt-4 text-sm font-bold leading-7 text-[#637B76]">
        연결이 완료되면 부모님 전용 안부 화면으로 이동하고, 이 기기에 연결 상태가 저장됩니다.
      </p>

      {message ? (
        <div className="mt-5 rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
          {message}
        </div>
      ) : null}

      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="grid gap-2">
          <span className="text-sm font-black text-[#55736E]">6자리 연결코드</span>
          <input
            value={familyCode}
            onChange={(event) => setFamilyCode(code6(event.target.value))}
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            className="w-full min-w-0 max-w-full box-border rounded-2xl border border-[#D8EEE8] bg-white px-3 py-4 text-center text-3xl font-black tracking-[0.10em] text-[#173B36] outline-none focus:ring-4 focus:ring-[#D6F6EC] sm:px-4 sm:text-4xl sm:tracking-[0.16em]"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-[#55736E]">부모님 휴대폰 번호 뒤 4자리</span>
          <input
            value={parentPhoneLast4}
            onChange={(event) => setParentPhoneLast4(last4(event.target.value))}
            inputMode="numeric"
            maxLength={4}
            placeholder="예: 1234"
            className="w-full rounded-2xl border border-[#D8EEE8] bg-white px-4 py-4 text-center text-2xl font-black tracking-[0.12em] text-[#173B36] outline-none focus:ring-4 focus:ring-[#D6F6EC]"
          />
        </label>

        <button
          disabled={loading}
          className="w-full rounded-2xl bg-[#193B38] px-5 py-4 text-base font-black text-white disabled:bg-[#9FB8B3]"
        >
          {loading ? '확인 중...' : '부모님 안부 화면 들어가기'}
        </button>
      </form>
    </section>
  )
}

export default ParentLoginPanel
