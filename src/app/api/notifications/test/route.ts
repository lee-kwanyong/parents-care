import { NextRequest, NextResponse } from 'next/server'
import { dispatchNotification } from '@/lib/anbu-notification-service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const adminCode = text(body.adminCode)
  const expectedCode = process.env.ANBU_ADMIN_CODE || process.env.PARENTS_CARE_ADMIN_CODE || ''

  if (!expectedCode) {
    return NextResponse.json(
      {
        ok: false,
        message: 'ANBU_ADMIN_CODE 또는 PARENTS_CARE_ADMIN_CODE 환경변수가 필요합니다.'
      },
      { status: 500 }
    )
  }

  if (adminCode !== expectedCode) {
    return NextResponse.json(
      {
        ok: false,
        message: '관리자 코드가 올바르지 않습니다.'
      },
      { status: 401 }
    )
  }

  const to = text(body.to)
  const channel = text(body.channel) === 'alimtalk' ? 'alimtalk' : 'sms'
  const message =
    text(body.message) ||
    '[안부웍스] 알림 테스트입니다. 부모님 안부 확인 알림이 정상적으로 준비되었습니다.'

  const result = await dispatchNotification({
    familyCode: text(body.familyCode) || undefined,
    channel,
    eventType: 'manual_test',
    recipient: to,
    title: '안부웍스 알림 테스트',
    message,
    payload: {
      manual: true,
      createdFrom: '/setup/notifications'
    }
  })

  return NextResponse.json({
    ok: result.ok,
    result
  })
}
