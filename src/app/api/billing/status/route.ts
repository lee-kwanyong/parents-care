import { NextRequest, NextResponse } from 'next/server'
import { buildBillingStatus } from '@/lib/anbu-plan-access'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const familyCode =
    request.nextUrl.searchParams.get('familyCode') ||
    request.cookies.get('anbu_family_code')?.value ||
    request.cookies.get('pc_parent_invite_code')?.value ||
    ''

  const status = await buildBillingStatus(familyCode)

  return NextResponse.json({
    ok: true,
    ...status
  })
}
