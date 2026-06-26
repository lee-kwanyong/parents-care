export type CaseStatus =
  | 'detected'
  | 'opened'
  | 'notified'
  | 'accepted'
  | 'checking'
  | 'resolved'
  | 'unreachable'
  | 'escalated'
  | 'cancelled'

export type CaseTone = 'safe' | 'watch' | 'danger' | 'neutral' | 'complete' | 'cancelled'

export type AnbuCaseEvent = {
  id: string
  caseId: string
  familyCode: string
  eventType: string
  actorName: string
  actorRole: string
  method: string
  resultType: string
  note: string
  payload: Record<string, unknown>
  createdAt: string
}

export type AnbuCase = {
  id: string
  familyCode: string
  parentName: string
  guardianName: string
  title: string
  reasonType: string
  riskLevel: string
  status: CaseStatus
  source: string
  openedBy: string
  assignedTo: string
  assignedRole: string
  assignedAt: string
  dueAt: string
  resolvedAt: string
  cancelledAt: string
  closeResult: string
  closeNote: string
  dataQuality: string
  ringReference: Record<string, unknown>
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
  timeline: AnbuCaseEvent[]
}

export type CompletionDashboard = {
  status: {
    key: string
    label: string
    title: string
    desc: string
    tone: CaseTone
  }
  todayLine: string
  nextAction: string
  activeCases: AnbuCase[]
  resolvedCases: AnbuCase[]
  cancelledCases: AnbuCase[]
  allCases: AnbuCase[]
  dailyOkCount: number
  metrics: {
    totalCases: number
    activeCount: number
    resolvedCount: number
    cancelledCount: number
    completionRate: number
    averageCloseMinutes: number | null
  }
  reportText: string
  notice: string
}

export function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function parsePayload(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : {}
    } catch {
      return {}
    }
  }

  return {}
}

export function kstNowLabel(date = new Date()) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

export function kstTodayDate(date = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

export function kstDayRange(dateString = kstTodayDate()) {
  const start = new Date(`${dateString}T00:00:00+09:00`)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)

  return {
    start: start.toISOString(),
    end: end.toISOString()
  }
}

export function minutesBetween(startIso: string, endIso: string) {
  const start = Date.parse(startIso)
  const end = Date.parse(endIso)

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null

  return Math.round((end - start) / 60000)
}

export function normalizeCaseStatus(value: unknown): CaseStatus {
  const status = text(value)

  if (
    status === 'detected' ||
    status === 'opened' ||
    status === 'notified' ||
    status === 'accepted' ||
    status === 'checking' ||
    status === 'resolved' ||
    status === 'unreachable' ||
    status === 'escalated' ||
    status === 'cancelled'
  ) {
    return status
  }

  if (status === 'assigned') return 'accepted'
  if (status === 'closed' || status === 'completed') return 'resolved'

  return 'opened'
}

export function isActiveCase(status: CaseStatus) {
  return (
    status === 'detected' ||
    status === 'opened' ||
    status === 'notified' ||
    status === 'accepted' ||
    status === 'checking' ||
    status === 'unreachable' ||
    status === 'escalated'
  )
}

export function statusLabel(status: CaseStatus) {
  const map: Record<CaseStatus, string> = {
    detected: '신호 감지',
    opened: '확인 필요',
    notified: '알림 발송',
    accepted: '담당자 지정',
    checking: '확인 중',
    resolved: '확인 완료',
    unreachable: '연락 실패',
    escalated: '이관됨',
    cancelled: '취소됨'
  }

  return map[status]
}

export function reasonLabel(value: string) {
  const map: Record<string, string> = {
    no_response: '미응답',
    condition: '몸 상태 확인',
    help: '도움 요청',
    meal: '식사 확인',
    medication: '복약 확인',
    data_gap: '데이터 부족',
    manual: '수동 확인',
    daily_ok: '정상 안부',
    general: '일반 안부'
  }

  return map[value] || value || '안부 확인'
}

export function resultLabel(value: string) {
  const map: Record<string, string> = {
    same_as_usual: '평소와 같음',
    meal_confirmed: '식사 확인 완료',
    medication_confirmed: '복약 확인 완료',
    device_issue: '기기·데이터 문제',
    phone_missed: '휴대폰 미확인',
    felt_unwell: '몸 상태 불편',
    contact_failed: '연락 실패',
    emergency_guided: '응급 연락 안내',
    wrong_press: '잘못 누름',
    other: '기타'
  }

  return map[value] || value || '확인 완료'
}

