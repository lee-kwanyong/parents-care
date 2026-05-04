import { NextResponse } from 'next/server'
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  return NextResponse.json({ ok: true, message: '걱정 접수 API 데모', received: body, next: ['걱정 분류', '케어팩 추천', '운영실 확인'] })
}
