import { firstRow, supabaseRest } from '@/lib/anbu-supabase'
import { anbuPlanDefinitions, getAnbuPlanDefinition } from '@/lib/anbu-plan-definitions'
import type { AnbuPlanId } from '@/lib/anbu-plan-definitions'

type SubscriptionRow = {
  id: string
  family_code?: string | null
  plan_id?: string | null
  plan_name?: string | null
  subscription_status?: string | null
  current_period_start?: string | null
  current_period_end?: string | null
  last_order_id?: string | null
  created_at?: string | null
}

function nowIso() {
  return new Date().toISOString()
}

export function getTodayStartIso() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

function isSubscriptionActive(row: SubscriptionRow) {
  if (row.subscription_status !== 'active') return false
  if (!row.current_period_end) return true
  return new Date(row.current_period_end).getTime() >= Date.now()
}

export async function getCurrentPlanForFamily(familyCode: string) {
  if (!familyCode) {
    return {
      connected: false,
      billingReady: true,
      plan: anbuPlanDefinitions.free,
      subscription: null as SubscriptionRow | null,
      billingError: null as unknown
    }
  }

  const result = await supabaseRest(
    'anbu_subscriptions?select=*&family_code=eq.' +
      encodeURIComponent(familyCode) +
      '&subscription_status=eq.active&order=created_at.desc&limit=20'
  )

  if (!result.ok) {
    return {
      connected: true,
      billingReady: false,
      plan: anbuPlanDefinitions.free,
      subscription: null as SubscriptionRow | null,
      billingError: result.error
    }
  }

  const rows = Array.isArray(result.data) ? (result.data as SubscriptionRow[]) : []
  const active = rows.find(isSubscriptionActive) || null
  const plan = getAnbuPlanDefinition(active?.plan_id)

  return {
    connected: true,
    billingReady: true,
    plan,
    subscription: active,
    billingError: null as unknown
  }
}

export async function getDailyCheckCount(familyCode: string) {
  if (!familyCode) return 0

  const result = await supabaseRest(
    'daily_care_checkins?select=id&family_code=eq.' +
      encodeURIComponent(familyCode) +
      '&occurred_at=gte.' +
      encodeURIComponent(getTodayStartIso())
  )

  if (!result.ok) return 0

  return Array.isArray(result.data) ? result.data.length : 0
}

export async function createFreeTrialSubscription(familyCode: string) {
  const current = await getCurrentPlanForFamily(familyCode)

  if (current.subscription) {
    return {
      ok: true,
      created: false,
      subscription: current.subscription,
      plan: current.plan
    }
  }

  const start = new Date()
  const end = new Date()
  end.setDate(end.getDate() + 14)

  const insert = await supabaseRest('anbu_subscriptions', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        family_code: familyCode,
        plan_id: 'free',
        plan_name: '무료 체험',
        subscription_status: 'active',
        current_period_start: start.toISOString(),
        current_period_end: end.toISOString(),
        last_order_id: null,
        created_at: nowIso(),
        updated_at: nowIso()
      }
    ])
  })

  if (!insert.ok) {
    return {
      ok: false,
      created: false,
      subscription: null,
      plan: anbuPlanDefinitions.free,
      error: insert.error
    }
  }

  return {
    ok: true,
    created: true,
    subscription: firstRow<SubscriptionRow>(insert.data),
    plan: anbuPlanDefinitions.free
  }
}

export async function buildBillingStatus(familyCode: string) {
  const current = await getCurrentPlanForFamily(familyCode)
  const dailyCheckCount = await getDailyCheckCount(familyCode)
  const dailyLimit = current.plan.limits.dailyChecks
  const remainingDailyChecks = Math.max(dailyLimit - dailyCheckCount, 0)

  return {
    connected: Boolean(familyCode),
    familyCode: familyCode || null,
    billingReady: current.billingReady,
    billingError: current.billingError,
    plan: current.plan,
    subscription: current.subscription,
    usage: {
      dailyCheckCount,
      dailyLimit,
      remainingDailyChecks,
      limitReached: dailyCheckCount >= dailyLimit
    },
    access: {
      weeklyReport: current.plan.limits.weeklyReport,
      routines: current.plan.limits.routines,
      partnerPriority: current.plan.limits.partnerPriority,
      assignments: current.plan.limits.assignments,
      opsRequestsPerMonth: current.plan.limits.opsRequestsPerMonth
    }
  }
}

export function planUpgradeTargetFor(requiredPlanId: AnbuPlanId) {
  if (requiredPlanId === 'basic') return '/checkout?plan=basic'
  if (requiredPlanId === 'family') return '/checkout?plan=family'
  if (requiredPlanId === 'plus') return '/checkout?plan=plus'
  return '/pricing'
}
