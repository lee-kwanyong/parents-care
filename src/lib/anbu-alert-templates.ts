import type { DailyCareStatus, DailyCareType } from '@/lib/daily-care-engine'

export type GuardianAlertInput = {
  parentName: string
  checkType: DailyCareType
  careLabel: string
  status: DailyCareStatus
  memo?: string | null
}

export function buildGuardianSmsAlert(input: GuardianAlertInput) {
  const parentName = input.parentName || '부모님'
  const memo = input.memo ? `\n메모: ${input.memo}` : ''

  if (input.checkType === 'emergency' || input.status === 'needs_help') {
    return {
      shouldSend: true,
      title: '부모님 확인 필요',
      body: `${parentName}께서 확인이 필요한 안부 신호를 보냈습니다.\n항목: ${input.careLabel}${memo}\n가능하면 바로 연락해주세요.`
    }
  }

  if (input.checkType === 'medication' && input.status === 'not_done') {
    return {
      shouldSend: true,
      title: '복약 확인 필요',
      body: `${parentName}의 복약 확인이 아직 완료되지 않았습니다.\n항목: ${input.careLabel}${memo}\n보호자 확인이 필요할 수 있습니다.`
    }
  }

  if (input.checkType === 'meal' && input.status === 'not_done') {
    return {
      shouldSend: true,
      title: '식사 확인 필요',
      body: `${parentName}의 식사 확인이 아직 완료되지 않았습니다.\n항목: ${input.careLabel}${memo}\n식사 여부를 확인해주세요.`
    }
  }

  if (input.checkType === 'condition' && input.status === 'not_done') {
    return {
      shouldSend: true,
      title: '활동 확인 필요',
      body: `${parentName}의 활동 또는 상태 확인이 필요합니다.\n항목: ${input.careLabel}${memo}`
    }
  }

  return {
    shouldSend: false,
    title: '',
    body: ''
  }
}

export function buildNoResponseSmsAlert(parentName: string, hours = 12) {
  return {
    title: '부모님 안부 응답 없음',
    body: `${parentName || '부모님'}의 안부 응답이 최근 ${hours}시간 동안 확인되지 않았습니다.\n보호자 확인이 필요할 수 있습니다.`
  }
}
