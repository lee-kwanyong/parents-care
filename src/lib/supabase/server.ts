import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !anonKey || url.includes('your-project') || anonKey.includes('your-')) return null
  return { url, anonKey }
}

export async function createServerSupabaseClient() {
  const config = getSupabaseConfig()
  if (!config) return null

  const cookieStore = await cookies()

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            ;(cookieStore as unknown as { set: (name: string, value: string, options?: Record<string, unknown>) => void }).set(name, value, options as Record<string, unknown>)
          })
        } catch {
          // Server Components cannot set cookies. Route Handlers and Server Actions can.
        }
      }
    }
  })
}

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null
  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  return data.user
}
