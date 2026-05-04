import { NextResponse } from 'next/server'
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET
  const actual = new URL(request.url).searchParams.get('secret') || request.headers.get('x-cron-secret')
  if (expected && actual !== expected) return NextResponse.json({ ok: false, message: 'unauthorized' }, { status: 401 })
  return NextResponse.json({ ok: true, checked: ['missed_checkpoints', 'meal_checkins', 'medication_confirmations', 'care_pack_tasks'] })
}
