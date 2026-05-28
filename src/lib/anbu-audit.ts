import type { NextRequest } from 'next/server'
import { supabaseInsert } from '@/lib/anbu-integrations'

export type AuditSeverity = 'info' | 'warning' | 'critical'

export type AuditInput = {
  actorRole?: string
  actorName?: string
  action: string
  targetType?: string
  targetId?: string
  status?: string
  severity?: AuditSeverity
  memo?: string
  metadata?: Record<string, unknown>
}

export function getClientIp(request?: NextRequest) {
  if (!request) return ''

  const forwarded = request.headers.get('x-forwarded-for') || ''
  const realIp = request.headers.get('x-real-ip') || ''
  const cfIp = request.headers.get('cf-connecting-ip') || ''

  return forwarded.split(',')[0]?.trim() || realIp || cfIp || ''
}

export function getUserAgent(request?: NextRequest) {
  if (!request) return ''
  return request.headers.get('user-agent') || ''
}

export async function recordAudit(request: NextRequest | null | undefined, input: AuditInput) {
  try {
    const payload = {
      actor_role: input.actorRole || 'ops',
      actor_name: input.actorName || '운영실',
      action: input.action,
      target_type: input.targetType || null,
      target_id: input.targetId || null,
      status: input.status || 'ok',
      severity: input.severity || 'info',
      ip_address: getClientIp(request || undefined) || null,
      user_agent: getUserAgent(request || undefined) || null,
      memo: input.memo || null,
      metadata: input.metadata || {}
    }

    const result = await supabaseInsert('anbu_audit_logs', payload)

    return {
      ok: result.ok,
      result
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}