export function toneForCase(caseItem: AnbuCase): CaseTone {
  if (caseItem.status === 'cancelled') return 'cancelled'
  if (caseItem.status === 'resolved') return 'complete'
  if (caseItem.status === 'unreachable' || caseItem.status === 'escalated') return 'danger'
  if (caseItem.riskLevel === 'high') return 'danger'
  if (caseItem.reasonType === 'data_gap') return 'neutral'
  return 'watch'
}

function dashboardStatus(input: {
  activeCases: AnbuCase[]
  resolvedCases: AnbuCase[]
  dailyOkCount: number
}) {
  const { activeCases, resolvedCases, dailyOkCount } = input

  if (activeCases.length > 0) {
    const high = activeCases.some(
      (caseItem) =>
        caseItem.riskLevel === 'high' ||
        caseItem.status === 'unreachable' ||
        caseItem.status === 'escalated'
    )
    const onlyDataGap = activeCases.every((caseItem) => caseItem.reasonType === 'data_gap')

    if (onlyDataGap) {
      return {
        key: 'data_gap',
        label: '데이터 부족',
        title: '상태 이상이 아니라 확인 자료가 부족합니다.',
        desc: '스마트링·앱·전화 응답 자료가 충분하지 않아 먼저 데이터 상태 확인이 필요합니다.',
        tone: 'neutral' as CaseTone
      }
    }

    return {
      key: high ? 'needs_check' : 'watch',
      label: high ? '확인 필요' : '주의',
      title: high ? '지금 확인이 필요한 안부 사건이 있습니다.' : '오늘 안부 확인이 필요합니다.',
      desc: '담당자 지정, 실제 전화·방문 확인, 결과 입력이 완료되어야 사건이 종료됩니다.',
      tone: high ? 'danger' as CaseTone : 'watch' as CaseTone
    }
  }

  if (resolvedCases.length > 0) {
    return {
      key: 'completed',
      label: '확인 완료',
      title: '확인이 필요한 상황이 처리 완료되었습니다.',
      desc: '누가 언제 어떻게 확인했고 어떤 결과였는지 안부완료 리포트에 남았습니다.',
      tone: 'complete' as CaseTone
    }
  }

  if (dailyOkCount > 0) {
    return {
      key: 'normal',
      label: '정상',
      title: '오늘 안부는 정상으로 기록되었습니다.',
      desc: '정상 응답은 조용히 저장하고, 보호자에게는 요약 리포트 중심으로 전달합니다.',
      tone: 'safe' as CaseTone
    }
  }

  return {
    key: 'waiting',
    label: '확인 대기',
    title: '아직 오늘 안부 확인 자료가 충분하지 않습니다.',
    desc: '응답 없음은 식사·복약 실패로 단정하지 않고, 미확인 상태로만 관리합니다.',
    tone: 'neutral' as CaseTone
  }
}

export function buildCompletionReport(input: {
  parentName: string
  guardianName: string
  dashboard: Omit<CompletionDashboard, 'reportText' | 'notice'>
}) {
  const { parentName, guardianName, dashboard } = input
  const lines: string[] = []

  lines.push('[안부웍스] 안부완료 리포트')
  lines.push('')
  lines.push(`대상자: ${parentName || '부모님'}`)
  lines.push(`보호자: ${guardianName || '보호자'}`)
  lines.push(`생성시각: ${kstNowLabel()}`)
  lines.push('')
  lines.push(`오늘 상태: ${dashboard.status.label}`)
  lines.push(`요약: ${dashboard.todayLine}`)
  lines.push(`다음 조치: ${dashboard.nextAction}`)
  lines.push('')

  if (dashboard.allCases.length === 0) {
    lines.push('확인 사건')
    lines.push('- 오늘 생성된 확인필요 사건이 없습니다.')
  } else {
    lines.push('확인 사건')

    for (const caseItem of dashboard.allCases.slice(0, 10)) {
      lines.push(`- ${caseItem.title}`)
      lines.push(`  상태: ${statusLabel(caseItem.status)}`)
      lines.push(`  사유: ${reasonLabel(caseItem.reasonType)}`)
      lines.push(`  발생: ${caseItem.createdAt ? kstNowLabel(new Date(caseItem.createdAt)) : '-'}`)

      if (caseItem.assignedTo) {
        lines.push(`  담당: ${caseItem.assignedTo}`)
      }

      if (caseItem.resolvedAt) {
        lines.push(`  완료: ${kstNowLabel(new Date(caseItem.resolvedAt))}`)
        lines.push(`  결과: ${resultLabel(caseItem.closeResult)}`)
      }

      if (caseItem.status === 'unreachable') {
        lines.push('  결과: 연락 실패 — 재확인 또는 이관 필요')
      }

      if (caseItem.closeNote) {
        lines.push(`  메모: ${caseItem.closeNote}`)
      }

      if (caseItem.timeline.length > 0) {
        lines.push('  처리 과정:')
        for (const event of caseItem.timeline.slice(0, 8)) {
          lines.push(
            `   · ${kstNowLabel(new Date(event.createdAt))} ${event.eventType} ${event.actorName ? `(${event.actorName})` : ''}${event.note ? ` - ${event.note}` : ''}`
          )
        }
      }
    }
  }

  lines.push('')
  lines.push('운영 지표')
  lines.push(`- 전체 확인 사건: ${dashboard.metrics.totalCases}건`)
  lines.push(`- 미완료 사건: ${dashboard.metrics.activeCount}건`)
  lines.push(`- 확인완료 사건: ${dashboard.metrics.resolvedCount}건`)
  lines.push(`- 취소 사건: ${dashboard.metrics.cancelledCount}건`)
  lines.push(`- 확인완료율: ${dashboard.metrics.completionRate}%`)

  if (dashboard.metrics.averageCloseMinutes !== null) {
    lines.push(`- 평균 확인 소요시간: ${dashboard.metrics.averageCloseMinutes}분`)
  }

  lines.push('')
  lines.push('비의료 고지')
  lines.push('본 리포트는 의료 진단·치료·응급구조 판단 자료가 아니라, 일상 안부 확인과 후속조치 기록을 돕는 참고 정보입니다.')

  return lines.join('\n')
}

