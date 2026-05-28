export type CareReportQualityInput = {
  serviceSummary?: string | null
  parentCondition?: string | null
  mealStatus?: string | null
  medicationStatus?: string | null
  hospitalResult?: string | null
  nextAction?: string | null
  photoNote?: string | null
  guardianMessage?: string | null
}

export type CareReportQualityFlag = {
  type: 'medical' | 'privacy' | 'emergency' | 'clarity' | 'safe'
  severity: 'low' | 'medium' | 'high'
  label: string
  matchedText?: string
  suggestion: string
}

const medicalJudgmentPatterns = [
  '진단',
  '처방',
  '치료',
  '완치',
  '약을 바꾸',
  '약을 변경',
  '약 중단',
  '복용 중단',
  '복용하지 마',
  '의사가 아니',
  '고혈압입니다',
  '당뇨입니다',
  '치매입니다',
  '우울증입니다',
  '질병',
  '병명',
  '수술이 필요',
  '입원해야',
  '응급은 아님',
  '괜찮을 것',
  '문제없음',
  '정상이라고 판단'
]

const privacyPatterns = [
  /\d{6}-\d{7}/,
  /\d{13}/,
  /\d{3}-\d{2}-\d{5}/,
  /\d{4}-\d{4}-\d{4}-\d{4}/,
  /주민등록번호/,
  /주민번호/,
  /계좌번호/,
  /카드번호/,
  /비밀번호/,
  /현관비밀번호/,
  /문 비밀번호/,
  /도어락/,
  /상세주소/,
  /주소는/,
  /아파트\s*\d+동\s*\d+호/
]

const emergencyPatterns = [
  '쓰러',
  '의식',
  '호흡',
  '숨을',
  '가슴 통증',
  '흉통',
  '심한 통증',
  '출혈',
  '낙상',
  '넘어지',
  '119',
  '응급',
  '구급차',
  '어지러움 심',
  '말이 어눌',
  '마비',
  '발작'
]

function normalize(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function buildFullText(input: CareReportQualityInput) {
  return [
    input.serviceSummary,
    input.parentCondition,
    input.mealStatus,
    input.medicationStatus,
    input.hospitalResult,
    input.nextAction,
    input.photoNote,
    input.guardianMessage
  ]
    .map(normalize)
    .filter(Boolean)
    .join('\n')
}

function hasAnyWord(text: string, words: string[]) {
  const lower = text.toLowerCase()
  return words.find((word) => lower.includes(word.toLowerCase()))
}

function findPrivacyPattern(text: string) {
  for (const pattern of privacyPatterns) {
    if (typeof pattern === 'string') {
      if (text.includes(pattern)) return pattern
    } else {
      const match = text.match(pattern)
      if (match?.[0]) return match[0]
    }
  }

  return ''
}

export function evaluateCareReportQuality(input: CareReportQualityInput) {
  const fullText = buildFullText(input)
  const flags: CareReportQualityFlag[] = []

  if (!fullText) {
    flags.push({
      type: 'clarity',
      severity: 'high',
      label: '리포트 내용이 비어 있음',
      suggestion: '수행한 일, 부모님 상태, 보호자 전달사항을 최소 1개 이상 작성해야 합니다.'
    })
  }

  if (fullText.length > 0 && fullText.length < 20) {
    flags.push({
      type: 'clarity',
      severity: 'medium',
      label: '리포트 내용이 너무 짧음',
      suggestion: '보호자가 상황을 이해할 수 있도록 수행한 일과 확인 결과를 조금 더 구체적으로 작성하세요.'
    })
  }

  const medicalMatch = hasAnyWord(fullText, medicalJudgmentPatterns)

  if (medicalMatch) {
    flags.push({
      type: 'medical',
      severity: 'high',
      label: '의료 판단으로 보일 수 있는 표현 감지',
      matchedText: medicalMatch,
      suggestion: '진단, 처방, 복약 변경 판단은 의료진 영역입니다. 사실 확인 중심으로 바꾸세요.'
    })
  }

  const privacyMatch = findPrivacyPattern(fullText)

  if (privacyMatch) {
    flags.push({
      type: 'privacy',
      severity: 'high',
      label: '개인정보 노출 가능성 감지',
      matchedText: privacyMatch,
      suggestion: '주민번호, 계좌번호, 카드번호, 상세주소, 비밀번호 등은 보호자 공개 리포트에서 제거하세요.'
    })
  }

  const emergencyMatch = hasAnyWord(fullText, emergencyPatterns)

  if (emergencyMatch) {
    flags.push({
      type: 'emergency',
      severity: 'medium',
      label: '응급 가능성 표현 감지',
      matchedText: emergencyMatch,
      suggestion: '응급 가능성이 있으면 리포트 승인보다 보호자 연락 또는 119 안내를 먼저 확인하세요.'
    })
  }

  const hasGuardianMessage = normalize(input.guardianMessage).length > 0
  const hasSummary = normalize(input.serviceSummary).length > 0

  if (!hasGuardianMessage) {
    flags.push({
      type: 'clarity',
      severity: 'low',
      label: '보호자 전달사항 없음',
      suggestion: '보호자에게 보여줄 한 줄 요약을 작성하면 리포트 품질이 좋아집니다.'
    })
  }

  if (!hasSummary) {
    flags.push({
      type: 'clarity',
      severity: 'medium',
      label: '수행한 일 요약 없음',
      suggestion: '무엇을 확인했는지 수행 내용을 명확히 작성하세요.'
    })
  }

  const highCount = flags.filter((flag) => flag.severity === 'high').length
  const mediumCount = flags.filter((flag) => flag.severity === 'medium').length
  const lowCount = flags.filter((flag) => flag.severity === 'low').length

  let score = 100
  score -= highCount * 35
  score -= mediumCount * 18
  score -= lowCount * 7
  score = Math.max(0, Math.min(100, score))

  const status =
    highCount > 0
      ? 'block'
      : mediumCount > 0
        ? 'warning'
        : 'pass'

  const checklist = [
    {
      key: 'no_medical_judgment',
      label: '의료 판단, 진단, 처방 표현이 없습니다.',
      passed: !flags.some((flag) => flag.type === 'medical')
    },
    {
      key: 'no_sensitive_privacy',
      label: '주민번호, 계좌번호, 비밀번호, 상세주소 등 민감정보가 없습니다.',
      passed: !flags.some((flag) => flag.type === 'privacy')
    },
    {
      key: 'emergency_checked',
      label: '응급 가능성 표현이 있으면 보호자 연락 또는 119 안내를 먼저 확인했습니다.',
      passed: !flags.some((flag) => flag.type === 'emergency')
    },
    {
      key: 'clear_summary',
      label: '수행한 일과 보호자 전달사항이 명확합니다.',
      passed: hasSummary && hasGuardianMessage
    }
  ]

  return {
    qualityStatus: status,
    qualityScore: score,
    flags,
    checklist,
    fullTextLength: fullText.length,
    checkedAt: new Date().toISOString()
  }
}

export function qualityStatusLabel(status: string) {
  if (status === 'pass') return '통과'
  if (status === 'warning') return '주의'
  if (status === 'block') return '승인주의'
  return status || '미점검'
}
