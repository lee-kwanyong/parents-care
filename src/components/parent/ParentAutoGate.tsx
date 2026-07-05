'use client'

import { useCallback, useEffect, useState } from 'react'
import { readParentSession } from '@/components/auth/ParentSessionBridge'
import { ParentRoutineCheckin } from '@/components/parent/ParentRoutineCheckin'

type AutoData = {
  ok: boolean
  message?: string
  family?: {
    familyCode: string
    parentName: string
    guardianName: string
  }
  profile?: {
    mode: 'simple' | 'standard' | 'intensive'
    label: string
    description: string
  }
  assessment?: {
    key: 'normal' | 'data_insufficient' | 'needs_check'
    tone: 'safe' | 'watch' | 'danger'
    label: string
    title: string
    reason: string
    dataQuality: number
    battery: number | null
    parentExperience: {
      mode: 'passive' | 'quick_check' | 'routine'
      title: string
      description: string
    }
  }
}

type QuickKind = 'ok' | 'feeling_sick' | 'need_help'

function getFamilyCode() {
  if (typeof window === 'undefined') return ''

  const query = new URLSearchParams(window.location.search).get('familyCode') || ''
  if (query) return query

  const session = readParentSession()
  if (session?.familyCode) return session.familyCode

  return (
    window.localStorage.getItem('anbu-parent-family-code') ||
    window.localStorage.getItem('anbu-guardian-family-code') ||
    ''
  )
}

function toneClass(tone?: string) {
  if (tone === 'danger') return 'bg-[#FFF1F1] text-[#8A3030] ring-[#F1C7C7]'
  if (tone === 'watch') return 'bg-[#FFF8E9] text-[#795C22] ring-[#EFD9A8]'
  return 'bg-[#EFFFFA] text-[#176F62] ring-[#BFEBDD]'
}

