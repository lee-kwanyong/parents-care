export type DocumentType =
  | 'medical_receipt'
  | 'itemized_bill'
  | 'prescription_copy'
  | 'visit_confirmation'
  | 'test_result'
  | 'diagnosis_note'
  | 'insurance_unknown'

export type DocumentReason =
  | 'insurance'
  | 'family_record'
  | 'next_hospital'
  | 'company'
  | 'unknown'

export type DocumentStatus =
  | 'requested'
  | 'preparing'
  | 'ready'
  | 'collected'
  | 'sent_to_family'
  | 'not_needed'
  | 'failed'

export type DocumentPriority = 'low' | 'normal' | 'high' | 'urgent'

export type CareDocumentRequest = {
  id: string
  elder_name: string
  guardian_name: string | null
  guardian_phone: string | null
  document_type: DocumentType
  document_label: string
  reason: DocumentReason
  status: DocumentStatus
  priority: DocumentPriority
  hospital_name: string | null
  visit_date: string | null
  memo: string | null
  ops_memo: string | null
  collected_at: string | null
  sent_to_family_at: string | null
  created_at: string
  updated_at: string
}

export const documentTypeOptions: Array<{
  code: DocumentType
  label: string
  easyLabel: string
  description: string
  usuallyNeededForInsurance: boolean
}> = [
  {
    code: 'medical_receipt',
    label: '진료비 영수증',
    easyLabel: '영수증',
    description: '병원비를 확인하거나 실손보험 청구에 자주 필요합니다.',
    usuallyNeededForInsurance: true
  },
  {
    code: 'itemized_bill',
    label: '진료비 세부내역서',
    easyLabel: '세부내역서',
    description: '어떤 진료와 처치에 비용이 들었는지 확인하는 서류입니다.',
    usuallyNeededForInsurance: true
  },
  {
    code: 'prescription_copy',
    label: '처방전 사본',
    easyLabel: '처방전',
    description: '약 처방 내용 확인이나 보험 청구에 필요할 수 있습니다.',
    usuallyNeededForInsurance: true
  },
  {
    code: 'visit_confirmation',
    label: '통원확인서',
    easyLabel: '통원확인서',
    description: '병원에 다녀왔다는 확인이 필요할 때 사용합니다.',
    usuallyNeededForInsurance: true
  },
  {
    code: 'test_result',
    label: '검사결과지',
    easyLabel: '검사결과지',
    description: '다음 병원 제출이나 가족 확인용으로 필요할 수 있습니다.',
    usuallyNeededForInsurance: false
  },
  {
    code: 'diagnosis_note',
    label: '진단서 또는 소견서',
    easyLabel: '진단서/소견서',
    description: '회사, 보험, 다른 병원 제출용으로 필요할 수 있습니다. 발급 비용이 있을 수 있습니다.',
    usuallyNeededForInsurance: false
  },
  {
    code: 'insurance_unknown',
    label: '잘 모르겠어요, 필요한 서류 추천해주세요',
    easyLabel: '추천받기',
    description: '무엇이 필요한지 모르면 운영실이 기본 보험서류 묶음을 추천합니다.',
    usuallyNeededForInsurance: true
  }
]

export const recommendedInsuranceDocumentTypes: DocumentType[] = [
  'medical_receipt',
  'itemized_bill',
  'prescription_copy',
  'visit_confirmation'
]

export function labelDocumentType(type: string) {
  return documentTypeOptions.find((item) => item.code === type)?.label || type
}

export function labelDocumentStatus(status: string) {
  const map: Record<string, string> = {
    requested: '요청됨',
    preparing: '준비 중',
    ready: '수령 가능',
    collected: '수령 완료',
    sent_to_family: '가족 전달',
    not_needed: '불필요',
    failed: '문제 발생'
  }

  return map[status] || status
}

export function labelDocumentReason(reason: string) {
  const map: Record<string, string> = {
    insurance: '실손보험',
    family_record: '가족 확인',
    next_hospital: '다음 병원 제출',
    company: '회사 제출',
    unknown: '잘 모름'
  }

  return map[reason] || reason
}

export function normalizeDocumentTypes(input: unknown): DocumentType[] {
  const raw = Array.isArray(input) ? input.map(String) : []

  const selected = raw.filter((item): item is DocumentType =>
    documentTypeOptions.some((option) => option.code === item)
  )

  if (selected.length === 0 || selected.includes('insurance_unknown')) {
    return recommendedInsuranceDocumentTypes
  }

  return Array.from(new Set(selected))
}

export function buildDocumentSummary(items: CareDocumentRequest[]) {
  const open = items.filter((item) => !['sent_to_family', 'not_needed'].includes(item.status))
  const needsOps = open.filter((item) => ['requested', 'preparing'].includes(item.status))
  const ready = open.filter((item) => item.status === 'ready')
  const failed = open.filter((item) => item.status === 'failed')
  const sent = items.filter((item) => item.status === 'sent_to_family')

  const reassuranceState =
    failed.length > 0
      ? '긴급'
      : needsOps.length > 0 || ready.length > 0
        ? '확인 필요'
        : '안심'

  const familyNextActions: string[] = []

  if (ready.length > 0) {
    familyNextActions.push('수령 가능한 서류가 있는지 확인해주세요.')
  }

  if (needsOps.length > 0) {
    familyNextActions.push('운영실이 병원 서류 준비 상태를 확인 중입니다.')
  }

  if (failed.length > 0) {
    familyNextActions.push('발급 문제가 있는 서류를 확인해주세요.')
  }

  if (familyNextActions.length === 0) {
    familyNextActions.push('지금은 확인할 서류 일이 없습니다.')
  }

  return {
    reassuranceState,
    total: items.length,
    open: open.length,
    needsOps: needsOps.length,
    ready: ready.length,
    failed: failed.length,
    sent: sent.length,
    familyNextActions: familyNextActions.slice(0, 3)
  }
}
