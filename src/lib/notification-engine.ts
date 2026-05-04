export type NotificationChannel = 'app' | 'kakao' | 'sms' | 'phone' | 'email' | 'push'
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'
export type NotificationStatus = 'queued' | 'ready' | 'sent' | 'failed' | 'cancelled' | 'suppressed'

export type NotificationOutboxItem = {
  id: string
  family_id: string | null
  elder_id: string | null
  elder_name: string
  recipient_role: string
  recipient_name: string | null
  recipient_phone: string | null
  channel: NotificationChannel
  template_code: string
  title: string
  body: string
  payload: Record<string, unknown>
  priority: NotificationPriority
  status: NotificationStatus
  scheduled_at: string | null
  sent_at: string | null
  failed_at: string | null
  provider: string | null
  provider_message_id: string | null
  failure_reason: string | null
  retry_count: number
  max_retries: number
  dedupe_key: string | null
  created_by_role: 'family' | 'ops' | 'manager' | 'system'
  created_at: string
  updated_at: string
}

export type NotificationTemplate = {
  id: string
  template_code: string
  title: string
  audience: 'guardian' | 'parent' | 'manager' | 'ops' | 'family'
  channel: NotificationChannel
  trigger_event: string
  body: string
  easy_summary: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type NotificationDeliveryEvent = {
  id: string
  notification_outbox_id: string | null
  event_type: string
  title: string
  description: string | null
  actor_role: 'family' | 'ops' | 'manager' | 'system'
  created_at: string
}

export function labelNotificationChannel(channel: string) {
  const map: Record<string, string> = {
    app: '앱',
    kakao: '카카오 알림톡',
    sms: '문자',
    phone: '전화',
    email: '이메일',
    push: '푸시'
  }

  return map[channel] || channel
}

export function labelNotificationStatus(status: string) {
  const map: Record<string, string> = {
    queued: '대기',
    ready: '발송 준비',
    sent: '발송 완료',
    failed: '실패',
    cancelled: '취소',
    suppressed: '보류'
  }

  return map[status] || status
}

export function labelNotificationPriority(priority: string) {
  const map: Record<string, string> = {
    low: '낮음',
    normal: '보통',
    high: '중요',
    urgent: '긴급'
  }

  return map[priority] || priority
}

export function buildNotificationSummary(items: NotificationOutboxItem[]) {
  const queued = items.filter((item) => item.status === 'queued' || item.status === 'ready')
  const urgent = queued.filter((item) => item.priority === 'urgent')
  const failed = items.filter((item) => item.status === 'failed')
  const sent = items.filter((item) => item.status === 'sent')
  const retryNeeded = failed.filter((item) => item.retry_count < item.max_retries)

  const reassuranceState =
    urgent.length > 0
      ? '긴급'
      : queued.length > 0 || retryNeeded.length > 0
        ? '확인 필요'
        : '안심'

  const opsNextActions: string[] = []

  if (urgent.length > 0) {
    opsNextActions.push('긴급 알림을 먼저 발송하거나 전화 확인으로 전환하세요.')
  }

  if (retryNeeded.length > 0) {
    opsNextActions.push('실패한 알림 중 재시도 가능한 항목을 확인하세요.')
  }

  if (queued.length > 0) {
    opsNextActions.push('발송 대기 중인 알림을 확인하세요.')
  }

  if (opsNextActions.length === 0) {
    opsNextActions.push('지금은 처리할 알림이 없습니다.')
  }

  return {
    reassuranceState,
    total: items.length,
    queued: queued.length,
    urgent: urgent.length,
    failed: failed.length,
    retryNeeded: retryNeeded.length,
    sent: sent.length,
    opsNextActions: opsNextActions.slice(0, 3)
  }
}

export function buildDedupeKey(input: {
  templateCode: string
  elderName?: string
  recipientPhone?: string | null
  sourceId?: string | null
}) {
  return [
    'notice',
    input.templateCode,
    input.elderName || 'parent',
    input.recipientPhone || 'no-phone',
    input.sourceId || new Date().toISOString().slice(0, 10)
  ].join(':')
}

export function applyTemplate(template: string, params: Record<string, string | number | null | undefined>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = params[key]
    return value === null || value === undefined ? '' : String(value)
  })
}
