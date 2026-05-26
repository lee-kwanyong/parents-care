'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'

type AnyRow = Record<string, any>

type NotificationData = {
  intakes: AnyRow[]
  requests: AnyRow[]
  offers: AnyRow[]
  assignments: AnyRow[]
  reports: AnyRow[]
  invites: AnyRow[]
  decisions: AnyRow[]
  warnings: string[]
}

type TemplateItem = {
  id: string
  category: '보호자' | '부모님' | '케어파트너' | '운영실'
  title: string
  subtitle: string
  phone?: string
  body: string
  href?: string
  status?: string
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }

  return ''
}

function formatWon(value: unknown) {
  const number = Number(value || 0)
  if (!number) return '상담 후 안내'
  return `${number.toLocaleString('ko-KR')}원`
}

function formatDate(value: string) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function origin() {
  if (typeof window === 'undefined') return 'https://parents-care.net'
  return window.location.origin
}

function intakeTemplate(intake: AnyRow): TemplateItem {
  const title = intake.summary_title || `${intake.elder_name || '부모님'} 안심케어 접수`
  const guardianName = intake.contact_name || '보호자'
  const phone = intake.contact_phone || ''
  const channel = intake.channel || '상담'
  const body = `[부모님 안심케어]
${guardianName}님, 안심케어 신청이 접수되었습니다.

접수 내용: ${title}
부모님: ${intake.elder_name || '부모님'}
상담 방식: ${channel}
접수 시간: ${formatDate(intake.created_at)}

운영실이 부모님 상황을 확인한 뒤 필요한 케어와 진행 방법을 안내드리겠습니다.

확인하기:
${origin()}/ops/intake`

  return {
    id: `intake-${intake.id}`,
    category: '보호자',
    title: '보호자 접수 완료 안내',
    subtitle: title,
    phone,
    body,
    href: '/ops/intake',
    status: intake.status || 'received'
  }
}

function offerGuardianTemplate(offer: AnyRow): TemplateItem {
  const snapshot = offer.request_snapshot || {}
  const title = snapshot.request_title || '부모님 안심케어'
  const managerName = offer.manager_name || '케어파트너'
  const region = snapshot.region_text || '지역 협의'
  const appointment = snapshot.appointment_time || snapshot.appointment_date || '일정 협의'
  const guardianPhone = snapshot.guardian_phone || ''
  const body = `[부모님 안심케어]
${title} 후보 케어파트너가 추천되었습니다.

케어파트너: ${managerName}
지역: ${region}
일정: ${appointment}
예상 소요: ${offer.estimated_minutes || 90}분
예상 금액 기준: ${formatWon(offer.expected_fee)}

신뢰카드와 추천 이유를 확인한 뒤 진행 여부를 선택해주세요.

확인하기:
${origin()}/child/matching`

  return {
    id: `offer-guardian-${offer.id}`,
    category: '보호자',
    title: '보호자 후보 추천 안내',
    subtitle: `${managerName} · ${title}`,
    phone: guardianPhone,
    body,
    href: '/child/matching',
    status: offer.offer_status || 'sent'
  }
}

function offerManagerTemplate(offer: AnyRow): TemplateItem {
  const snapshot = offer.request_snapshot || {}
  const title = snapshot.request_title || '부모님 안심케어 제안'
  const region = snapshot.region_text || '지역 협의'
  const appointment = snapshot.appointment_time || snapshot.appointment_date || '일정 협의'
  const managerProfileId = offer.manager_profile_id || ''
  const body = `[부모님 안심케어]
새 케어 제안이 도착했습니다.

내용: ${title}
지역: ${region}
일정: ${appointment}
예상 소요: ${offer.estimated_minutes || 90}분
예상 정산: ${formatWon(offer.expected_fee)}

확인 후 수락/거절해주세요.

확인하기:
${origin()}/manager?managerProfileId=${encodeURIComponent(managerProfileId)}`

  return {
    id: `offer-manager-${offer.id}`,
    category: '케어파트너',
    title: '케어파트너 새 제안 안내',
    subtitle: `${offer.manager_name || '케어파트너'} · ${title}`,
    phone: offer.manager_phone || '',
    body,
    href: `/manager?managerProfileId=${encodeURIComponent(managerProfileId)}`,
    status: offer.offer_status || 'sent'
  }
}

function assignmentParentTemplate(assignment: AnyRow): TemplateItem {
  const title = assignment.title || '부모님 안심케어 방문 안내'
  const managerName = assignment.manager_name || '케어파트너'
  const meetingCode = assignment.meeting_code || '2580'
  const time = assignment.appointment_time || '시간 협의'
  const location = assignment.meeting_location || '만남 장소 협의'
  const body = `[부모님 안심케어]
오늘 안심케어 방문 안내입니다.

오시는 분: ${managerName}
일정: ${time}
장소: ${location}
안심 확인 번호: ${meetingCode}

방문하신 분에게 위 번호를 확인해주세요.
긴급상황은 119가 우선입니다.

부모님 화면:
${origin()}/parent/login`

  return {
    id: `assignment-parent-${assignment.id}`,
    category: '부모님',
    title: '부모님 방문 안내',
    subtitle: `${assignment.elder_name || '부모님'} · ${managerName}`,
    phone: assignment.parent_phone || '',
    body,
    href: '/parent/login',
    status: assignment.status || 'assigned'
  }
}

