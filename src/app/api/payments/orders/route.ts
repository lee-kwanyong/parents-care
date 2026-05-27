import { NextRequest, NextResponse } from 'next/server'
import {
  createAnbuOrderId,
  createCustomerKey,
  getAnbuPaymentPlan
} from '@/lib/anbu-payment-plans'
import {
  requireAdminCode,
  supabaseRest,
  text
} from '@/lib/anbu-supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function rows(data: unknown) {
  return Array.isArray(data) ? data : []
}

function phoneDigits(value: string) {
  return value.replace(/[^\d]/g, '')
}

export async function GET(request: NextRequest) {
  const adminCode = request.nextUrl.searchParams.get('adminCode') || ''
  const familyCodeQuery = request.nextUrl.searchParams.get('familyCode') || ''
  const familyCodeCookie =
    request.cookies.get('anbu_family_code')?.value ||
    request.cookies.get('pc_parent_invite_code')?.value ||
    ''

  if (adminCode) {
    const admin = requireAdminCode(adminCode)

    if (!admin.ok) {
      return NextResponse.json({ ok: false, message: admin.message }, { status: admin.status })
    }

    const result = await supabaseRest(
      'anbu_payment_orders?select=*&order=requested_at.desc&limit=300'
    )

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: '결제 내역을 불러오지 못했습니다.', detail: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, orders: rows(result.data) })
  }

  const familyCode = familyCodeQuery || familyCodeCookie

  if (!familyCode) {
    return NextResponse.json({
      ok: true,
      orders: [],
      subscriptions: [],
      message: '연결된 부모님 코드가 없습니다.'
    })
  }

  const [ordersResult, subscriptionsResult] = await Promise.all([
    supabaseRest(
      'anbu_payment_orders?select=*&family_code=eq.' +
        encodeURIComponent(familyCode) +
        '&order=requested_at.desc&limit=100'
    ),
    supabaseRest(
      'anbu_subscriptions?select=*&family_code=eq.' +
        encodeURIComponent(familyCode) +
        '&order=created_at.desc&limit=30'
    )
  ])

  if (!ordersResult.ok) {
    return NextResponse.json(
      { ok: false, message: '결제 내역을 불러오지 못했습니다.', detail: ordersResult.error },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    orders: rows(ordersResult.data),
    subscriptions: subscriptionsResult.ok ? rows(subscriptionsResult.data) : []
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const planId = text(body.planId)
  const plan = getAnbuPaymentPlan(planId)

  if (!plan) {
    return NextResponse.json({ ok: false, message: '지원하지 않는 요금제입니다.' }, { status: 400 })
  }

  if (plan.id === 'free') {
    return NextResponse.json({
      ok: false,
      message: '무료 체험은 결제가 필요 없습니다. /family-link에서 바로 시작하세요.'
    }, { status: 400 })
  }

  const familyCode =
    text(body.familyCode) ||
    request.cookies.get('anbu_family_code')?.value ||
    request.cookies.get('pc_parent_invite_code')?.value ||
    ''

  const buyerName = text(body.buyerName) || '보호자'
  const buyerPhone = phoneDigits(text(body.buyerPhone))
  const buyerEmail = text(body.buyerEmail)
  const orderId = createAnbuOrderId()
  const customerKey = createCustomerKey()

  const insert = await supabaseRest('anbu_payment_orders', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        family_code: familyCode || null,
        order_id: orderId,
        order_name: plan.orderName,
        plan_id: plan.id,
        plan_name: plan.name,
        amount: plan.amount,
        billing_cycle: plan.billingCycle,
        plan_type: plan.planType,
        buyer_name: buyerName,
        buyer_phone: buyerPhone || null,
        buyer_email: buyerEmail || null,
        customer_key: customerKey,
        payment_provider: 'toss',
        payment_status: 'ready'
      }
    ])
  })

  if (!insert.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '결제 주문 저장에 실패했습니다. /setup/payments에서 DB 설정을 확인해주세요.',
        detail: insert.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    order: Array.isArray(insert.data) ? insert.data[0] : insert.data,
    tossClientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '',
    tossReady: Boolean(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY && process.env.TOSS_SECRET_KEY)
  })
}
