import { NextResponse } from 'next/server'
import { createHospitalGuide } from '@/lib/integrations/maps'
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  return NextResponse.json({ ok: true, guide: createHospitalGuide({ hospitalName: params.get('hospital') ?? '병원명 미정', department: params.get('department') ?? undefined, region: params.get('region') ?? undefined }) })
}
