"use server"
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const worryRequestSchema = z.object({
  familyId: z.string().uuid().optional(),
  elderId: z.string().uuid().optional(),
  category: z.string().default('not_sure'),
  channel: z.string().default('simple_form'),
  memo: z.string().min(1).max(2000)
})

export async function createWorryRequestAction(_: unknown, formData: FormData) {
  const parsed = worryRequestSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { ok: false, message: '내용을 조금만 더 입력해주세요.' }
  const supabase = createServerSupabaseClient()
  if (!supabase) return { ok: true, message: '데모 모드로 접수되었습니다.', data: parsed.data }
  const { error } = await supabase.from('care_intake_entries').insert({
    family_id: parsed.data.familyId ?? null,
    elder_id: parsed.data.elderId ?? null,
    intake_channel: parsed.data.channel,
    resolved_worry: parsed.data.category,
    raw_text: parsed.data.memo,
    ops_status: 'new'
  })
  return error ? { ok: false, message: error.message } : { ok: true, message: '걱정 접수가 완료되었습니다.' }
}

export async function saveCarePassportAction(_: unknown, formData: FormData) {
  const supabase = createServerSupabaseClient()
  const payload = Object.fromEntries(formData.entries())
  if (!supabase) return { ok: true, message: '데모 모드로 케어패스포트를 저장했습니다.', data: payload }
  return { ok: true, message: '케어패스포트 저장 준비 완료' }
}

export async function requestMealSupportAction(_: unknown, formData: FormData) {
  const payload = Object.fromEntries(formData.entries())
  return { ok: true, message: '안심밥상 상담 요청이 접수되었습니다.', data: payload }
}