function assignmentGuardianTemplate(assignment: AnyRow): TemplateItem {
  const title = assignment.title || '부모님 안심케어 배정'
  const managerName = assignment.manager_name || '케어파트너'
  const time = assignment.appointment_time || '시간 협의'
  const location = assignment.meeting_location || '만남 장소 협의'
  const body = `[부모님 안심케어]
${title} 배정이 준비되었습니다.

케어파트너: ${managerName}
일정: ${time}
장소: ${location}
안심 확인 번호: ${assignment.meeting_code || '2580'}

부모님 화면에는 방문 안내가 표시됩니다.
진행 후 보호자 리포트가 생성됩니다.

부모님 화면:
${origin()}/parent/today`

  return {
    id: `assignment-guardian-${assignment.id}`,
    category: '보호자',
    title: '보호자 배정 안내',
    subtitle: `${title} · ${managerName}`,
    phone: assignment.guardian_phone || '',
    body,
    href: '/parent/today',
    status: assignment.status || 'assigned'
  }
}

function reportTemplate(report: AnyRow): TemplateItem {
  const title = report.report_title || '보호자 리포트'
  const body = `[부모님 안심케어]
보호자 리포트가 도착했습니다.

리포트: ${title}
부모님: ${report.elder_name || '부모님'}
케어파트너: ${report.manager_name || '케어파트너'}

30초 요약:
${report.summary_30sec || '오늘 안심케어 결과를 확인해주세요.'}

확인하기:
${origin()}/child/reports`

  return {
    id: `report-${report.id}`,
    category: '보호자',
    title: '보호자 리포트 도착 안내',
    subtitle: title,
    phone: report.guardian_phone || '',
    body,
    href: '/child/reports',
    status: report.report_status || 'ready'
  }
}

function inviteTemplate(invite: AnyRow): TemplateItem {
  const code = invite.invite_code || '----'
  const parentName = invite.parent_name || '부모님'
  const body = `[부모님 안심케어]
${parentName} 전용 화면 접속 안내입니다.

아래 주소로 들어가서 6자리 코드를 입력해주세요.

주소:
${origin()}/parent/login

접속코드:
${code}

회원가입 없이 식사, 약, 컨디션, 자녀 전화, 긴급 도움 요청을 큰 버튼으로 사용할 수 있어요.`

  return {
    id: `invite-${invite.id}`,
    category: '부모님',
    title: '부모님 6자리 코드 안내',
    subtitle: `${parentName} · 코드 ${code}`,
    phone: invite.parent_phone || '',
    body,
    href: '/parent/login',
    status: invite.invite_status || 'active'
  }
}

function decisionOpsTemplate(decision: AnyRow): TemplateItem {
  const decisionType = decision.decision_type || ''
  const typeText =
    decisionType === 'confirmed'
      ? '이 케어파트너로 진행'
      : decisionType === 'call_requested'
        ? '전화 상담 요청'
        : decisionType === 'other_requested'
          ? '다른 후보 요청'
          : '보호자 요청'

  const body = `[부모님 안심케어 운영실]
보호자 매칭 확인 요청이 들어왔습니다.

요청 유형: ${typeText}
케어파트너: ${decision.manager_name || '확인 필요'}
상태: ${decision.decision_status || 'received'}
접수 시간: ${formatDate(decision.created_at)}

운영실에서 후속 조치를 진행해주세요.

확인하기:
${origin()}/ops/matching`

  return {
    id: `decision-${decision.id}`,
    category: '운영실',
    title: '운영실 후속 조치 알림',
    subtitle: `${typeText} · ${decision.manager_name || '케어파트너'}`,
    body,
    href: '/ops/matching',
    status: decision.decision_status || 'received'
  }
}

