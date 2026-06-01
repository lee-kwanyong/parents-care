'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { readParentCode, saveParentSession } from '@/components/auth/ParentSessionBridge'

type ParentSession = {
  familyCode: string
  parentName?: string
  guardianName?: string
}

type CheckinButton = {
  label: string
  desc: string
  checkType: string
  status: string
  tone: 'normal' | 'good' | 'warn' | 'danger'
}

const buttons: CheckinButton[] = [
  { label: '괜찮아요', desc: '오늘 상태가 평소와 같아요', checkType: 'condition', status: 'done', tone: 'good' },
  { label: '식사했어요', desc: '식사를 완료했어요', checkType: 'meal', status: 'done', tone: 'good' },
  { label: '아직 못 먹었어요', desc: '식사 확인이 필요해요', checkType: 'meal', status: 'not_done', tone: 'warn' },
  { label: '약 먹었어요', desc: '약 복용을 완료했어요', checkType: 'medication', status: 'done', tone: 'good' },
  { label: '약을 깜빡했어요', desc: '복약 확인이 필요해요', checkType: 'medication', status: 'not_done', tone: 'warn' },
  { label: '몸이 불편해요', desc: '보호자 확인이 필요해요', checkType: 'condition', status: 'needs_help', tone: 'warn' },
  { label: '나중에 답할게요', desc: '지금은 바쁘지만 나중에 답할 수 있어요', checkType: 'condition', status: 'done', tone: 'normal' },
  { label: '도움이 필요해요', desc: '빠른 확인이 필요해요', checkType: 'emergency', status: 'needs_help', tone: 'danger' }
]

const symptomOptions = ['머리', '가슴', '배', '허리', '다리', '어지러움', '숨참', '통증', '낙상', '기타']

function normalizeCode(value: string) {
  return value.replace(/[^\d]/g, '').slice(0, 6)
}

function buttonClass(tone: CheckinButton['tone']) {
  if (tone === 'danger') return 'bg-[#8A2525] text-white'
  if (tone === 'warn') return 'bg-[#FFF8E8] text-[#795313] ring-1 ring-[#F4D8A5]'
  if (tone === 'good') return 'bg-[#EFFFF9] text-[#116D5F] ring-1 ring-[#CDEFE5]'
  return 'bg-white text-[#173B36] ring-1 ring-[#D8EEE8]'
}

