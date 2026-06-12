import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type AnyRow = Record<string, any>

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

async function rest(path: string, init?: RequestInit) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      status: 500,
      data: null as any,
      error: 'Supabase 환경변수가 없습니다.'
    }
  }

  const response = await fetch(base + '/rest/v1/' + path, {
    ...init,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    },
    cache: 'no-store'
  })

  const bodyText = await response.text()
  let parsed: any = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      data: parsed,
      error: parsed || bodyText || response.statusText
    }
  }

  return {
    ok: true,
    status: response.status,
    data: parsed,
    error: null
  }
}

function rows(result: { ok: boolean; data: any }) {
  return result.ok && Array.isArray(result.data) ? result.data : []
}

function won(value: number) {
  return Math.max(0, Math.round(Number(value || 0)))
}

function dateValue(item: AnyRow) {
  return (
    item.created_at ||
    item.updated_at ||
    item.completed_at ||
    item.assigned_at ||
    item.responded_at ||
    ''
  )
}

function makeEvent(input: {
  type: string
  title: string
  status?: string
  date?: string
  href: string
}) {
  return {
    type: input.type,
    title: input.title,
    status: input.status || '',
    date: input.date || '',
    href: input.href
  }
}

export async function GET() {
  const [
    intakesResult,
    matchingRequestsResult,
    offersResult,
    assignmentsResult,
    applicationsResult,
    managersResult,
    reportsResult,
    earningsResult,
    actionsResult
  ] = await Promise.all([
    rest('care_assisted_intake_requests?select=*&order=created_at.desc&limit=100'),
    rest('care_manager_matching_requests?select=*&order=created_at.desc&limit=100'),
    rest('care_manager_match_offers?select=*&order=created_at.desc&limit=200'),
    rest('manager_field_assignments?select=*&order=created_at.desc&limit=100'),
    rest('care_manager_applications?select=*&order=created_at.desc&limit=100'),
    rest('care_manager_profiles?select=*&order=created_at.desc&limit=100'),
    rest('care_guardian_reports?select=*&order=created_at.desc&limit=100'),
    rest('care_manager_earnings?select=*&order=created_at.desc&limit=200'),
    rest('care_guardian_report_actions?select=*&order=created_at.desc&limit=200')
  ])

  const intakes = rows(intakesResult)
  const matchingRequests = rows(matchingRequestsResult)
  const offers = rows(offersResult)
  const assignments = rows(assignmentsResult)
  const applications = rows(applicationsResult)
  const managers = rows(managersResult)
  const reports = rows(reportsResult)
  const earnings = rows(earningsResult)
  const actions = rows(actionsResult)

  const latestEvents = [
    ...intakes.slice(0, 8).map((item) =>
      makeEvent({
        type: '접수',
        title: item.summary_title || `${item.elder_name || '부모님'} 안심케어 접수`,
        status: item.status,
        date: dateValue(item),
        href: '/admin/ops/intake'
      })
    ),
    ...matchingRequests.slice(0, 8).map((item) =>
      makeEvent({
        type: '매칭',
        title: item.request_title || '매칭 요청',
        status: item.matching_status,
        date: dateValue(item),
        href: '/admin/ops/matching'
      })
    ),
    ...offers.slice(0, 8).map((item) =>
      makeEvent({
        type: '제안',
        title: `${item.manager_name || '매니저'} · ${item.request_snapshot?.request_title || '안심케어 제안'}`,
        status: item.offer_status,
        date: dateValue(item),
        href: '/admin/ops/matching'
      })
    ),
    ...assignments.slice(0, 8).map((item) =>
      makeEvent({
        type: '배정',
        title: item.title || `${item.elder_name || '부모님'} 배정`,
        status: item.status,
        date: dateValue(item),
        href: '/manager'
      })
    ),
    ...reports.slice(0, 8).map((item) =>
      makeEvent({
        type: '리포트',
        title: item.report_title || '보호자 리포트',
        status: item.report_status,
        date: dateValue(item),
        href: '/child/reports'
      })
    ),
    ...applications.slice(0, 8).map((item) =>
      makeEvent({
        type: '매니저',
        title: item.applicant_name || '매니저 지원자',
        status: item.vetting_status || item.application_status,
        date: dateValue(item),
        href: '/admin/ops/managers'
      })
    )
  ]
    .filter((item) => item.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20)

  const expectedEarnings = earnings
    .filter((item) => item.earning_status !== 'paid')
    .reduce((sum, item) => sum + won(item.amount), 0)

  const paidEarnings = earnings
    .filter((item) => item.earning_status === 'paid')
    .reduce((sum, item) => sum + won(item.amount), 0)

  return NextResponse.json({
    ok: true,
    summary: {
      intakes: {
        total: intakes.length,
        received: intakes.filter((item) => item.status === 'received').length,
        reviewing: intakes.filter((item) => item.status === 'reviewing').length,
        matchingRequested: intakes.filter((item) => item.status === 'matching_requested').length,
        highPriority: intakes.filter((item) => item.priority === 'high' || item.priority === 'urgent').length
      },
      matching: {
        total: matchingRequests.length,
        requested: matchingRequests.filter((item) => item.matching_status === 'requested').length,
        candidates: matchingRequests.filter((item) => item.matching_status === 'candidate_generated').length,
        assigned: matchingRequests.filter((item) => item.matching_status === 'assigned').length
      },
      offers: {
        total: offers.length,
        sent: offers.filter((item) => item.offer_status === 'sent').length,
        accepted: offers.filter((item) => item.offer_status === 'accepted').length,
        assigned: offers.filter((item) => item.offer_status === 'assigned').length,
        declined: offers.filter((item) => item.offer_status === 'declined').length
      },
      assignments: {
        total: assignments.length,
        assigned: assignments.filter((item) => item.status === 'assigned').length,
        inProgress: assignments.filter((item) => item.status === 'in_progress').length,
        completed: assignments.filter((item) => item.status === 'completed').length
      },
      managers: {
        applications: applications.length,
        inReview: applications.filter((item) => item.vetting_status === 'in_review').length,
        approved: applications.filter((item) => item.vetting_status === 'approved' || item.application_status === 'approved').length,
        active: managers.filter((item) => item.profile_status === 'active').length,
        matchingEligible: applications.filter((item) => item.matching_eligible).length
      },
      reports: {
        total: reports.length,
        ready: reports.filter((item) => item.report_status === 'ready').length,
        viewed: reports.filter((item) => item.viewed_by_guardian_at).length,
        openActions: actions.filter((item) => item.action_status === 'open').length
      },
      earnings: {
        total: earnings.length,
        expected: expectedEarnings,
        paid: paidEarnings
      }
    },
    latestEvents
  })
}
