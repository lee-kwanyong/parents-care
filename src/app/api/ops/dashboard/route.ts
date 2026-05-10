import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type SafeResult = {
  ok: boolean
  label: string
  data: any[]
  error: unknown | null
}

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

async function rest(path: string) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      data: null as any,
      error: 'Supabase 환경변수가 없습니다.'
    }
  }

  const response = await fetch(base + '/rest/v1/' + path, {
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json'
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
      data: parsed,
      error: parsed || bodyText || response.statusText
    }
  }

  return {
    ok: true,
    data: parsed,
    error: null
  }
}

async function safe(label: string, path: string): Promise<SafeResult> {
  const result = await rest(path)

  return {
    label,
    ok: result.ok,
    data: result.ok && Array.isArray(result.data) ? result.data : [],
    error: result.ok ? null : result.error
  }
}

function isOpenIntake(item: any) {
  const status = item.ops_status || item.status || 'received'
  return ['received', 'open', 'pending', 'processing'].includes(status)
}

function isUrgent(item: any) {
  return item.priority === 'high' || item.priority === 'urgent' || item.social_care_requested === true
}

function isOpenCase(item: any) {
  return !['completed', 'cancelled', 'archived'].includes(item.case_status || 'created')
}

function isPendingVetting(item: any) {
  if (item.matching_eligible === true) return false
  return !['approved', 'rejected'].includes(item.application_status || 'submitted')
}

function isActiveAssignment(item: any) {
  return ['assigned', 'in_progress'].includes(item.status || '')
}

function numberSum(items: any[], key: string) {
  return items.reduce((sum, item) => sum + Number(item[key] || 0), 0)
}

