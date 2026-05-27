import { NextResponse } from 'next/server'
import { hasSupabaseServerEnv, supabaseRest } from '@/lib/anbu-supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const requiredTables = ['anbu_data_requests']

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

  return NextResponse.json({
    ok: hasSupabaseServerEnv() && tables.every((item) => item.ok),
    env: {
      NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      NEXT_PUBLIC_SUPPORT_EMAIL: Boolean(process.env.NEXT_PUBLIC_SUPPORT_EMAIL)
    },
    tables
  })
}
