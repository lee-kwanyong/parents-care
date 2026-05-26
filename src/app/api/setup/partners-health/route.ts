import { NextResponse } from 'next/server'
import { hasSupabaseServerEnv, supabaseRest } from '@/lib/anbu-supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const requiredTables = [
  'anbu_partner_applications',
  'anbu_care_assignments'
]

async function checkTable(table: string) {
  const result = await supabaseRest(table + '?select=id&limit=1')

  return {
    table,
    ok: result.ok,
    status: result.status,
    message: result.ok ? '정상' : String(result.error).slice(0, 300)
  }
}

export async function GET() {
  const tables = await Promise.all(requiredTables.map(checkTable))
  const envOk = hasSupabaseServerEnv()

  return NextResponse.json({
    ok: envOk && tables.every((item) => item.ok),
    env: {
      NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      ANBU_ADMIN_CODE: Boolean(process.env.ANBU_ADMIN_CODE || process.env.PARENTS_CARE_ADMIN_CODE)
    },
    tables
  })
}