export async function GET() {
  const [
    intakes,
    cases,
    tasks,
    applications,
    profiles,
    offers,
    assignments,
    earnings,
    notifications
  ] = await Promise.all([
    safe(
      '접수함',
      'care_assisted_intake_requests?select=' +
        encodeURIComponent('id,elder_name,contact_name,contact_phone,summary_title,raw_text,status,ops_status,priority,social_care_requested,care_case_id,matching_request_id,created_at') +
        '&order=created_at.desc&limit=30'
    ),
    safe(
      '케어 케이스',
      'care_cases?select=' +
        encodeURIComponent('id,elder_name,guardian_name,guardian_phone,case_title,care_case_type,case_status,priority,matching_request_id,recommended_next_action,created_at') +
        '&order=created_at.desc&limit=30'
    ),
    safe(
      '케어 할 일',
      'care_case_tasks?select=' +
        encodeURIComponent('id,care_case_id,task_title,task_description,task_status,assigned_to_role,sort_order,created_at') +
        '&order=sort_order.asc,created_at.asc&limit=100'
    ),
    safe(
      '매니저 지원자',
      'care_manager_applications?select=' +
        encodeURIComponent('id,applicant_name,applicant_phone,application_status,vetting_status,matching_eligible,created_at') +
        '&order=created_at.desc&limit=30'
    ),
    safe(
      '검증 매니저',
      'care_manager_profiles?select=' +
        encodeURIComponent('id,manager_name,manager_phone,profile_status,identity_verified,trust_level,completed_cases,evaluation_count,created_at') +
        '&order=created_at.desc&limit=30'
    ),
    safe(
      '매니저 제안',
      'care_manager_match_offers?select=' +
        encodeURIComponent('id,matching_request_id,manager_profile_id,manager_name,offer_status,offer_score,expected_fee,request_snapshot,created_at') +
        '&order=created_at.desc&limit=50'
    ),
    safe(
      '현장 배정',
      'manager_field_assignments?select=' +
        encodeURIComponent('id,title,elder_name,manager_name,status,checkin_status,expected_fee,appointment_date,appointment_time,meeting_location,created_at') +
        '&order=created_at.desc&limit=50'
    ),
    safe(
      '정산 예정',
      'care_manager_earnings?select=' +
        encodeURIComponent('id,earning_title,amount,earning_status,payout_due_date,created_at') +
        '&order=created_at.desc&limit=50'
    ),
    safe(
      '알림 큐',
      'notification_outbox?select=' +
        encodeURIComponent('id,title,body,recipient_role,recipient_name,status,priority,created_at') +
        '&order=created_at.desc&limit=50'
    )
  ])

  const intakeItems = intakes.data
  const caseItems = cases.data
  const taskItems = tasks.data
  const applicationItems = applications.data
  const profileItems = profiles.data
  const offerItems = offers.data
  const assignmentItems = assignments.data
  const earningItems = earnings.data
  const notificationItems = notifications.data

  const openIntakes = intakeItems.filter(isOpenIntake)
  const urgentIntakes = intakeItems.filter(isUrgent)
  const openCases = caseItems.filter(isOpenCase)
  const pendingVetting = applicationItems.filter(isPendingVetting)
  const sentOffers = offerItems.filter((item) => item.offer_status === 'sent')
  const acceptedOffers = offerItems.filter((item) => item.offer_status === 'accepted')
  const activeAssignments = assignmentItems.filter(isActiveAssignment)
  const completedAssignments = assignmentItems.filter((item) => item.status === 'completed')
  const expectedEarnings = earningItems.filter((item) => item.earning_status !== 'paid')
  const queuedNotifications = notificationItems.filter((item) => item.status === 'queued')

  const nextActions: Array<{
    title: string
    description: string
    href: string
    priority: 'urgent' | 'high' | 'normal'
  }> = []

  if (urgentIntakes.length > 0) {
    nextActions.push({
      title: '우선 확인 접수가 있습니다',
      description: '공공지원 요청 또는 긴급도가 높은 접수를 먼저 확인하세요.',
      href: '/ops/intake-inbox',
      priority: 'urgent'
    })
  }

  if (openIntakes.length > 0) {
    nextActions.push({
      title: '새 접수를 케어 케이스로 정리하세요',
      description: `${openIntakes.length}건의 접수가 아직 처리 대기 중입니다.`,
      href: '/ops/intake-inbox',
      priority: 'high'
    })
  }

  if (openCases.length > 0) {
    nextActions.push({
      title: '케어 케이스의 다음 할 일을 확인하세요',
      description: `${openCases.length}건의 케어 케이스가 운영 중입니다.`,
      href: '/ops/care-cases',
      priority: 'normal'
    })
  }

  if (pendingVetting.length > 0) {
    nextActions.push({
      title: '매니저 검증을 완료하세요',
      description: `${pendingVetting.length}명의 매니저 지원자가 검증 또는 승인 대기 중입니다.`,
      href: '/ops/manager-vetting',
      priority: 'high'
    })
  }

  if (acceptedOffers.length > 0) {
    nextActions.push({
      title: '수락한 매니저를 배정 확정하세요',
      description: `${acceptedOffers.length}건의 매니저 수락이 있습니다.`,
      href: '/ops/manager-offers',
      priority: 'high'
    })
  }

  if (sentOffers.length > 0) {
    nextActions.push({
      title: '매니저 응답 대기 건을 확인하세요',
      description: `${sentOffers.length}건의 제안이 매니저 응답을 기다립니다.`,
      href: '/ops/manager-offers',
      priority: 'normal'
    })
  }

  if (activeAssignments.length > 0) {
    nextActions.push({
      title: '현장 진행 중인 배정을 확인하세요',
      description: `${activeAssignments.length}건의 현장 배정이 진행 중입니다.`,
      href: '/manager/today',
      priority: 'normal'
    })
  }

  if (nextActions.length === 0) {
    nextActions.push({
      title: '오늘 운영 상태가 안정적입니다',
      description: '새 접수, 검증 대기, 매칭 대기 건이 없습니다.',
      href: '/ops/care-cases',
      priority: 'normal'
    })
  }

  const attentionState =
    urgentIntakes.length > 0
      ? '긴급 확인'
      : openIntakes.length > 0 || pendingVetting.length > 0 || acceptedOffers.length > 0
        ? '확인 필요'
        : '안정'

  const errors = [
    intakes,
    cases,
    tasks,
    applications,
    profiles,
    offers,
    assignments,
    earnings,
    notifications
  ]
    .filter((item) => !item.ok)
    .map((item) => ({
      label: item.label,
      error: item.error
    }))

  return NextResponse.json({
    ok: true,
    attentionState,
    summary: {
      openIntakes: openIntakes.length,
      urgentIntakes: urgentIntakes.length,
      openCases: openCases.length,
      pendingVetting: pendingVetting.length,
      verifiedManagers: profileItems.filter((item) => item.identity_verified && item.profile_status === 'active').length,
      sentOffers: sentOffers.length,
      acceptedOffers: acceptedOffers.length,
      activeAssignments: activeAssignments.length,
      completedAssignments: completedAssignments.length,
      expectedEarningsAmount: numberSum(expectedEarnings, 'amount'),
      queuedNotifications: queuedNotifications.length
    },
    nextActions: nextActions.slice(0, 8),
    recent: {
      intakes: intakeItems.slice(0, 6),
      cases: caseItems.slice(0, 6),
      tasks: taskItems.slice(0, 8),
      applications: applicationItems.slice(0, 6),
      offers: offerItems.slice(0, 8),
      assignments: assignmentItems.slice(0, 8),
      earnings: earningItems.slice(0, 8),
      notifications: notificationItems.slice(0, 8)
    },
    errors
  })
}