export function ParentAutoGate() {
  const [familyCode, setFamilyCode] = useState('')
  const [data, setData] = useState<AutoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<QuickKind | ''>('')
  const [message, setMessage] = useState('')
  const [manualRoutine, setManualRoutine] = useState(false)
  const [completed, setCompleted] = useState(false)

  const load = useCallback(async (code: string) => {
    const clean = code.trim()

    if (!clean) {
      window.location.replace('/parent/login')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch(`/api/anbu-auto?familyCode=${encodeURIComponent(clean)}`, {
        cache: 'no-store',
        credentials: 'include'
      })
      const result = await response.json().catch(() => ({})) as AutoData

      if (!response.ok || result.ok === false) {
        throw new Error(result.message || '자동 안부 상태를 불러오지 못했습니다.')
      }

      setData(result)
      setFamilyCode(clean)
      window.localStorage.setItem('anbu-parent-family-code', clean)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '자동 안부 상태를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const code = getFamilyCode()
    setFamilyCode(code)
    void load(code)
  }, [load])

  useEffect(() => {
    if (!familyCode || manualRoutine) return

    const interval = window.setInterval(() => {
      void load(familyCode)
    }, 5 * 60 * 1000)

    return () => window.clearInterval(interval)
  }, [familyCode, load, manualRoutine])

  async function quickCheck(kind: QuickKind) {
    if (!familyCode) return

    if (kind === 'need_help') {
      const confirmed = window.confirm(
        '보호자에게 도움 요청을 보낼까요? 응급상황이면 이 화면보다 먼저 119에 연락해주세요.'
      )
      if (!confirmed) return
    }

    setSaving(kind)
    setMessage('')

    try {
      const response = await fetch('/api/parent-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          familyCode,
          kind,
          note: kind === 'ok'
            ? '안부 자동모드 빠른 확인: 괜찮아요'
            : kind === 'feeling_sick'
              ? '안부 자동모드 빠른 확인: 몸이 불편해요'
              : '안부 자동모드 빠른 확인: 도움이 필요해요',
          checklist: {}
        })
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        throw new Error(result.message || '안부 확인 저장에 실패했습니다.')
      }

      setCompleted(true)
      setMessage(
        kind === 'ok'
          ? '괜찮다고 전달했어요. 이제 아무것도 하지 않으셔도 됩니다.'
          : '보호자에게 확인이 필요하다고 전달했어요.'
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '안부 확인 저장에 실패했습니다.')
    } finally {
      setSaving('')
    }
  }

  if (manualRoutine || data?.assessment?.parentExperience.mode === 'routine') {
    return <ParentRoutineCheckin />
  }

  if (loading) {
    return (
      <main className="min-h-[100svh] bg-[#F7FFFC] px-4 py-8 text-[#17443F]">
        <section className="mx-auto max-w-xl rounded-[2rem] bg-white p-8 text-center ring-1 ring-[#D6EDE7]">
          <div className="text-2xl font-black">오늘 상태를 자동으로 확인하고 있어요.</div>
        </section>
      </main>
    )
  }

  const assessment = data?.assessment
  const experience = assessment?.parentExperience
  const quick = experience?.mode === 'quick_check'

  return (
    <main className="min-h-[100svh] bg-[radial-gradient(circle_at_top_left,#E7FFF7_0%,#F8FFFC_38%,#FFFFFF_76%)] px-4 py-6 text-[#17443F] sm:py-9">
      <section className="mx-auto max-w-2xl space-y-5">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_24px_80px_rgba(49,151,136,0.10)] ring-1 ring-[#D6EDE7] sm:p-9">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#176F62] ring-1 ring-[#BFEBDD]">
            {data?.profile?.label || '안부 자동모드'}
          </div>

          <h1 className="mt-6 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            {completed ? '확인 끝났어요.' : experience?.title || '자동으로 확인 중이에요.'}
          </h1>

          <p className="mt-5 text-base font-bold leading-8 text-[#637B76]">
            {completed
              ? '정상적인 날에는 더 입력하지 않아도 됩니다.'
              : experience?.description || '평소와 다를 때만 다시 여쭤볼게요.'}
          </p>

          <div className={`mt-6 rounded-[2rem] p-5 ring-1 ${toneClass(assessment?.tone)}`}>
            <div className="text-sm font-black opacity-70">현재 확인 결과</div>
            <div className="mt-2 text-3xl font-black tracking-[-0.06em]">
              {assessment?.label || '자동 확인 중'}
            </div>
            <p className="mt-3 text-sm font-bold leading-7 opacity-85">
              {assessment?.reason || '안부리포트 데이터와 오늘 기록을 확인하고 있습니다.'}
            </p>
          </div>

          {message ? (
            <div className="mt-5 rounded-2xl bg-[#FFF8E9] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#EFD9A8]">
              {message}
            </div>
          ) : null}

          {quick && !completed ? (
            <div className="mt-6 grid gap-3">
              <button
                type="button"
                disabled={Boolean(saving)}
                onClick={() => void quickCheck('ok')}
                className="min-h-[88px] rounded-[1.75rem] bg-[#176F62] px-5 py-5 text-2xl font-black text-white disabled:opacity-50"
              >
                {saving === 'ok' ? '전달 중...' : '괜찮아요'}
              </button>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={Boolean(saving)}
                  onClick={() => void quickCheck('feeling_sick')}
                  className="min-h-[76px] rounded-[1.5rem] bg-[#FFF8E9] px-4 py-4 text-lg font-black text-[#795C22] ring-1 ring-[#EFD9A8] disabled:opacity-50"
                >
                  몸이 불편해요
                </button>
                <button
                  type="button"
                  disabled={Boolean(saving)}
                  onClick={() => void quickCheck('need_help')}
                  className="min-h-[76px] rounded-[1.5rem] bg-[#FFF1F1] px-4 py-4 text-lg font-black text-[#8A3030] ring-1 ring-[#F1C7C7] disabled:opacity-50"
                >
                  도움이 필요해요
                </button>
              </div>
            </div>
          ) : null}

          {!quick && !completed ? (
            <div className="mt-6 rounded-[2rem] bg-[#EFFFFA] p-6 text-center text-[#176F62] ring-1 ring-[#BFEBDD]">
              <div className="text-4xl">✓</div>
              <div className="mt-3 text-2xl font-black">오늘은 별도 입력이 없어요.</div>
              <p className="mt-2 text-sm font-bold leading-7 opacity-80">
                평소와 다른 신호가 생기면 그때 버튼으로 간단히 여쭤볼게요.
              </p>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setManualRoutine(true)}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#315E58] ring-1 ring-[#D6EDE7]"
            >
              식사·약 직접 남기기
            </button>
            <button
              type="button"
              onClick={() => void load(familyCode)}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#315E58] ring-1 ring-[#D6EDE7]"
            >
              상태 새로 확인
            </button>
          </div>
        </section>

        <p className="px-3 text-center text-xs font-bold leading-6 text-[#637B76]">
          안부리포트 정보는 의료 진단이 아니라 일상 안부 확인을 돕는 참고 신호입니다. 응급상황은 119에 연락하세요.
        </p>
      </section>
    </main>
  )
}
