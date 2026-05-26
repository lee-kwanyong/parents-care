'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { parentDailyCareButtons } from '@/lib/daily-care-engine'
import type { DailyCareStatus, DailyCareType } from '@/lib/daily-care-engine'

const groupOrder = ['식사', '약', '몸', '기분', '활동', '도움'] as const

export function ParentDailyCareButtons({ elderName = '부모님' }: { elderName?: string }) {
  const [message, setMessage] = useState('')
  const [savingKey, setSavingKey] = useState('')
  const [loginRequired, setLoginRequired] = useState(false)

  const grouped = useMemo(() => {
    return groupOrder.map((group) => ({
      group,
      buttons: parentDailyCareButtons.filter((button) => button.group === group)
    }))
  }, [])

  async function sendCheckin(input: {
    checkType: DailyCareType
    careLabel: string
    status: DailyCareStatus
    title: string
  }) {
    const key = `${input.checkType}-${input.status}-${input.careLabel}-${input.title}`
    setSavingKey(key)
    setMessage('')
    setLoginRequired(false)

    try {
      const response = await fetch('/api/daily-care/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elderName,
          checkType: input.checkType,
          careLabel: input.careLabel,
          status: input.status,
          memo: input.title
        })
      })

      const data = await response.json().catch(() => ({}))

      if (response.status === 401) {
        setLoginRequired(true)
        throw new Error(data.message || '먼저 부모님 연결코드로 접속해주세요.')
      }

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '저장 중 오류가 발생했습니다.')
      }

      setMessage(`${input.title} 확인을 보냈습니다.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setSavingKey('')
    }
  }

  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-[0_16px_44px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-black text-[#13A88F]">안부온 오늘 체크</p>
        <h2 className="text-3xl font-black tracking-[-0.05em] text-[#173B36] sm:text-4xl">
          버튼만 눌러주세요
        </h2>
        <p className="text-base font-bold leading-7 text-[#637B76]">
          식사, 약, 몸 상태, 기분을 누르면 보호자에게 오늘 안부가 전달됩니다.
        </p>
      </div>

      {message ? (
        <div className="mt-5 rounded-2xl bg-[#E8FAF5] p-4">
          <p className="text-lg font-black text-[#126F61]">
            {message}
          </p>

          {loginRequired ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/parent/login"
                className="rounded-xl bg-[#193B38] px-4 py-2 text-sm font-black text-white"
              >
                부모님 연결코드 입력
              </Link>
              <Link
                href="/family-link"
                className="rounded-xl bg-white px-4 py-2 text-sm font-black text-[#126F61] ring-1 ring-[#CDEFE5]"
              >
                연결 방법 보기
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 space-y-5">
        {grouped.map(({ group, buttons }) => (
          <div key={group}>
            <div className="mb-2 text-sm font-black text-[#55736E]">{group}</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {buttons.map((button) => {
                const key = `${button.checkType}-${button.status}-${button.careLabel}-${button.title}`
                const isSaving = savingKey === key

                const toneClass =
                  button.tone === 'danger'
                    ? 'border-[#F3BBBB] bg-[#FFF1F1] text-[#8A2525]'
                    : button.tone === 'caution'
                      ? 'border-[#F4D8A5] bg-[#FFF8E8] text-[#795313]'
                      : button.tone === 'neutral'
                        ? 'border-[#D8ECE8] bg-[#F7FBFF] text-[#234B68]'
                        : 'border-[#CDEFE5] bg-[#EFFFF9] text-[#116D5F]'

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={Boolean(savingKey)}
                    onClick={() => sendCheckin(button)}
                    className={
                      'min-h-[104px] rounded-[1.5rem] border p-4 text-left shadow-sm transition hover:-translate-y-0.5 disabled:opacity-60 ' +
                      toneClass
                    }
                  >
                    <span className="block text-2xl font-black leading-tight tracking-[-0.04em]">
                      {isSaving ? '보내는 중...' : button.title}
                    </span>
                    <span className="mt-2 block text-sm font-bold leading-6 opacity-80">
                      {button.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
