'use client'

import { useState } from 'react'
import { parentDailyCareButtons } from '@/lib/daily-care-engine'
import type { DailyCareStatus, DailyCareType } from '@/lib/daily-care-engine'

export function ParentDailyCareButtons({ elderName = '어머니' }: { elderName?: string }) {
  const [message, setMessage] = useState('')
  const [savingKey, setSavingKey] = useState('')

  async function sendCheckin(input: {
    checkType: DailyCareType
    careLabel: string
    status: DailyCareStatus
    title: string
  }) {
    const key = `${input.checkType}-${input.status}-${input.careLabel}`
    setSavingKey(key)
    setMessage('')

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

      const data = await response.json()

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
    <section className="mt-5 rounded-[2rem] bg-white p-6 shadow-sm">
      <h2 className="text-3xl font-black">오늘 확인</h2>
      <p className="mt-2 text-lg font-bold text-slate-600">
        누르면 자녀와 운영실에서 확인할 수 있어요.
      </p>

      {message ? (
        <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-lg font-black text-emerald-900">
          {message}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3">
        {parentDailyCareButtons.map((button) => {
          const key = `${button.checkType}-${button.status}-${button.careLabel}`
          const isSaving = savingKey === key
          const danger = button.status === 'needs_help'
          const caution = button.status === 'not_done'

          return (
            <button
              key={key}
              type="button"
              disabled={Boolean(savingKey)}
              onClick={() => sendCheckin(button)}
              className={
                'rounded-3xl px-6 py-5 text-left text-2xl font-black disabled:opacity-60 ' +
                (danger
                  ? 'bg-red-600 text-white'
                  : caution
                    ? 'bg-amber-100 text-amber-950'
                    : 'bg-emerald-100 text-emerald-950')
              }
            >
              {isSaving ? '보내는 중...' : button.title}
              <span className="mt-1 block text-base font-bold opacity-80">
                {button.description}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
