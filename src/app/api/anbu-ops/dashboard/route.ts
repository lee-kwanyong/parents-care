import { NextResponse } from 'next/server'
import { supabaseSelect, text } from '@/lib/anbu-integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Row = Record<string, unknown>

async function safeSelect(label: string, path: string) {
  const result = await supabaseSelect(path)

  if (!result.ok || !Array.isArray(result.data)) {
    return {
      label,
      ok: false,
      rows: [] as Row[],
      error: result.error
    }
  }

  return {
    label,
    ok: true,
    rows: result.data as Row[],
    error: null
  }
}

function isRecent(row: Row, hours = 24) {
  const raw = text(row.created_at) || text(row.occurred_at) || text(row.sent_at)
  if (!raw) return false

  const time = new Date(raw).getTime()
  if (!Number.isFinite(time)) return false

  return Date.now() - time <= hours * 60 * 60 * 1000
}

function count(rows: Row[], predicate: (row: Row) => boolean) {
  return rows.filter(predicate).length
}

function lastRows(rows: Row[], limit = 5) {
  return rows.slice(0, limit)
}

function normalizeStatus(value: unknown) {
  return typeof value === 'string' ? value : ''
}

export async function GET() {
  const [
    familiesResult,
    checkinsResult,
    outboxResult,
    careRequestsResult,
    partnersResult,
    matchesResult,
    reportsResult,
    subscriptionsResult,
    paymentsResult
  ] = await Promise.all([
    safeSelect('families', 'anbu_family_links?select=*&order=created_at.desc&limit=200'),
    safeSelect('checkins', 'daily_care_checkins?select=*&order=created_at.desc&limit=300'),
    safeSelect('outbox', 'anbu_notification_outbox?select=*&order=created_at.desc&limit=300'),
    safeSelect('careRequests', 'anbu_care_requests?select=*&order=created_at.desc&limit=300'),
    safeSelect('partners', 'anbu_care_partner_applications?select=*&order=created_at.desc&limit=300'),
    safeSelect('matches', 'anbu_partner_matches?select=*&order=created_at.desc&limit=300'),
    safeSelect('reports', 'anbu_partner_task_reports?select=*&order=created_at.desc&limit=300'),
    safeSelect('subscriptions', 'anbu_subscriptions?select=*&order=created_at.desc&limit=300'),
    safeSelect('payments', 'anbu_payment_intents?select=*&order=created_at.desc&limit=300')
  ])

  const families = familiesResult.rows
  const checkins = checkinsResult.rows
  const outbox = outboxResult.rows
  const careRequests = careRequestsResult.rows
  const partners = partnersResult.rows
  const matches = matchesResult.rows
  const reports = reportsResult.rows
  const subscriptions = subscriptionsResult.rows
  const payments = paymentsResult.rows

  const riskyCheckins = checkins.filter((row) => {
    const checkType = text(row.check_type)
    const status = text(row.status)
    return checkType === 'emergency' || status === 'needs_help' || status === 'not_done'
  })

  const recentRiskyCheckins = riskyCheckins.filter((row) => isRecent(row, 24))

  const queuedNotifications = outbox.filter((row) =>
    ['queued', 'outbox-only', 'failed'].includes(normalizeStatus(row.status))
  )

  const sentNotifications = outbox.filter((row) => normalizeStatus(row.status) === 'sent')

  const pendingCareRequests = careRequests.filter((row) =>
    ['requested', 'matching', 'assigned'].includes(normalizeStatus(row.status) || 'requested')
  )

  const pendingPartners = partners.filter((row) =>
    ['new', 'reviewing', 'hold'].includes(normalizeStatus(row.verification_status) || 'new')
  )

  const approvedPartners = partners.filter((row) =>
    ['approved', 'active'].includes(normalizeStatus(row.verification_status))
  )

  const reviewReports = reports.filter((row) =>
    ['submitted', 'needs_revision'].includes(normalizeStatus(row.report_status) || 'submitted')
  )

  const qualityRiskReports = reports.filter((row) =>
    ['block', 'warning'].includes(normalizeStatus(row.quality_status))
  )

  const activeSubscriptions = subscriptions.filter((row) =>
    ['trial', 'trialing', 'active', 'paid'].includes(normalizeStatus(row.status))
  )

  const readyPayments = payments.filter((row) =>
    ['ready', 'confirm_failed', 'pending'].includes(normalizeStatus(row.status))
  )

  const cards = [
    {
      key: 'families',
      label: '연결된 가족',
      value: families.length,
      help: '부모님-보호자 연결',
      href: '/family-link'
    },
    {
      key: 'risk',
      label: '24시간 위험 신호',
      value: recentRiskyCheckins.length,
      help: '도움 요청, 복약/식사 미확인',
      href: '/child/dashboard'
    },
    {
      key: 'careRequests',
      label: '대기 케어 요청',
      value: pendingCareRequests.length,
      help: '보호자 케어 요청',
      href: '/ops/care-requests'
    },
    {
      key: 'partners',
      label: '검토할 파트너',
      value: pendingPartners.length,
      help: `승인 파트너 ${approvedPartners.length}명`,
      href: '/ops/partners'
    },
    {
      key: 'reports',
      label: '검수할 리포트',
      value: reviewReports.length,
      help: `품질주의 ${qualityRiskReports.length}건`,
      href: '/ops/care-reports-review'
    },
    {
      key: 'outbox',
      label: '알림 발송함 대기',
      value: queuedNotifications.length,
      help: `발송완료 ${sentNotifications.length}건`,
      href: '/ops/outbox'
    },
    {
      key: 'subscriptions',
      label: '활성 구독/체험',
      value: activeSubscriptions.length,
      help: '주간 리포트 접근 가능',
      href: '/ops/subscriptions'
    },
    {
      key: 'payments',
      label: '결제 확인 필요',
      value: readyPayments.length,
      help: 'Toss 사업자 이후 연결',
      href: '/billing'
    }
  ]

  const queues = [
    {
      key: 'risk',
      title: '최근 위험 안부 신호',
      href: '/child/dashboard',
      empty: '최근 위험 신호가 없습니다.',
      items: lastRows(recentRiskyCheckins, 5).map((row) => ({
        title: `${text(row.elder_name) || '부모님'} · ${text(row.care_label) || text(row.check_type) || '안부'}`,
        desc: `${text(row.status) || '-'} · ${text(row.memo) || '메모 없음'}`,
        time: text(row.occurred_at) || text(row.created_at)
      }))
    },
    {
      key: 'careRequests',
      title: '최근 케어 요청',
      href: '/ops/care-requests',
      empty: '최근 케어 요청이 없습니다.',
      items: lastRows(careRequests, 5).map((row) => ({
        title: `${text(row.parent_name) || '부모님'} · ${text(row.request_type) || '요청'}`,
        desc: `${text(row.region) || '-'} · ${text(row.status) || 'requested'} · ${text(row.details) || ''}`,
        time: text(row.created_at)
      }))
    },
    {
      key: 'partners',
      title: '최근 케어파트너 신청',
      href: '/ops/partners',
      empty: '최근 파트너 신청이 없습니다.',
      items: lastRows(partners, 5).map((row) => ({
        title: `${text(row.applicant_name) || '신청자'} · ${text(row.region) || '-'}`,
        desc: `${text(row.verification_status) || 'new'} · ${text(row.phone) || '-'}`,
        time: text(row.created_at)
      }))
    },
    {
      key: 'reports',
      title: '리포트 검수 대기',
      href: '/ops/care-reports-review',
      empty: '검수 대기 리포트가 없습니다.',
      items: lastRows(reviewReports, 5).map((row) => ({
        title: `${text(row.report_status) || 'submitted'} · 품질 ${text(row.quality_status) || 'unchecked'}`,
        desc: `${text(row.service_summary) || text(row.guardian_message) || '리포트 내용 없음'}`,
        time: text(row.created_at)
      }))
    },
    {
      key: 'outbox',
      title: '알림 발송함',
      href: '/ops/outbox',
      empty: '대기 중인 알림이 없습니다.',
      items: lastRows(queuedNotifications, 5).map((row) => ({
        title: `${text(row.channel).toUpperCase() || '알림'} · ${text(row.title) || '제목 없음'}`,
        desc: `${text(row.status) || '-'} · ${text(row.to_phone) || text(row.to_email) || '-'}`,
        time: text(row.created_at)
      }))
    }
  ]

  const shortcuts = [
    { label: '부모님 연결', href: '/family-link', desc: '6자리 연결코드 생성' },
    { label: '보호자 대시보드', href: '/child/dashboard', desc: '오늘 안부 상태' },
    { label: '주간 리포트', href: '/child/weekly-report', desc: '최근 7일 요약' },
    { label: '케어 요청', href: '/care-matching', desc: '보호자 요청 생성' },
    { label: '파트너 신청', href: '/care-partner/apply', desc: '요양보호사·동행 파트너' },
    { label: '파트너 업무', href: '/partner/tasks', desc: '업무 리포트 작성' },
    { label: '케어 리포트', href: '/child/care-reports', desc: '보호자 공개 리포트' },
    { label: '리포트 가이드', href: '/care-partner/report-guide', desc: '작성 기준' },
    { label: '구독 관리', href: '/subscription', desc: '체험·리포트 접근' },
    { label: '알림톡 템플릿', href: '/ops/kakao-templates', desc: '카카오 심사 문구' }
  ]

  const diagnostics = [
    familiesResult,
    checkinsResult,
    outboxResult,
    careRequestsResult,
    partnersResult,
    matchesResult,
    reportsResult,
    subscriptionsResult,
    paymentsResult
  ].map((result) => ({
    label: result.label,
    ok: result.ok,
    count: result.rows.length,
    error: result.error
  }))

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    cards,
    queues,
    shortcuts,
    diagnostics,
    rawCounts: {
      families: families.length,
      checkins: checkins.length,
      riskyCheckins: riskyCheckins.length,
      recentRiskyCheckins: recentRiskyCheckins.length,
      notifications: outbox.length,
      queuedNotifications: queuedNotifications.length,
      sentNotifications: sentNotifications.length,
      careRequests: careRequests.length,
      pendingCareRequests: pendingCareRequests.length,
      partners: partners.length,
      pendingPartners: pendingPartners.length,
      approvedPartners: approvedPartners.length,
      matches: matches.length,
      reports: reports.length,
      reviewReports: reviewReports.length,
      qualityRiskReports: qualityRiskReports.length,
      subscriptions: subscriptions.length,
      activeSubscriptions: activeSubscriptions.length,
      payments: payments.length,
      readyPayments: readyPayments.length
    }
  })
}
