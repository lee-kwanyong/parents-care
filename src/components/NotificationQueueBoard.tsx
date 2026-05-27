'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  buildNotificationSummary,
  labelNotificationChannel,
  labelNotificationPriority,
  labelNotificationStatus,
  type NotificationDeliveryEvent,
  type NotificationOutboxItem,
  type NotificationStatus,
  type NotificationTemplate
} from '@/lib/notification-engine'

export function NotificationQueueBoard({ mode = 'family' }: { mode?: 'family' | 'ops' }) {
  const [notifications, setNotifications] = useState<NotificationOutboxItem[]>([])
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [events, setEvents] = useState<NotificationDeliveryEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/notifications', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '알림 큐를 불러오지 못했습니다.')
      }

      setNotifications(data.notifications || [])
      setTemplates(data.templates || [])
      setEvents(data.events || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '알림 큐를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function generateFromSignals() {
    setMessage('')

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_from_signals' })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '알림 자동 생성 실패')
      }

      setMessage(`알림 후보 ${data.candidates || 0}개 중 ${data.inserted || 0}개를 새로 만들었습니다.`)
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '알림 자동 생성 실패')
    }
  }

  async function createNotification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const form = event.currentTarget
    const formData = new FormData(form)

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_notification',
          elderName: formData.get('elderName'),
          recipientName: formData.get('recipientName'),
          recipientPhone: formData.get('recipientPhone'),
          recipientRole: formData.get('recipientRole'),
          channel: formData.get('channel'),
          priority: formData.get('priority'),
          templateCode: formData.get('templateCode'),
          title: formData.get('title'),
          body: formData.get('body'),
          meetingCode: formData.get('meetingCode')
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '알림 생성 실패')
      }

      setMessage('알림이 생성됐습니다.')
      form.reset()
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '알림 생성 실패')
    }
  }

  async function updateNotification(id: string, status: NotificationStatus) {
    setMessage('')

    let failureReason = ''

    if (status === 'failed') {
      failureReason = window.prompt('실패 사유를 입력해주세요.', '수동 실패 처리') || '수동 실패 처리'
    }

    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          failureReason,
          provider: 'manual'
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '알림 상태 변경 실패')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '알림 상태 변경 실패')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const summary = useMemo(() => buildNotificationSummary(notifications), [notifications])

  const eventsByNotification = useMemo(() => {
    const map = new Map<string, NotificationDeliveryEvent[]>()

    for (const event of events) {
      if (!event.notification_outbox_id) continue
      const current = map.get(event.notification_outbox_id) || []
      current.push(event)
      map.set(event.notification_outbox_id, current)
    }

    return map
  }, [events])

  return (
    <div>
      <section
        className={
          'rounded-3xl p-6 shadow-sm ' +
          (summary.reassuranceState === '긴급'
            ? 'bg-red-50'
            : summary.reassuranceState === '확인 필요'
              ? 'bg-amber-50'
              : 'bg-emerald-50')
        }
      >
        <p className="text-sm font-black text-[#63807C]">알림 큐 안심판</p>
        <h2 className="mt-2 text-5xl font-black">{summary.reassuranceState}</h2>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <Stat label="전체" value={summary.total} />
          <Stat label="대기" value={summary.queued} />
          <Stat label="긴급" value={summary.urgent} />
          <Stat label="실패" value={summary.failed} />
          <Stat label="발송 완료" value={summary.sent} />
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">운영실이 할 일</h2>
        <div className="mt-4 space-y-3">
          {summary.opsNextActions.map((action, index) => (
            <div key={action} className="rounded-2xl bg-slate-50 p-4 text-lg font-black">
              {index + 1}. {action}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={load} className="rounded-2xl bg-[#5F7C92] px-5 py-4 font-black text-[#2E504D]">
          새로고침
        </button>

        {mode === 'ops' ? (
          <button onClick={generateFromSignals} className="rounded-2xl bg-[#8CCFC3] px-5 py-4 font-black text-[#2E504D]">
            현재 상태에서 알림 자동 생성
          </button>
        ) : null}
      </div>

      {message ? (
        <p className="mt-5 rounded-2xl bg-blue-50 p-4 font-bold text-blue-900">
          {message}
        </p>
      ) : null}

      {mode === 'ops' ? (
        <form onSubmit={createNotification} className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">수동 알림 만들기</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <input name="elderName" className="rounded-2xl border border-[#E0EFEC] p-4" placeholder="부모님" defaultValue="어머니" />
            <input name="recipientName" className="rounded-2xl border border-[#E0EFEC] p-4" placeholder="받는 사람" />
            <input name="recipientPhone" className="rounded-2xl border border-[#E0EFEC] p-4" placeholder="010-1234-5678" />

            <select name="recipientRole" className="rounded-2xl border border-[#E0EFEC] p-4">
              <option value="guardian">보호자</option>
              <option value="parent">부모님</option>
              <option value="manager">매니저</option>
              <option value="ops">운영실</option>
              <option value="family">가족</option>
            </select>

            <select name="channel" className="rounded-2xl border border-[#E0EFEC] p-4">
              <option value="app">앱</option>
              <option value="kakao">카카오 알림톡</option>
              <option value="sms">문자</option>
              <option value="phone">전화</option>
              <option value="push">푸시</option>
            </select>

            <select name="priority" className="rounded-2xl border border-[#E0EFEC] p-4">
              <option value="normal">보통</option>
              <option value="high">중요</option>
              <option value="urgent">긴급</option>
              <option value="low">낮음</option>
            </select>

            <select name="templateCode" className="rounded-2xl border border-[#E0EFEC] p-4 md:col-span-2">
              {templates.length === 0 ? (
                <option value="general">일반 알림</option>
              ) : (
                templates.map((template) => (
                  <option key={template.template_code} value={template.template_code}>
                    {template.title}
                  </option>
                ))
              )}
            </select>

            <input name="meetingCode" className="rounded-2xl border border-[#E0EFEC] p-4" placeholder="만남 암호 예: 462015" />
          </div>

          <input name="title" className="mt-4 w-full rounded-2xl border border-[#E0EFEC] p-4" placeholder="제목. 비워두면 템플릿 제목 사용" />

          <textarea name="body" rows={4} className="mt-4 w-full rounded-2xl border border-[#E0EFEC] p-4" placeholder="내용. 비워두면 템플릿 문구 사용" />

          <button className="mt-4 w-full rounded-3xl bg-[#8CCFC3] px-6 py-5 text-xl font-black text-[#2E504D]">
            알림 만들기
          </button>
        </form>
      ) : null}

      <section className="mt-8 space-y-4">
        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center font-black shadow-sm">
            알림 큐를 불러오는 중...
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="text-xl font-black">아직 알림이 없습니다.</div>
            {mode === 'ops' ? <p className="mt-2 text-[#7A9692]">현재 상태에서 알림 자동 생성을 눌러보세요.</p> : null}
          </div>
        ) : (
          notifications.map((item) => {
            const itemEvents = eventsByNotification.get(item.id) || []

            return (
              <article key={item.id} className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge text={labelNotificationChannel(item.channel)} />
                      <Badge text={labelNotificationStatus(item.status)} />
                      <Badge text={labelNotificationPriority(item.priority)} />
                      <Badge text={item.template_code} />
                    </div>

                    <h3 className="mt-3 text-2xl font-black">{item.title}</h3>
                    <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-[#4E6D69]">{item.body}</p>

                    <p className="mt-3 text-sm text-[#7A9692]">
                      대상: {item.elder_name} · 받는 사람: {item.recipient_name || '미입력'} · {item.recipient_phone || '연락처 미입력'}
                    </p>

                    {item.failure_reason ? (
                      <p className="mt-3 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
                        실패 사유: {item.failure_reason}
                      </p>
                    ) : null}

                    {itemEvents.length > 0 ? (
                      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                        <h4 className="font-black">처리 기록</h4>
                        <div className="mt-2 space-y-2">
                          {itemEvents.slice(0, 5).map((event) => (
                            <div key={event.id} className="rounded-xl bg-white p-3 text-sm">
                              <div className="font-black">{event.title}</div>
                              {event.description ? <p className="mt-1 text-[#63807C]">{event.description}</p> : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {mode === 'ops' ? (
                    <div className="grid min-w-[170px] gap-2">
                      <button onClick={() => updateNotification(item.id, 'ready')} className="rounded-2xl bg-slate-100 px-4 py-3 font-black">
                        발송 준비
                      </button>
                      <button onClick={() => updateNotification(item.id, 'sent')} className="rounded-2xl bg-[#8CCFC3] px-4 py-3 font-black text-[#2E504D]">
                        발송 완료
                      </button>
                      <button onClick={() => updateNotification(item.id, 'failed')} className="rounded-2xl bg-red-50 px-4 py-3 font-black text-red-700">
                        실패
                      </button>
                      <button onClick={() => updateNotification(item.id, 'queued')} className="rounded-2xl bg-blue-50 px-4 py-3 font-black text-blue-900">
                        재대기
                      </button>
                      <button onClick={() => updateNotification(item.id, 'cancelled')} className="rounded-2xl bg-slate-100 px-4 py-3 font-black">
                        취소
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            )
          })
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="text-sm font-black text-[#7A9692]">{label}</div>
      <div className="mt-1 text-3xl font-black">{value}</div>
    </div>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-[#4E6D69]">
      {text}
    </span>
  )
}
