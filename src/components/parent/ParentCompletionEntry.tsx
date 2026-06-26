'use client'

import { useEffect, useState } from 'react'

type Signal = 'ok' | 'uncomfortable' | 'help'

function initialFamilyCode() {
  if (typeof window === 'undefined') return ''

  const params = new URLSearchParams(window.location.search)

  return (
    params.get('familyCode') ||
    window.localStorage.getItem('anbu-parent-family-code') ||
    window.localStorage.getItem('anbu-guardian-family-code') ||
    ''
  )
}

export function ParentCompletionEntry() {
  const [familyCode, setFamilyCode] = useState('')
  const [saving, setSaving] = useState<Signal | ''>('')
  const [message, setMessage] = useState('')
  const [lastSignal, setLastSignal] = useState<Signal | ''>('')

  useEffect(() => {
    const code = initialFamilyCode()
    setFamilyCode(code)

    if (code && typeof window !== 'undefined') {
      window.localStorage.setItem('anbu-parent-family-code', code)
    }
  }, [])

  async function submit(signal: Signal) {
    const clean = familyCode.trim()

    if (!clean) {
      setMessage('가족코드를 먼저 입력해주세요.')
      return
    }

    if (signal === 'help') {
      const confirmed = window.confirm(
        '보호자에게 도움 요청을 보낼까요? 응급상황이면 이 화면보다 먼저 119에 연락해주세요.'
      )
      if (!confirmed) return
    }

    setSaving(signal)
    setMessage('')

    try {
      const response = await fetch('/api/anbu-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          familyCode: clean,
          action: 'parent_signal',
          signal
        })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        throw new Error(result.message || '안부 저장에 실패했습니다.')
      }

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('anbu-parent-family-code', clean)
      }

      setLastSignal(signal)

      if (signal === 'ok') {
        setMessage('오늘 안부가 정상으로 기록되었습니다. 보호자에게는 요약 리포트로 전달됩니다.')
      } else if (signal === 'uncomfortable') {
        setMessage('몸 상태 확인이 필요한 상황으로 기록되었습니다. 보호자가 확인할 수 있습니다.')
      } else {
        setMessage('도움 요청이 기록되었습니다. 보호자가 확인할 수 있습니다.')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '안부 저장에 실패했습니다.')
    } finally {
      setSaving('')
    }
  }

  return (
    <main className="min-h-[100svh] bg-[radial-gradient(circle_at_top_left,#E7FFF7_0%,#F7FFFC_38%,#FFFFFF_80%)] px-4 py-6 text-[#17443F]">
      <section className="mx-auto flex min-h-[calc(100svh-3rem)] max-w-3xl flex-col justify-center">
        <div className="rounded-[2.5rem] bg-white p-6 shadow-[0_24px_80px_rgba(49,151,136,0.12)] ring-1 ring-[#D6EDE7] sm:p-9">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
            안부웍스
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.08em] sm:text-6xl">
            오늘 괜찮으세요?
          </h1>

          <p className="mt-4 text-base font-bold leading-8 text-[#637B76]">
            복잡하게 적지 않아도 됩니다. 하나만 눌러주세요. 확인이 필요한 경우에만 보호자가 확인하고, 결과가 안부완료 리포트에 남습니다.
          </p>

          <div className="mt-7">
            <input
              value={familyCode}
              onChange={(event) => setFamilyCode(event.target.value.replace(/[^\w-]/g, '').slice(0, 64))}
              placeholder="가족코드"
              className="w-full rounded-2xl border border-[#D6EDE7] bg-white px-5 py-4 text-lg font-black text-[#17443F] outline-none focus:border-[#2AA897] focus:ring-4 focus:ring-[#D8FFF3]"
            />
          </div>

          {message ? (
            <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-5 text-base font-black leading-8 text-[#795C22] ring-1 ring-[#F3DEB5]">
              {message}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4">
            <button
              onClick={() => submit('ok')}
              disabled={Boolean(saving)}
              className="min-h-[112px] rounded-[2rem] bg-[#EFFFFA] p-5 text-left text-[#176F62] ring-1 ring-[#BFEBDD] transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              <span className="block text-3xl font-black tracking-[-0.06em]">
                {saving === 'ok' ? '저장 중...' : '괜찮아요'}
              </span>
              <span className="mt-2 block text-sm font-bold leading-7 opacity-80">
                정상 안부로 조용히 기록되고, 보호자에게는 요약 리포트로 전달됩니다.
              </span>
            </button>

            <button
              onClick={() => submit('uncomfortable')}
              disabled={Boolean(saving)}
              className="min-h-[112px] rounded-[2rem] bg-[#FFF9EE] p-5 text-left text-[#795C22] ring-1 ring-[#F3DEB5] transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              <span className="block text-3xl font-black tracking-[-0.06em]">
                {saving === 'uncomfortable' ? '저장 중...' : '조금 불편해요'}
              </span>
              <span className="mt-2 block text-sm font-bold leading-7 opacity-80">
                보호자가 확인할 수 있도록 확인필요 상황으로 남깁니다.
              </span>
            </button>

            <button
              onClick={() => submit('help')}
              disabled={Boolean(saving)}
              className="min-h-[112px] rounded-[2rem] bg-[#FFF1F1] p-5 text-left text-[#8A3030] ring-1 ring-[#F1C7C7] transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              <span className="block text-3xl font-black tracking-[-0.06em]">
                {saving === 'help' ? '저장 중...' : '도움이 필요해요'}
              </span>
              <span className="mt-2 block text-sm font-bold leading-7 opacity-80">
                보호자가 바로 확인해야 하는 도움 요청으로 기록합니다.
              </span>
            </button>
          </div>

          {lastSignal ? (
            <div className="mt-5 rounded-2xl bg-[#F7FFFC] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
              잘못 누르셨다면 보호자에게 알려주세요. 다음 단계에서 “잘못 눌렀어요” 취소 기능을 붙일 예정입니다.
            </div>
          ) : null}

          <div className="mt-5 rounded-2xl bg-white p-4 text-xs font-bold leading-6 text-[#637B76] ring-1 ring-[#EDF6F3]">
            안부웍스는 의료 진단이나 응급구조를 대신하지 않습니다. 응급상황이면 앱보다 먼저 119 또는 의료기관에 연락해주세요.
          </div>
        </div>
      </section>
    </main>
  )
}
