'use client'

import Link from 'next/link'
import { useEffect, useState, type FormEvent } from 'react'
import { clearParentSessionStorage, readParentCode, saveParentSession, type ParentSession } from '@/components/auth/ParentSessionBridge'

function normalizeCode(value: string) {
  return value.replace(/[^\d]/g, '').slice(0, 6)
}

export function ParentLoginPanel() {
  const [familyCode, setFamilyCode] = useState('')
  const [message, setMessage] = useState('')
  const [session, setSession] = useState<ParentSession | null>(null)
  const [loading, setLoading] = useState(false)

  async function restoreSession(code?: string) {
    const targetCode = normalizeCode(code || readParentCode())
    if (!targetCode) return

    setLoading(true)

    try {
      const response = await fetch('/api/parent-session?familyCode=' + encodeURIComponent(targetCode), { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (response.ok && data.ok && data.session) {
        saveParentSession(data.session)
        setSession(data.session)
        setFamilyCode(data.session.familyCode)
        setMessage('부모님과 자녀 연결이 유지되어 있습니다.')
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const code = normalizeCode(familyCode)

    if (!/^\d{6}$/.test(code)) {
      setMessage('6자리 연결코드를 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/parent-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyCode: code })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok || !data.session) {
        setMessage(data.message || '연결코드를 확인하지 못했습니다.')
        return
      }

      saveParentSession(data.session)
      setSession(data.session)
      setMessage('부모님과 자녀 연결이 완료되었습니다.')

      setTimeout(() => {
        window.location.href = '/parent/today'
      }, 300)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '부모님 연결 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function disconnect() {
    try {
      await fetch('/api/parent-session', { method: 'DELETE' })
    } catch {
      // ignore
    }

    clearParentSessionStorage()
    setSession(null)
    setFamilyCode('')
    setMessage('부모님 연결을 해제했습니다.')
  }

  useEffect(() => {
    const code = readParentCode()
    if (code) {
      setFamilyCode(code)
      restoreSession(code)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section className="mx-auto w-full max-w-xl rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-8">
      <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
        부모님 전용 코드입력
      </div>

      <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] text-[#173B36]">
        자녀가 알려준
        <br />
        6자리 코드를 입력하세요.
      </h1>

      <p className="mt-4 text-sm font-bold leading-7 text-[#637B76]">
        이 화면은 부모님 전용입니다. 코드를 입력하면 안부 버튼 화면으로 이동합니다.
      </p>

      {session ? (
        <div className="mt-5 rounded-2xl bg-[#EFFFF9] p-4 text-sm font-black leading-7 text-[#116D5F] ring-1 ring-[#CDEFE5]">
          현재 연결됨: {session.parentName || '부모님'} · 보호자 {session.guardianName || '보호자'} · 코드 {session.familyCode}
        </div>
      ) : null}

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
            onChange={(event) => setFamilyCode(normalizeCode(event.target.value))}
            inputMode="numeric"
            maxLength={6}
            placeholder="예: 123456"
            className="w-full min-w-0 max-w-full box-border rounded-2xl border border-[#D8EEE8] bg-white px-3 py-4 text-center text-3xl font-black tracking-[0.10em] text-[#173B36] outline-none focus:ring-4 focus:ring-[#D6F6EC] sm:px-4 sm:text-4xl sm:tracking-[0.16em]"
          />
        </label>

        <button disabled={loading} className="w-full rounded-2xl bg-[#193B38] px-5 py-4 text-base font-black text-white disabled:bg-[#9FB8B3]">
          {loading ? '확인 중...' : '부모님 안부 화면 들어가기'}
        </button>
      </form>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Link href="/parent/today" className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
          안부 버튼 화면
        </Link>

        <Link href="/parent/consent" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
          안심동의 설정
        </Link>
      </div>

      {session ? (
        <button type="button" onClick={disconnect} className="mt-4 w-full rounded-2xl bg-[#FFF1F1] px-5 py-4 text-sm font-black text-[#8A2525] ring-1 ring-[#F3BBBB]">
          부모님 연결 해제
        </button>
      ) : null}
    </section>
  )
}

export default ParentLoginPanel
