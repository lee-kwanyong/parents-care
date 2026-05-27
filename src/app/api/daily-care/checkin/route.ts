import { NextRequest, NextResponse } from 'next/server'
import type { DailyCareStatus, DailyCareType } from '@/lib/daily-care-engine'
import {
  dispatchNotification,
  supabaseInsert,
  supabasePatch,
  supabaseSelect,
  text
} from '@/lib/anbu-integrations'
import { buildGuardianSmsAlert } from '@/lib/anbu-alert-templates'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const allowedTypes = new Set(['meal', 'medication', 'condition', 'safe_return', 'emergency'])
const allowedStatuses = new Set(['done', 'not_done', 'needs_help', 'unknown'])

function normalizePhone(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.replace(/[^\d+]/g, '')
}

function getInsertedId(result: Awaited<ReturnType<typeof supabaseInsert>>) {
  if (!result.ok || !Array.isArray(result.data)) return ''
  const row = result.data[0] as { id?: string } | undefined
  return row?.id || ''
}

function statusFromDispatchResult(dispatchResult: unknown) {
  if (
    typeof dispatchResult === 'object' &&
    dispatchResult &&
    'ok' in dispatchResult &&
    (dispatchResult as { ok?: boolean }).ok
  ) {
    return 'sent'
  }

  if (
    typeof dispatchResult === 'object' &&
    dispatchResult &&
    'mode' in dispatchResult &&
    (dispatchResult as { mode?: string }).mode === 'outbox-only'
  ) {
    return 'outbox-only'
  }

  return 'failed'
}

async function findFamily(familyCode: string) {
  if (!familyCode) return null

  const result = await supabaseSelect(
    'anbu_family_links?select=family_code,parent_name,guardian_name,guardian_phone,link_status&family_code=eq.' +
      encodeURIComponent(familyCode) +
      '&limit=1'
  )

  if (!result.ok || !Array.isArray(result.data) || !result.data[0]) {
    return null
  }

  return result.data[0] as {
    family_code?: string
    parent_name?: string
    guardian_name?: string
    guardian_phone?: string
    link_status?: string
  }
}

async function sendGuardianAlert(input: {
  familyCode: string
  parentName: string
  guardianName?: string
  guardianPhone?: string
  checkType: DailyCareType
  careLabel: string
  status: DailyCareStatus
  memo?: string | null
}) {
  const guardianPhone = normalizePhone(input.guardianPhone || '')

  if (!guardianPhone) {
    return {
      ok: false,
      skipped: true,
      reason: 'guardian_phone_missing'
    }
  }

  const alert = buildGuardianSmsAlert({
    parentName: input.parentName,
    checkType: input.checkType,
    careLabel: input.careLabel,
    status: input.status,
    memo: input.memo
  })

  if (!alert.shouldSend) {
    return {
      ok: true,
      skipped: true,
      reason: 'not_risky_status'
    }
  }

  const payload = {
    channel: 'sms' as const,
    toName: input.guardianName || '보호자',
    toPhone: guardianPhone,
    title: alert.title,
    body: alert.body,
    familyCode: input.familyCode,
    url: '/child/dashboard',
    reason: 'parent-risk-checkin'
  }

  const outbox = await supabaseInsert('anbu_notification_outbox', {
    channel: 'sms',
    to_name: payload.toName,
    to_phone: payload.toPhone,
    title: payload.title,
    body: payload.body,
    family_code: input.familyCode || null,
    reason: payload.reason,
    target_url: payload.url,
    status: 'queued',
    payload
  })

  const dispatchResult = await dispatchNotification(payload)
  const nextStatus = statusFromDispatchResult(dispatchResult)
  const outboxId = getInsertedId(outbox)

  if (outboxId) {
    await supabasePatch(
      'anbu_notification_outbox?id=eq.' + encodeURIComponent(outboxId),
      {
        status: nextStatus,
        provider:
          typeof dispatchResult === 'object' &&
          dispatchResult &&
          'mode' in dispatchResult
            ? String((dispatchResult as { mode?: string }).mode || '')
            : 'unknown',
        sent_at: nextStatus === 'sent' ? new Date().toISOString() : null,
        payload: {
          original: payload,
          dispatchResult
        }
      }
    )
  }

  await supabaseInsert('anbu_integration_events', {
    event_type: 'guardian_risk_alert',
    provider:
      typeof dispatchResult === 'object' &&
      dispatchResult &&
      'mode' in dispatchResult
        ? String((dispatchResult as { mode?: string }).mode || '')
        : 'unknown',
    status: nextStatus,
    payload: {
      outboxId,
      notification: payload,
      dispatchResult
    }
  })

  return {
    ok: nextStatus === 'sent',
    status: nextStatus,
    outboxId,
    dispatchResult
  }
}

export async function POST(request: NextRequest) {
  const role = request.cookies.get('pc_role')?.value || request.cookies.get('anbu_role')?.value || ''
  const familyCode =
    request.cookies.get('pc_parent_invite_code')?.value ||
    request.cookies.get('anbu_family_code')?.value ||
    ''

  if (role !== 'parent' || !familyCode) {
    return NextResponse.json(
      {
        ok: false,
        message: '먼저 부모님 연결코드로 접속해주세요.'
      },
      { status: 401 }
    )
  }

  const body = await request.json().catch(() => ({}))

  const checkType = text(body.checkType) as DailyCareType
  const careLabel = text(body.careLabel) || '오늘 확인'
  const status = text(body.status) as DailyCareStatus
  const memo = text(body.memo)

  if (!allowedTypes.has(checkType)) {
    return NextResponse.json({ ok: false, message: 'checkType이 올바르지 않습니다.' }, { status: 400 })
  }

  if (!allowedStatuses.has(status)) {
    return NextResponse.json({ ok: false, message: 'status가 올바르지 않습니다.' }, { status: 400 })
  }

  const family = await findFamily(familyCode)
  const parentName =
    text(family?.parent_name) ||
    text(request.cookies.get('pc_parent_name')?.value) ||
    text(body.elderName) ||
    '부모님'

  const insert = await supabaseInsert('daily_care_checkins', {
    family_code: familyCode,
    elder_name: parentName,
    check_type: checkType,
    care_label: careLabel,
    status,
    actor_role: 'parent',
    source: 'anbuon_parent_big_button',
    memo: memo || null,
    occurred_at: new Date().toISOString()
  })

  if (!insert.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '안부온 확인 저장 중 오류가 발생했습니다.',
        detail: insert.error
      },
      { status: 500 }
    )
  }

  const guardianAlert = await sendGuardianAlert({
    familyCode,
    parentName,
    guardianName: family?.guardian_name,
    guardianPhone: family?.guardian_phone,
    checkType,
    careLabel,
    status,
    memo: memo || null
  })

  return NextResponse.json({
    ok: true,
    checkin: Array.isArray(insert.data) ? insert.data[0] : insert.data,
    guardianAlert
  })
}