export function buildCompletionDashboard(input: {
  parentName: string
  guardianName: string
  cases: AnbuCase[]
  dailyOkCount: number
}): CompletionDashboard {
  const sorted = [...input.cases].sort((a, b) => {
    const aActive = isActiveCase(a.status)
    const bActive = isActiveCase(b.status)

    if (aActive && !bActive) return -1
    if (!aActive && bActive) return 1

    return Date.parse(b.createdAt) - Date.parse(a.createdAt)
  })

  const activeCases = sorted.filter((caseItem) => isActiveCase(caseItem.status))
  const resolvedCases = sorted.filter((caseItem) => caseItem.status === 'resolved')
  const cancelledCases = sorted.filter((caseItem) => caseItem.status === 'cancelled')
  const countedCases = sorted.filter((caseItem) => caseItem.status !== 'cancelled')
  const status = dashboardStatus({ activeCases, resolvedCases, dailyOkCount: input.dailyOkCount })

  const closeMinutes = resolvedCases
    .map((caseItem) => minutesBetween(caseItem.createdAt, caseItem.resolvedAt))
    .filter((value): value is number => value !== null)

  const averageCloseMinutes = closeMinutes.length
    ? Math.round(closeMinutes.reduce((sum, value) => sum + value, 0) / closeMinutes.length)
    : null

  const completionRate = countedCases.length
    ? Math.round((resolvedCases.length / countedCases.length) * 100)
    : input.dailyOkCount > 0 ? 100 : 0

  const todayLine =
    activeCases.length > 0
      ? `${activeCases.length}건의 확인필요 사건이 남아 있습니다.`
      : resolvedCases.length > 0
        ? `${resolvedCases.length}건의 확인필요 상황이 확인 완료되었습니다.`
        : input.dailyOkCount > 0
          ? '오늘은 정상 안부가 확인되었습니다.'
          : '아직 오늘 안부 확인 자료가 충분하지 않습니다.'

  const nextAction =
    activeCases.length > 0
      ? '담당자를 지정하고 전화·방문 확인 결과를 입력하세요.'
      : resolvedCases.length > 0
        ? '추가 조치는 없습니다. 안부완료 리포트를 공유할 수 있습니다.'
        : input.dailyOkCount > 0
          ? '오늘은 별도 조치가 필요하지 않습니다.'
          : '부모님 안부 입력 또는 자동확인 요청이 필요합니다.'

  const partial = {
    status,
    todayLine,
    nextAction,
    activeCases,
    resolvedCases,
    cancelledCases,
    allCases: sorted,
    dailyOkCount: input.dailyOkCount,
    metrics: {
      totalCases: countedCases.length,
      activeCount: activeCases.length,
      resolvedCount: resolvedCases.length,
      cancelledCount: cancelledCases.length,
      completionRate,
      averageCloseMinutes
    }
  }

  return {
    ...partial,
    reportText: buildCompletionReport({
      parentName: input.parentName,
      guardianName: input.guardianName,
      dashboard: partial
    }),
    notice: '안부웍스는 의료 진단이 아니라 비의료 안부확인과 후속조치 기록을 지원합니다.'
  }
}
