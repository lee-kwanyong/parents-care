import { NextResponse } from 'next/server'
import { getIntegrationStatuses } from '@/lib/anbu-integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({
    ok: true,
    statuses: getIntegrationStatuses()
  })
}
