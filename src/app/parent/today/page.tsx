'use client'

import { useEffect, useState } from 'react'
import { ParentDailyCareButtons } from '@/components/ParentDailyCareButtons'
import { CareButton } from '@/components/ui/CareButton'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'

type AnyRow = Record<string, any>

function labelStatus(status: string) {
  const map: Record<string, string> = {
    assigned: '방문 예정',
    in_progress: '진행 중',
    completed: '완료',
    cancelled: '취소'
  }

  return map[status] || status || '확인 필요'
}

function formatDate(value: string) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit'
  })
}

export default function ParentTodayPage() {
  const [assignment, setAssignment] = useState<AnyRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/parent-today', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '오늘 안심 화면 정보를 불러오지 못했습니다.')
      }

      setAssignment(result.assignment || null)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '오늘 안심 화면 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const hasAssignment = Boolean(assignment)
  const elderName = assignment?.elder_name || '어머니'
  const managerName = assignment?.manager_name || '안심케어 매니저'
  const managerPhone = assignment?.manager_phone || ''
  const appointmentDate = formatDate(assignment?.appointment_date || '')
  const appointmentTime = assignment?.appointment_time || '시간 협의'
  const meetingLocation = assignment?.meeting_location || '만남 장소는 보호자와 확인합니다'
  const meetingCode = assignment?.meeting_code || '2580'
  const status = labelStatus(assignment?.status || '')

  return (
    <main className="min-h-screen bg-emerald-50 px-5 py-5 text-[#2F4948]">
      <section className="mx-auto max-w-xl space-y-5">
        <CareCard className="p-6" tone="white">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill text="오늘 안심" tone="green" />
            {hasAssignment ? <StatusPill text={status} tone="blue" /> : null}
          </div>

          <h1 className="mt-5 text-5xl font-black leading-tight tracking-tight">
            {hasAssignment ? (
              <>
                오늘은
                <br />
                안심케어 매니저가
                <br />
                오시는 날이에요.
              </>
            ) : (
              <>
                오늘은
                <br />
                안심 확인만
                <br />
                해주세요.
              </>
            )}
          </h1>

          {loading ? (
            <div className="mt-6 rounded-[2rem] bg-[#F4FAF9] p-6 text-xl font-black">
              오늘 일정을 불러오는 중이에요.
            </div>
          ) : null}

          {message ? (
            <div className="mt-6 rounded-[2rem] bg-amber-50 p-6 text-lg font-black text-amber-900">
              {message}
            </div>
          ) : null}

          {hasAssignment ? (
            <>
              <div className="mt-6 rounded-[2rem] bg-[#5F7C92] p-6 text-white">
                <p className="text-lg font-black text-emerald-100">오시는 분</p>
                <div className="mt-2 text-4xl font-black">{managerName}</div>
                <p className="mt-4 text-2xl font-black">
                  {appointmentDate ? `${appointmentDate} ` : ''}
                  {appointmentTime} 방문 예정이에요
                </p>
                <p className="mt-3 text-lg font-black text-emerald-100">
                  {meetingLocation}
                </p>
              </div>

              <div className="mt-5 rounded-[2rem] bg-amber-50 p-6">
                <p className="text-lg font-black text-amber-700">안심 확인 번호</p>
                <div className="mt-2 text-7xl font-black tracking-widest">{meetingCode}</div>
                <p className="mt-3 text-lg font-black text-amber-900">
                  방문하신 분에게 이 번호를 확인하세요.
                </p>
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-[2rem] bg-[#F4FAF9] p-6">
              <p className="text-2xl font-black">
                오늘 예정된 방문 일정은 아직 없어요.
              </p>
              <p className="mt-3 text-lg font-bold leading-7 text-[#63807C]">
                식사, 약, 컨디션만 편하게 눌러주세요. 누른 내용은 자녀와 운영실에서 확인할 수 있어요.
              </p>
            </div>
          )}
        </CareCard>

        <div className="grid gap-3">
          <CareButton href="tel:01012345678" tone="dark" size="xl">
            자녀에게 바로 전화
          </CareButton>

          {managerPhone ? (
            <CareButton href={`tel:${managerPhone}`} tone="white" size="xl">
              매니저에게 전화
            </CareButton>
          ) : null}

          <CareButton href="tel:119" tone="danger" size="xl">
            긴급 도움 요청
          </CareButton>

          <button
            type="button"
            onClick={load}
            className="rounded-3xl bg-white px-6 py-5 text-xl font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
          >
            오늘 일정 다시 확인
          </button>

          <CareButton href="/parent/install" tone="white" size="xl">
            앱처럼 사용하기
          </CareButton>
        </div>

        <ParentDailyCareButtons elderName={elderName} />

        <CareCard tone="blue">
          <h2 className="text-2xl font-black">안심케어 받을 때 참고할 내용</h2>
          <ul className="mt-4 space-y-3 text-xl font-black leading-8">
            <li>천천히 설명드릴게요.</li>
            <li>불편하시면 바로 말씀해주세요.</li>
            <li>약이나 알러지는 자녀분과 함께 확인할게요.</li>
          </ul>
        </CareCard>
      </section>
    </main>
  )
}
