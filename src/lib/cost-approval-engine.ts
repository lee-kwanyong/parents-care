export type CostSourceType =
  | 'appointment'
  | 'meal_care'
  | 'documents'
  | 'discharge_care'
  | 'manager_field'
  | 'social_support'
  | 'manual'

export type CostApprovalStatus =
  | 'draft'
  | 'pending_guardian'
  | 'approved'
  | 'rejected'
  | 'payment_pending'
  | 'paid'
  | 'cancelled'
  | 'expired'

export type CostPriority = 'low' | 'normal' | 'high' | 'urgent'
export type ApprovalMethod = 'app' | 'phone' | 'kakao' | 'ops'

export type CostItemType =
  | 'taxi_fare'
  | 'document_fee'
  | 'meal_delivery'
  | 'mobility_partner'
  | 'extra_time'
  | 'medicine_copay'
  | 'hospital_out_of_pocket'
  | 'parking'
  | 'other'

export type CostApprovalRequest = {
  id: string
  elder_name: string
  guardian_name: string | null
  guardian_phone: string | null
  title: string
  reason: string | null
  source_type: CostSourceType
  source_id: string | null
  status: CostApprovalStatus
  priority: CostPriority
  total_amount_krw: number
  approved_amount_krw: number | null
  currency: string
  approval_required: boolean
  approval_method: ApprovalMethod
  guardian_message: string | null
  approved_by_name: string | null
  rejected_reason: string | null
  due_at: string | null
  approved_at: string | null
  rejected_at: string | null
  paid_at: string | null
  memo: string | null
  ops_memo: string | null
  created_at: string
  updated_at: string
}

export type CostApprovalItem = {
  id: string
  cost_approval_request_id: string
  item_type: CostItemType
  label: string
  quantity: number
  unit_amount_krw: number
  amount_krw: number
  memo: string | null
  created_at: string
}

export type CostApprovalEvent = {
  id: string
  cost_approval_request_id: string
  event_type: string
  title: string
  description: string | null
  actor_role: 'family' | 'ops' | 'manager' | 'system'
  created_at: string
}

export const costItemTypeOptions: Array<{
  code: CostItemType
  label: string
  description: string
}> = [
  {
    code: 'taxi_fare',
    label: '택시비',
    description: '집 앞 만남 후 택시 동행 등 보호자가 승인해야 하는 이동 비용'
  },
  {
    code: 'document_fee',
    label: '서류 발급비',
    description: '진단서, 소견서, 통원확인서 등 병원 발급 실비'
  },
  {
    code: 'meal_delivery',
    label: '식사 배송비',
    description: '안심밥상, 회복식, 도시락, 반찬 배송 비용'
  },
  {
    code: 'mobility_partner',
    label: '이동지원 제휴비',
    description: '이동지원 제휴 서비스를 이용하는 경우'
  },
  {
    code: 'extra_time',
    label: '추가 동행시간',
    description: '대기나 검사 지연으로 추가 시간이 필요한 경우'
  },
  {
    code: 'medicine_copay',
    label: '약국 실비',
    description: '처방약 수령 시 보호자 확인이 필요한 실비'
  },
  {
    code: 'hospital_out_of_pocket',
    label: '병원 실비',
    description: '검사·수납 등 보호자 확인이 필요한 병원 실비'
  },
  {
    code: 'parking',
    label: '주차비',
    description: '보호자 또는 제휴 차량 이용 시 발생 가능한 비용'
  },
  {
    code: 'other',
    label: '기타 비용',
    description: '운영실이 보호자 승인 후 진행해야 하는 기타 비용'
  }
]

export function labelCostItemType(type: string) {
  return costItemTypeOptions.find((option) => option.code === type)?.label || type
}

export function labelCostApprovalStatus(status: string) {
  const map: Record<string, string> = {
    draft: '초안',
    pending_guardian: '승인 필요',
    approved: '승인 완료',
    rejected: '거절',
    payment_pending: '결제 대기',
    paid: '결제 완료',
    cancelled: '취소',
    expired: '기한 만료'
  }

  return map[status] || status
}

export function labelApprovalMethod(method: string) {
  const map: Record<string, string> = {
    app: '앱 승인',
    phone: '전화 승인',
    kakao: '카톡 승인',
    ops: '운영실 대리 확인'
  }

  return map[method] || method
}

export function formatKrw(amount: number | null | undefined) {
  const value = Number(amount || 0)
  return new Intl.NumberFormat('ko-KR').format(value) + '원'
}

export function calculateCostTotal(items: Array<{ amount_krw?: number; amountKrw?: number; unitAmountKrw?: number; quantity?: number }>) {
  return items.reduce((total, item) => {
    const amount = Number(item.amount_krw ?? item.amountKrw ?? 0)
    if (amount > 0) return total + amount

    const unit = Number(item.unitAmountKrw || 0)
    const quantity = Number(item.quantity || 1)
    return total + Math.round(unit * quantity)
  }, 0)
}

export function buildCostApprovalSummary(requests: CostApprovalRequest[]) {
  const open = requests.filter((item) => !['paid', 'cancelled', 'expired'].includes(item.status))
  const pending = open.filter((item) => item.status === 'pending_guardian')
  const approved = open.filter((item) => item.status === 'approved')
  const paymentPending = open.filter((item) => item.status === 'payment_pending')
  const rejected = requests.filter((item) => item.status === 'rejected')
  const paid = requests.filter((item) => item.status === 'paid')

  const reassuranceState =
    pending.length > 0
      ? '확인 필요'
      : paymentPending.length > 0 || approved.length > 0
        ? '확인 필요'
        : '안심'

  const familyNextActions: string[] = []

  if (pending.length > 0) {
    familyNextActions.push('승인이 필요한 추가비용이 있습니다.')
  }

  if (paymentPending.length > 0) {
    familyNextActions.push('결제 대기 중인 승인 비용이 있습니다.')
  }

  if (approved.length > 0) {
    familyNextActions.push('승인 완료된 비용의 결제 진행 여부를 확인해주세요.')
  }

  if (familyNextActions.length === 0) {
    familyNextActions.push('지금은 승인할 추가비용이 없습니다.')
  }

  return {
    reassuranceState,
    total: requests.length,
    open: open.length,
    pending: pending.length,
    approved: approved.length,
    paymentPending: paymentPending.length,
    rejected: rejected.length,
    paid: paid.length,
    pendingAmount: pending.reduce((sum, item) => sum + item.total_amount_krw, 0),
    paidAmount: paid.reduce((sum, item) => sum + item.total_amount_krw, 0),
    familyNextActions: familyNextActions.slice(0, 3)
  }
}

export function buildDefaultGuardianMessage(input: {
  elderName: string
  title: string
  totalAmountKrw: number
  reason?: string
}) {
  return `${input.elderName} 케어 진행 중 추가비용 ${formatKrw(input.totalAmountKrw)} 승인이 필요합니다. ${input.reason || '추가 비용은 보호자 승인 후에만 진행합니다.'}`
}