export function ParentTodayPersistent() {
  const [familyCode, setFamilyCode] = useState('')
  const [session, setSession] = useState<ParentSession | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastAction, setLastAction] = useState('')
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [conditionMemo, setConditionMemo] = useState('')

  const symptomText = useMemo(() => selectedSymptoms.join(', '), [selectedSymptoms])

  function toggleSymptom(symptom: string) {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((item) => item !== symptom)
        : [...prev, symptom]
    )
  }

  async function restore(code?: string) {
    const targetCode = normalizeCode(code || readParentCode())

    if (!targetCode) {
      setSession(null)
      setFamilyCode('')
      setMessage('6자리 연결코드를 입력하면 부모님 안부 버튼을 사용할 수 있습니다.')
      return
    }

    setFamilyCode(targetCode)
    setLoading(true)

    try {
      const response = await fetch('/api/parent-session?familyCode=' + encodeURIComponent(targetCode), { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok || !data.session) {
        setSession(null)
        setMessage(data.message || '부모님 연결을 확인하지 못했습니다.')
        return
      }

      saveParentSession(data.session)
      setSession(data.session)
      setMessage('')
    } catch {
      setSession({ familyCode: targetCode, parentName: '부모님', guardianName: '보호자' })
      setMessage('')
    } finally {
      setLoading(false)
    }
  }

  async function connectInline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

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
      setMessage('부모님과 자녀 연결이 유지되었습니다.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '연결 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function submitCheckin(item: CheckinButton) {
    const code = normalizeCode(session?.familyCode || familyCode || readParentCode())

    if (!/^\d{6}$/.test(code)) {
      setMessage('부모님 연결이 없습니다. 6자리 코드를 다시 입력해주세요.')
      return
    }

    const isCondition = item.checkType === 'condition' || item.checkType === 'emergency'
    const detail = isCondition
      ? [item.desc, symptomText ? `불편한 곳: ${symptomText}` : '', conditionMemo ? `메모: ${conditionMemo}` : ''].filter(Boolean).join(' / ')
      : item.desc

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/parent-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyCode: code, checkType: item.checkType, status: item.status, careLabel: item.label, memo: detail })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '안부 저장에 실패했습니다.')
        return
      }

      if (data.session) {
        saveParentSession(data.session)
        setSession(data.session)
      }

      setLastAction(item.label)
      setMessage(data.message || `${item.label} 기록이 저장되었습니다.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '안부 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    restore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="min-h-[100svh] bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-4xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            부모님 전용 안부 화면
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            오늘 안부를
            <br />
            자녀에게 알려주세요.
          </h1>

          <p className="mt-4 text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            이 화면은 부모님 전용입니다. 6자리 코드로 연결된 보호자에게 오늘 상태가 전달됩니다.
          </p>

          {session ? (
            <div className="mt-5 rounded-2xl bg-[#EFFFF9] p-4 text-sm font-black leading-7 text-[#116D5F] ring-1 ring-[#CDEFE5]">
              연결됨: {session.parentName || '부모님'} · 보호자 {session.guardianName || '보호자'} · 코드 {session.familyCode}
            </div>
          ) : (
            <form onSubmit={connectInline} className="mt-5 rounded-2xl bg-[#FFF8E8] p-4 ring-1 ring-[#F4D8A5]">
              <div className="text-sm font-black text-[#795313]">6자리 코드를 입력해주세요.</div>
              <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]">
                <input
                  value={familyCode}
                  onChange={(event) => setFamilyCode(normalizeCode(event.target.value))}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  className="w-full min-w-0 max-w-full box-border rounded-2xl border border-[#D8EEE8] bg-white px-3 py-4 text-center text-3xl font-black tracking-[0.10em] text-[#173B36] outline-none focus:ring-4 focus:ring-[#D6F6EC] sm:px-4 sm:text-4xl sm:tracking-[0.16em]"
                />
                <button disabled={loading} className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white disabled:opacity-60">
                  연결
                </button>
              </div>
            </form>
          )}

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#F8FCFB] p-4 text-sm font-black leading-7 text-[#4E6D69] ring-1 ring-[#D8EEE8]">
              {message}
            </div>
          ) : null}
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">불편한 곳이 있으면 선택해주세요</h2>
          <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
            “몸이 불편해요” 또는 “도움이 필요해요”를 누를 때 보호자 화면에 같이 반영됩니다.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {symptomOptions.map((symptom) => (
              <button
                key={symptom}
                type="button"
                onClick={() => toggleSymptom(symptom)}
                className={
                  'rounded-full px-4 py-2 text-sm font-black ring-1 ' +
                  (selectedSymptoms.includes(symptom)
                    ? 'bg-[#193B38] text-white ring-[#193B38]'
                    : 'bg-[#F8FCFB] text-[#173B36] ring-[#D8EEE8]')
                }
              >
                {symptom}
              </button>
            ))}
          </div>

          <textarea
            value={conditionMemo}
            onChange={(event) => setConditionMemo(event.target.value)}
            placeholder="예: 허리가 아파요, 어지러워요, 다리에 힘이 없어요"
            className="mt-4 min-h-24 w-full rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
          />
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          {buttons.map((item) => (
            <button
              key={item.label}
              onClick={() => submitCheckin(item)}
              disabled={loading || !session}
              className={'rounded-[1.5rem] p-5 text-left shadow-sm transition disabled:opacity-50 sm:rounded-[2rem] sm:p-6 ' + buttonClass(item.tone)}
            >
              <div className="text-2xl font-black tracking-[-0.05em]">{item.label}</div>
              <p className="mt-2 text-sm font-bold leading-6 opacity-80">{item.desc}</p>
            </button>
          ))}
        </section>

        {lastAction ? (
          <section className="rounded-[2rem] bg-[#123F38] p-5 text-white">
            <div className="text-sm font-black text-[#A7F2E3]">방금 보낸 안부</div>
            <div className="mt-2 text-3xl font-black tracking-[-0.06em]">{lastAction}</div>
            <p className="mt-3 text-sm font-bold leading-7 text-[#E7FFF7]">보호자 부모님 케어 화면에 반영됩니다.</p>
          </section>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/parent/consent" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
            안심동의 설정
          </Link>
          <button onClick={() => restore()} disabled={loading} className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8] disabled:opacity-60">
            연결 새로고침
          </button>
        </div>
      </section>
    </main>
  )
}
