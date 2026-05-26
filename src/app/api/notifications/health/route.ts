import { NextResponse } from 'next/server'
import { checkNotificationTables, notificationEnvStatus } from '@/lib/anbu-notification-service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const tables = await checkNotificationTables().catch((error) => [
    {
      table: 'notification_check',
      ok: false,
      message: error instanceof Error ? error.message : '알림 테이블 확인 실패'
    }
  ])

  const env = notificationEnvStatus()

  return NextResponse.json({
    ok: env.supabase && tables.every((table) => table.ok),
    env,
    tables
  })
}
