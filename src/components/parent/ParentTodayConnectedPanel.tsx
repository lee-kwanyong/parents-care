'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { readParentSession, type ParentSession } from '@/components/auth/ParentSessionBridge'

type CheckinButton = {
  label: string
  desc: string
  checkType: string
  status: string
  tone: 'good' | 'warn' | 'danger'
}

const buttons: CheckinButton[] = [
  { label: '식사했어요', desc: '오늘 식사를 완료했어요', checkType: 'meal', status: 'done', tone: 'good' },
  { label: '아직 못 먹었어요', desc: '식사 확인이 필요해요', checkType: 'meal', status: 'not_done', tone: 'warn' },
  { label: '약 먹었어요', desc: '약 복용을 완료했어요', checkType: 'medication', status: 'done', tone: 'good' },
  { label: '약을 깜빡했어요', desc: '복약 확인이 필요해요', checkType: 'medication', status: 'not_done', tone: 'warn' },
  { label: '괜찮아요', desc: '오늘 몸 상태가 괜찮아요', checkType: 'condition', status: 'done', tone: 'good' },
  { label: '몸이 불편해요', desc: '보호자 확인이 필요해요', checkType: 'condition', status: 'needs_help', tone: 'warn' },
  { label: '도움이 필요해요', desc: '빠른 확인이 필요해요', checkType: 'emergency', status: 'needs_help', tone: 'danger' }
]

function toneClass(tone: CheckinButton['tone']) {
  if (tone === 'danger') return 'bg-[#8A2525] text-white'
  if (tone === 'warn') return 'bg-[#FFF8E8] text-[#795313] ring-1 ring-[#F4D8A5]'
  return 'bg-[#EFFFF9] text-[#116D5F] ring-1 ring-[#CDEFE5]'
}

export function ParentTodayConnectedPanel() {
  const [session, setSession] = useState<ParentSession | null>(null)
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [lastAction, setLastAction] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = readParentSession()

    if (!stored) {
      window.location.replace('/parent/login')
      return
    }

    setSession(stored)
  }, [])

  async function submit(item: CheckinButton) {
    if (!session?.familyCode) {
      window.location.href = '/parent/login'
      return
    }

    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/parent-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyCode: session.familyCode,
          checkType: item.checkType,
          status: item.status,
          careLabel: item.label,
          memo: item.desc
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '안부 저장에 실패했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setLastAction(item.label)
      setMessage(data.message || `${item.label} 기록이 자녀 리포트에 반영되었습니다.`)
    } catch (error) {
      setMessage('안부 저장에 실패했습니다. 네트워크 또는 배포 상태를 확인해주세요.')
      setDebug(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <main className="min-h-[100svh] bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-8 text-[#173B36]">
        <section className="mx-auto max-w-xl rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-[#D8EEE8]">
          <div className="text-2xl font-black">부모님 연결 확인 중입니다.</div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-[100svh] bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-4xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            부모님 연결 완료
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            오늘 안부를
            <br />
            자녀에게 알려주세요.
          </h1>

          <p className="mt-4 text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            식사, 약, 몸 상태를 누르면 자녀 리포트에 반영됩니다.
          </p>

          <div className="mt-5 rounded-2xl bg-[#EFFFF9] p-4 text-sm font-black leading-7 text-[#116D5F] ring-1 ring-[#CDEFE5]">
            연결됨 · 코드 {session.familyCode} · 보호자 {session.guardianName || '보호자'}
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#123F38] p-4 text-xs font-bold leading-6 text-[#E7FFF7]">
              <summary className="cursor-pointer text-sm font-black">상세 오류 보기</summary>
              <pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          {buttons.map((item) => (
            <button
              key={item.label}
              onClick={() => submit(item)}
              disabled={loading}
              className={'rounded-[1.5rem] p-5 text-left shadow-sm transition disabled:opacity-50 sm:rounded-[2rem] sm:p-6 ' + toneClass(item.tone)}
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
            <p className="mt-3 text-sm font-bold leading-7 text-[#E7FFF7]">
              자녀의 부모님 리포트에 반영됩니다.
            </p>
          </section>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/parent/consent"
            className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
          >
            안심동의
          </Link>

          <Link
            href="/install"
            className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
          >
            홈 화면에 추가
          </Link>
        </div>
      </section>
    </main>
  )
}

export default ParentTodayConnectedPanel