export function OpsNotificationCenter() {
  const [data, setData] = useState<NotificationData>({
    intakes: [],
    requests: [],
    offers: [],
    assignments: [],
    reports: [],
    invites: [],
    decisions: [],
    warnings: []
  })
  const [category, setCategory] = useState<'전체' | TemplateItem['category']>('전체')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const templates = useMemo(() => {
    const items: TemplateItem[] = [
      ...data.intakes.slice(0, 20).map(intakeTemplate),
      ...data.offers.slice(0, 30).flatMap((offer) => [
        offerGuardianTemplate(offer),
        offerManagerTemplate(offer)
      ]),
      ...data.assignments.slice(0, 20).flatMap((assignment) => [
        assignmentParentTemplate(assignment),
        assignmentGuardianTemplate(assignment)
      ]),
      ...data.reports.slice(0, 20).map(reportTemplate),
      ...data.invites.slice(0, 20).map(inviteTemplate),
      ...data.decisions.slice(0, 20).map(decisionOpsTemplate)
    ]

    if (category === '전체') return items

    return items.filter((item) => item.category === category)
  }, [category, data])

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/ops-notifications', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '알림 데이터를 불러오지 못했습니다.')
      }

      setData({
        intakes: result.intakes || [],
        requests: result.requests || [],
        offers: result.offers || [],
        assignments: result.assignments || [],
        reports: result.reports || [],
        invites: result.invites || [],
        decisions: result.decisions || [],
        warnings: result.warnings || []
      })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '알림 데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value)
      setMessage(`${label}를 복사했습니다.`)
    } catch {
      setMessage(value)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const categoryCounts = {
    전체: templates.length,
    보호자: [
      ...data.intakes.map(intakeTemplate),
      ...data.offers.map(offerGuardianTemplate),
      ...data.assignments.map(assignmentGuardianTemplate),
      ...data.reports.map(reportTemplate)
    ].length,
    부모님: [
      ...data.assignments.map(assignmentParentTemplate),
      ...data.invites.map(inviteTemplate)
    ].length,
    케어파트너: data.offers.map(offerManagerTemplate).length,
    운영실: data.decisions.map(decisionOpsTemplate).length
  }

  return (
    <AppFrame title="알림 문구 센터" subtitle="보호자·부모님·케어파트너에게 보낼 안내 문구를 자동으로 만듭니다">
      <section className="space-y-6">
        <CareCard tone="green">
          <div className="flex flex-wrap gap-2">
            <StatusPill text="운영실" tone="green" />
            <StatusPill text="카톡·문자 문구" tone="slate" />
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.05em] md:text-6xl">
            안내 문구를
            <br />
            바로 복사하세요.
          </h1>

          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#4E6D69] md:text-lg">
            실제 문자/카카오 알림톡 API를 붙이기 전까지, 운영실이 바로 복사해서 보호자·부모님·케어파트너에게 보낼 수 있습니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={load}
              className="rounded-3xl bg-white px-5 py-4 font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
            >
              새로고침
            </button>
            <Link
              href="/ops"
              className="rounded-3xl bg-[#193B38] px-5 py-4 font-black text-white"
            >
              운영실 홈
            </Link>
            <Link
              href="/ops/matching"
              className="rounded-3xl bg-white px-5 py-4 font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
            >
              매칭관리
            </Link>
          </div>
        </CareCard>

        {message ? (
          <div className="rounded-2xl bg-[#FFF5DF] p-4 font-black leading-6 text-[#886B35]">
            {message}
          </div>
        ) : null}

        {data.warnings.length ? (
          <div className="rounded-2xl bg-[#FFF9EF] p-4 text-sm font-bold leading-6 text-[#6F5B31] ring-1 ring-[#F0E0C4]">
            {data.warnings.map((warning) => (
              <div key={warning}>• {warning}</div>
            ))}
          </div>
        ) : null}

        {loading ? (
          <CareCard tone="white">
            <p className="text-lg font-black">알림 문구를 불러오는 중...</p>
          </CareCard>
        ) : null}

        <section className="grid gap-3 md:grid-cols-5">
          {(['전체', '보호자', '부모님', '케어파트너', '운영실'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={
                'rounded-2xl p-4 text-left ring-1 transition ' +
                (category === item
                  ? 'bg-[#EAFBF6] text-[#2F756B] ring-[#CBEAE4]'
                  : 'bg-white text-[#24423F] ring-[#E3EFEC]')
              }
            >
              <div className="text-sm font-black">{item}</div>
              <div className="mt-1 text-2xl font-black">{categoryCounts[item]}</div>
            </button>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {templates.length === 0 ? (
            <CareCard tone="white">
              <p className="text-center text-lg font-black text-[#607D79]">
                아직 생성할 안내 문구가 없습니다.
              </p>
            </CareCard>
          ) : (
            templates.map((template) => (
              <CareCard key={template.id} tone="white">
                <div className="flex flex-wrap gap-2">
                  <Badge text={template.category} />
                  {template.status ? <Badge text={template.status} /> : null}
                  {template.phone ? <Badge text={template.phone} /> : null}
                </div>

                <h2 className="mt-4 text-2xl font-black">{template.title}</h2>
                <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
                  {template.subtitle}
                </p>

                <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold leading-6 text-[#24423F] ring-1 ring-[#E3EFEC]">
                  {template.body}
                </pre>

                <div className="mt-4 grid gap-2 md:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => copyText(template.body, template.title)}
                    className="rounded-2xl bg-[#19B99A] px-4 py-3 text-sm font-black text-white"
                  >
                    문구 복사
                  </button>

                  {template.phone ? (
                    <a
                      href={`sms:${template.phone}`}
                      className="rounded-2xl bg-[#193B38] px-4 py-3 text-center text-sm font-black text-white"
                    >
                      문자 열기
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-400"
                    >
                      연락처 없음
                    </button>
                  )}

                  {template.href ? (
                    <Link
                      href={template.href}
                      className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
                    >
                      관련 화면
                    </Link>
                  ) : null}
                </div>
              </CareCard>
            ))
          )}
        </section>
      </section>
    </AppFrame>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-[#F4FAF9] px-3 py-1 text-xs font-black text-[#5B7774] ring-1 ring-[#E2EFEC]">
      {text}
    </span>
  )
}
