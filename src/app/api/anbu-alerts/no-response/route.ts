import { NextRequest, NextResponse } from 'next/server'
import {
  dispatchNotification,
  supabaseInsert,
  supabasePatch,
  supabaseSelect,
  text
} from '@/lib/anbu-integrations'
import { buildNoResponseSmsAlert } from '@/lib/anbu-alert-templates'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function normalizePhone(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.replace(/[^\d+]/g, '')
}

function checkCronSecret(request: NextRequest) {
  const secret = process.env.CRON_SECRET || ''
  if (!secret) return true

  const authorization = request.headers.get('authorization') || ''
  const bearerToken = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : ''

  const provided =
    bearerToken ||
    request.headers.get('x-cron-secret') ||
    request.nextUrl.searchParams.get('secret') ||
    ''

  return provided === secret
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

async function alreadyAlerted(familyCode: string, sinceIso: string) {
  const result = await supabaseSelect(
    'anbu_notification_outbox?select=id&family_code=eq.' +
      encodeURIComponent(familyCode) +
      '&reason=eq.no-response&created_at=gte.' +
      encodeURIComponent(sinceIso) +
      '&limit=1'
  )

  return result.ok && Array.isArray(result.data) && result.data.length > 0
}

async function hasRecentCheckin(familyCode: string, sinceIso: string) {
  const result = await supabaseSelect(
    'daily_care_checkins?select=id&family_code=eq.' +
      encodeURIComponent(familyCode) +
      '&occurred_at=gte.' +
      encodeURIComponent(sinceIso) +
      '&limit=1'
  )

  return result.ok && Array.isArray(result.data) && result.data.length > 0
}

async function createNoResponseAlert(family: {
  family_code?: string
  parent_name?: string
  guardian_name?: string
  guardian_phone?: string
}) {
  const familyCode = text(family.family_code)
  const guardianPhone = normalizePhone(family.guardian_phone || '')

  if (!familyCode || !guardianPhone) {
    return {
      ok: false,
      skipped: true,
      reason: 'missing_family_code_or_guardian_phone',
      familyCode
    }
  }

  const alert = buildNoResponseSmsAlert(text(family.parent_name) || '부모님', 12)

  const payload = {
    channel: 'sms' as const,
    toName: text(family.guardian_name) || '보호자',
    toPhone: guardianPhone,
    title: alert.title,
    body: alert.body,
    familyCode,
    url: '/child/dashboard',
    reason: 'no-response'
  }

  const outbox = await supabaseInsert('anbu_notification_outbox', {
    channel: 'sms',
    to_name: payload.toName,
    to_phone: payload.toPhone,
    title: payload.title,
    body: payload.body,
    family_code: familyCode,
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

  return {
    ok: nextStatus === 'sent',
    status: nextStatus,
    familyCode,
    outboxId,
    dispatchResult
  }
}

async function handleNoResponse(request: NextRequest) {
  if (!checkCronSecret(request)) {
    return NextResponse.json(
      { ok: false, message: 'Cron Secret이 올바르지 않습니다.' },
      { status: 401 }
    )
  }

  const hours = Number(request.nextUrl.searchParams.get('hours') || '12')
  const sinceIso = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

  const families = await supabaseSelect(
    'anbu_family_links?select=family_code,parent_name,guardian_name,guardian_phone,link_status&link_status=eq.active&limit=300'
  )

  if (!families.ok || !Array.isArray(families.data)) {
    return NextResponse.json({
      ok: false,
      message: '가족 연결 테이블을 불러오지 못했습니다.',
      detail: families.error
    })
  }

  const results = []

  for (const family of families.data as Array<{
    family_code?: string
    parent_name?: string
    guardian_name?: string
    guardian_phone?: string
  }>) {
    const familyCode = text(family.family_code)

    if (!familyCode) {
      results.push({ familyCode, skipped: true, reason: 'no_family_code' })
      continue
    }

    if (await hasRecentCheckin(familyCode, sinceIso)) {
      results.push({ familyCode, skipped: true, reason: 'recent_checkin_exists' })
      continue
    }

    if (await alreadyAlerted(familyCode, sinceIso)) {
      results.push({ familyCode, skipped: true, reason: 'already_alerted' })
      continue
    }

    results.push(await createNoResponseAlert(family))
  }

  return NextResponse.json({
    ok: true,
    hours,
    sinceIso,
    count: results.length,
    results
  })
}

export async function GET(request: NextRequest) {
  return handleNoResponse(request)
}

export async function POST(request: NextRequest) {
  return handleNoResponse(request)
}
