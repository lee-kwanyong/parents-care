
import { NextRequest, NextResponse } from 'next/server'
import { normalizeChannel, normalizeWorry, recommendCarePack } from '@/lib/worry-care-engine'

export const dynamic = 'force-dynamic'

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

async function supabaseInsert(table: string, rows: unknown[]) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return { ok: false, demo: true, rows: [] as any[], error: 'Supabase env is missing' }
  }

  const response = await fetch(base + '/rest/v1/' + table, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(rows)
  })

  const bodyText = await response.text()
  let parsed: any = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  if (!response.ok) {
    return { ok: false, demo: false, rows: [] as any[], error: parsed || bodyText }
  }

  return { ok: true, demo: false, rows: Array.isArray(parsed) ? parsed : [] as any[], error: null }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))

    const worry = normalizeWorry(body.worry)
    const channel = normalizeChannel(body.channel)
    const memo = text(body.memo)
    const contactName = text(body.contactName)
    const contactPhone = text(body.contactPhone)
    const socialCareRequested = Boolean(body.socialCareRequested)

    if (memo.length < 2) {
      return NextResponse.json(
        { ok: false, message: '걱정 내용을 조금만 더 입력해주세요.' },
        { status: 400 }
      )
    }

    const recommendation = recommendCarePack(worry, memo)
    const summary =
      '비로그인 안심케어 접수: ' +
      recommendation.title +
      ' / 연락: ' +
      (contactName || '이름 미입력') +
      ' ' +
      (contactPhone || '연락처 미입력')

    const insert = await supabaseInsert('care_intake_entries', [
      {
        intake_channel: channel,
        raw_text: memo,
        resolved_worry: recommendation.worry,
        recommended_pack_code: recommendation.packCode,
        ai_summary: summary,
        ops_status: 'new',
        social_care_requested: socialCareRequested,
        contact_name: contactName || null,
        contact_phone: contactPhone || null,
        preferred_response_channel: channel === 'kakao' ? 'kakao' : 'phone',
        easy_mode_used: true
      }
    ])

    if (!insert.ok && !insert.demo) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Supabase 저장 중 오류가 발생했습니다.',
          detail: insert.error
        },
        { status: 500 }
      )
    }

    const saved = insert.rows[0] || {
      id: 'demo-' + crypto.randomUUID(),
      created_at: new Date().toISOString()
    }

    if (!insert.demo && saved.id) {
      await supabaseInsert('care_orchestration_events', [
        {
          care_intake_entry_id: saved.id,
          event_type: 'guest_worry_request_created',
          title: '비로그인 보호자 안심케어 접수',
          description: recommendation.title,
          actor_role: 'family',
          severity: worry === 'emergency' ? 'urgent' : 'info'
        }
      ])

      await supabaseInsert('notification_outbox', [
        {
          channel: 'app',
          template_code: 'guest_worry_request_received',
          title: '부모님 안심케어 접수 완료',
          body: '운영실이 확인 후 해결 플랜으로 정리합니다.',
          payload: {
            intake_id: saved.id,
            worry,
            pack_code: recommendation.packCode,
            login_deferred: true
          },
          status: 'queued'
        }
      ])
    }

    return NextResponse.json({
      ok: true,
      demo: insert.demo,
      intakeId: saved.id,
      recommendedPackCode: recommendation.packCode,
      recommendation
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: '안심케어 접수 처리 중 오류가 발생했습니다.',
        detail: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
