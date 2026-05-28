import { NextResponse } from 'next/server'
import { supabaseSelect } from '@/lib/anbu-integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const subscriptions = await supabaseSelect(
    'anbu_subscriptions?select=*&order=created_at.desc&limit=100'
  )

  const families = await supabaseSelect(
    'anbu_family_links?select=family_code,parent_name,guardian_name,guardian_phone,parent_phone,link_status&order=created_at.desc&limit=100'
  )

  return NextResponse.json({
    ok: subscriptions.ok,
    subscriptions: subscriptions.ok && Array.isArray(subscriptions.data) ? subscriptions.data : [],
    families: families.ok && Array.isArray(families.data) ? families.data : [],
    diagnostics: {
      subscriptionsOk: subscriptions.ok,
      subscriptionsError: subscriptions.ok ? null : subscriptions.error,
      familiesOk: families.ok,
      familiesError: families.ok ? null : families.error
    }
  })
}
