'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { defaultParentConsent, parentConsentItems, type ParentConsentSettings } from '@/lib/anbu-consent'

type Message = {
  type: 'ok' | 'warn'
  text: string
}

function normalizeFamilyCode(value: string) {
  return value.replace(/[^\d]/g, '').slice(0, 6)
}

function actionStyle(actionType: string) {
  if (actionType === 'help_needed') return 'bg-[#8A2525] text-white'
  if (actionType === 'call_guardian') return 'bg-[#193B38] text-white'
  return 'bg-white text-[#173B36] ring-1 ring-[#D8EEE8]'
}

export function AnbuParentConsent() {
  const [familyCode, setFamilyCode] = useState('')
  const [parentName, setParentName] = useState('부모님')
  const [consent, setConsent] = useState<ParentConsentSettings>(defaultParentConsent)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<Message | null>(null)
  const [raw, setRaw] = useState<unknown>(null)
  const [showRaw, setShowRaw] = useState(false)

  const canSave = /^\d{6}$/.test(familyCode)

  function updateConsent(key: keyof ParentConsentSettings, value: boolean) {
    setConsent((prev) => ({
      ...prev,
      [key]: value
    }))
  }

  async function load(code?: string) {
    const targetCode = normalizeFamilyCode(code || familyCode)

    if (!targetCode) return

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/anbu-parent-consent?familyCode=' + encodeURIComponent(targetCode), {
        cache: 'no-store'
      })

      const data = await response.json().catch(() => ({}))
      setRaw(data)

      if (data.family?.parent_name) {
        setParentName(data.family.parent_name)
      }

      if (data.consent) {
        setConsent({
          ...defaultParentConsent,
          ...data.consent
        })
      }

      if (data.message) {
        setMessage({ type: 'warn', text: data.message })
      }
    } catch (error) {
      setMessage({
        type: 'warn',
        text: error instanceof Error ? error.message : '안심동의 정보를 불러오지 못했습니다.'
      })
    } finally {
      setLoading(false)
    }
  }

  async function save() {
    setMessage(null)

    if (!canSave) {
      setMessage({ type: 'warn', text: '6자리 가족 연결코드를 입력해주세요.' })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/anbu-parent-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyCode,
          parentName,
          consentSettings: consent
        })
      })

      const data = await response.json().catch(() => ({}))
      setRaw(data)

      if (!response.ok || !data.ok) {
        setMessage({ type: 'warn', text: data.message || '저장에 실패했습니다.' })
        return
      }

      window.localStorage.setItem('anbu_family_code', familyCode)
      window.localStorage.setItem('pc_parent_invite_code', familyCode)

      setMessage({ type: 'ok', text: data.message || '안심동의가 저장되었습니다.' })
    } catch (error) {
      setMessage({
        type: 'warn',
        text: error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.'
      })
    } finally {
      setLoading(false)
    }
  }

  async function recordAction(actionType: string, memo: string) {
    setMessage(null)

    if (!canSave) {
      setMessage({ type: 'warn', text: '먼저 6자리 가족 연결코드를 입력해주세요.' })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/anbu-parent-consent/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyCode,
          parentName,
          actionType,
          memo
        })
      })

      const data = await response.json().catch(() => ({}))
      setRaw(data)

      if (!response.ok || !data.ok) {
        setMessage({ type: 'warn', text: data.message || '기록 저장에 실패했습니다.' })
        return
      }

      setMessage({ type: 'ok', text: data.message || '기록되었습니다.' })
    } catch (error) {
      setMessage({
        type: 'warn',
        text: error instanceof Error ? error.message : '기록 중 오류가 발생했습니다.'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const stored =
      window.localStorage.getItem('anbu_family_code') ||
      window.localStorage.getItem('pc_parent_invite_code') ||
      ''

    const code = normalizeFamilyCode(stored)

    if (code) {
      setFamilyCode(code)
      load(code)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sharedCount = useMemo(
    () => Object.values(consent).filter(Boolean).length,
    [consent]
  )

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            부모님 안심동의 카드
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            감시가 아니라,
            <br />
            부모님이 선택하는 안심 공유입니다.
          </h1>

          <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            자녀에게 어떤 정보를 공유할지 부모님이 직접 선택합니다.
            위치와 사진 공유는 기본으로 꺼져 있으며, 필요한 경우에만 켤 수 있습니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/parent/login"
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
            >
              6자리 접속
            </Link>

            <Link
              href="/parent/today"
              className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
            >
              안부 버튼
            </Link>

            <button
              onClick={() => setShowRaw((value) => !value)}
              className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
            >
              {showRaw ? '원본 숨기기' : '원본 보기'}
            </button>
          </div>
        </section>

        {message ? (
          <section
            className={
              'rounded-2xl p-4 text-sm font-black leading-7 ring-1 ' +
              (message.type === 'ok'
                ? 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
                : 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]')
            }
          >
            {message.text}
          </section>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">연결 정보</h2>

            <div className="mt-5 space-y-4">
              <label className="grid gap-2">
                <span className="text-sm font-black text-[#55736E]">6자리 가족 연결코드</span>
                <input
                  value={familyCode}
                  onChange={(event) => setFamilyCode(normalizeFamilyCode(event.target.value))}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="예: 123456"
                  className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-4 text-center text-3xl font-black tracking-[0.16em] outline-none focus:ring-4 focus:ring-[#D6F6EC]"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-[#55736E]">부모님 표시 이름</span>
                <input
                  value={parentName}
                  onChange={(event) => setParentName(event.target.value)}
                  placeholder="예: 어머니"
                  className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
                />
              </label>

              <div className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
                <div className="text-sm font-black text-[#7A9692]">현재 공유 허용 항목</div>
                <div className="mt-2 text-4xl font-black tracking-[-0.06em] text-[#11977F]">
                  {sharedCount}개
                </div>
                <p className="mt-2 text-sm font-bold leading-6 text-[#637B76]">
                  위치와 사진은 부모님 동의가 있어야 공유됩니다.
                </p>
              </div>

              <button
                onClick={save}
                disabled={loading}
                className="w-full rounded-2xl bg-[#193B38] px-5 py-4 text-base font-black text-white disabled:opacity-60"
              >
                {loading ? '저장 중...' : '안심동의 저장'}
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">자녀에게 공유할 정보</h2>

            <div className="mt-5 grid gap-3">
              {parentConsentItems.map((item) => {
                const key = item.key as keyof ParentConsentSettings
                const checked = consent[key]

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => updateConsent(key, !checked)}
                    className={
                      'rounded-2xl p-4 text-left ring-1 transition ' +
                      (checked
                        ? 'bg-[#EFFFF9] ring-[#CDEFE5]'
                        : 'bg-[#F8FCFB] ring-[#D8EEE8]')
                    }
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black tracking-[-0.04em]">{item.title}</h3>
                          {item.recommended ? (
                            <span className="rounded-full bg-white px-2 py-1 text-[11px] font-black text-[#11977F] ring-1 ring-[#BEEFE3]">
                              권장
                            </span>
                          ) : (
                            <span className="rounded-full bg-white px-2 py-1 text-[11px] font-black text-[#7A9692] ring-1 ring-[#D8EEE8]">
                              선택
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm font-bold leading-6 text-[#637B76]">{item.desc}</p>
                      </div>

                      <span
                        className={
                          'flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition ' +
                          (checked ? 'bg-[#20C5A8]' : 'bg-[#D8EEE8]')
                        }
                      >
                        <span
                          className={
                            'h-6 w-6 rounded-full bg-white transition ' +
                            (checked ? 'translate-x-6' : 'translate-x-0')
                          }
                        />
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        </div>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">오늘 부모님 선택</h2>
          <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
            부모님이 직접 누르는 버튼입니다. 도움 요청이나 전화 요청은 안심루프의 확인 필요 신호로 연결됩니다.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['rest_today', '오늘은 쉬고 싶어요', '오늘은 안부 알림을 줄이고 싶을 때'],
              ['reply_later', '나중에 답할게요', '지금은 바쁘지만 나중에 답할 수 있을 때'],
              ['call_guardian', '자녀에게 전화 요청', '자녀가 전화해줬으면 할 때'],
              ['help_needed', '도움이 필요해요', '빠른 확인이나 도움이 필요할 때']
            ].map(([actionType, label, desc]) => (
              <button
                key={actionType}
                onClick={() => recordAction(actionType, desc)}
                disabled={loading}
                className={'rounded-2xl p-5 text-left font-black shadow-sm disabled:opacity-60 ' + actionStyle(actionType)}
              >
                <div className="text-lg">{label}</div>
                <p className="mt-3 text-sm font-bold leading-6 opacity-80">{desc}</p>
              </button>
            ))}
          </div>
        </section>

        {showRaw ? (
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">원본 데이터</h2>
            <pre className="mt-4 max-h-[30rem] overflow-auto rounded-2xl bg-[#123F38] p-4 text-xs font-bold leading-6 text-[#E7FFF7]">
              {JSON.stringify(raw, null, 2)}
            </pre>
          </section>
        ) : null}
      </section>
    </main>
  )
}
