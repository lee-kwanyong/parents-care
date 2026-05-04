export type CareFileKind = 'image' | 'document' | 'text' | 'other'

export type CareFileModule =
  | 'assisted_intake'
  | 'care_passport'
  | 'documents'
  | 'medication'
  | 'receipt'
  | 'report'
  | 'manager_field'
  | 'discharge'
  | 'meal'
  | 'social_support'
  | 'manual'

export type CareStorageFile = {
  id: string
  elder_name: string
  linked_module: CareFileModule
  linked_record_id: string | null
  file_kind: CareFileKind
  bucket_id: string
  storage_path: string
  file_name: string
  file_label: string | null
  mime_type: string
  size_bytes: number
  uploaded_by_role: 'family' | 'ops' | 'manager' | 'system'
  uploaded_by_name: string | null
  uploaded_by_phone: string | null
  status: 'active' | 'archived' | 'deleted'
  memo: string | null
  created_at: string
  updated_at: string
}

export const careFileModuleOptions: Array<{
  code: CareFileModule
  label: string
  description: string
}> = [
  {
    code: 'assisted_intake',
    label: '사진·카톡 접수',
    description: '예약 문자, 카톡 캡처, 병원 안내 사진'
  },
  {
    code: 'medication',
    label: '약 봉투',
    description: '처방약, 약 봉투, 복약 안내'
  },
  {
    code: 'receipt',
    label: '영수증',
    description: '진료비 영수증, 약국 영수증'
  },
  {
    code: 'documents',
    label: '서류',
    description: '세부내역서, 처방전, 통원확인서, 검사결과지'
  },
  {
    code: 'care_passport',
    label: '케어패스포트',
    description: '부모님 상태 관련 참고 파일'
  },
  {
    code: 'manager_field',
    label: '매니저 현장',
    description: '현장 확인용 사진과 문서'
  },
  {
    code: 'discharge',
    label: '퇴원 후 케어',
    description: '퇴원 안내문, 외래 예약증'
  },
  {
    code: 'meal',
    label: '안심밥상',
    description: '식사 사진, 식단 조건'
  },
  {
    code: 'report',
    label: '리포트',
    description: '가족 공유용 첨부'
  },
  {
    code: 'manual',
    label: '기타',
    description: '운영실이 직접 분류'
  }
]

export function labelCareFileModule(module: string) {
  return careFileModuleOptions.find((item) => item.code === module)?.label || module
}

export function inferCareFileKind(mimeType: string): CareFileKind {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType === 'text/plain') return 'text'
  if (mimeType === 'application/pdf') return 'document'
  return 'other'
}

export function safeFileName(name: string) {
  return name
    .replace(/[^\w.\-가-힣]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120) || 'file'
}

export function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes}B`
  if (sizeBytes < 1024 * 1024) return `${Math.round(sizeBytes / 1024)}KB`
  return `${(sizeBytes / 1024 / 1024).toFixed(1)}MB`
}

export function buildStoragePath(input: {
  linkedModule: CareFileModule
  elderName: string
  fileName: string
  id: string
}) {
  const today = new Date().toISOString().slice(0, 10)
  const moduleName = input.linkedModule || 'manual'
  const elder = safeFileName(input.elderName || 'parent')
  const file = safeFileName(input.fileName || 'file')

  return `${moduleName}/${today}/${elder}/${input.id}-${file}`
}
