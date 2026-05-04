import { NextResponse } from 'next/server'
import { createConsentSignatureDraft } from '@/lib/integrations/signature'
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  return NextResponse.json({ ok: true, signature: createConsentSignatureDraft({ elderName: body.elderName ?? '부모님', scopes: body.scopes ?? ['care_report'] }) })
}
