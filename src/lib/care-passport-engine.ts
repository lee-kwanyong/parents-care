export type AllergyStatus = 'none' | 'yes' | 'unknown'
export type FallRiskLevel = 'low' | 'medium' | 'high' | 'unknown'

export type CarePassportInput = {
  elderName: string
  guardianName: string
  guardianPhone: string
  bodyConditions: string[]
  allergyStatus: AllergyStatus
  allergyMemo: string
  medicationsMemo: string
  dietNeeds: string[]
  communicationNotes: string
  emergencyNotes: string
  fallRiskLevel: FallRiskLevel
}

export const bodyConditionOptions = [
  {
    code: 'right_ear_hearing_loss',
    label: '오른쪽 귀가 잘 안 들려요',
    managerTip: '왼쪽에서 천천히 설명하세요.',
    category: 'hearing'
  },
  {
    code: 'left_ear_hearing_loss',
    label: '왼쪽 귀가 잘 안 들려요',
    managerTip: '오른쪽에서 천천히 설명하세요.',
    category: 'hearing'
  },
  {
    code: 'right_leg_pain',
    label: '오른쪽 다리가 아파요',
    managerTip: '오른쪽 다리 보행과 계단 이동을 주의하세요.',
    category: 'mobility'
  },
  {
    code: 'left_leg_pain',
    label: '왼쪽 다리가 아파요',
    managerTip: '왼쪽 다리 보행과 계단 이동을 주의하세요.',
    category: 'mobility'
  },
  {
    code: 'knee_pain',
    label: '무릎이 아파요',
    managerTip: '장시간 대기와 계단 이동을 줄이세요.',
    category: 'mobility'
  },
  {
    code: 'back_pain',
    label: '허리가 아파요',
    managerTip: '오래 서 있지 않도록 앉을 곳을 먼저 확인하세요.',
    category: 'mobility'
  },
  {
    code: 'shoulder_pain',
    label: '어깨가 아파요',
    managerTip: '가방이나 무거운 물건을 들지 않도록 도와주세요.',
    category: 'mobility'
  },
  {
    code: 'slow_walking',
    label: '천천히 걸으세요',
    managerTip: '이동 시간을 넉넉히 잡고 재촉하지 마세요.',
    category: 'mobility'
  },
  {
    code: 'vision_attention',
    label: '시력이 불편하세요',
    managerTip: '안내문과 번호표를 대신 확인해주세요.',
    category: 'vision'
  },
  {
    code: 'fall_risk',
    label: '넘어짐이 걱정돼요',
    managerTip: '턱, 계단, 화장실 이동을 특히 주의하세요.',
    category: 'safety'
  }
] as const

export const dietNeedOptions = [
  {
    code: 'soft_food',
    label: '씹기 쉬운 음식이 필요해요'
  },
  {
    code: 'low_sodium',
    label: '저염식이 필요해요'
  },
  {
    code: 'diabetes_friendly',
    label: '당뇨 식단이 필요해요'
  },
  {
    code: 'porridge',
    label: '죽이나 부드러운 식사가 좋아요'
  },
  {
    code: 'post_discharge_recovery',
    label: '퇴원 후 회복식이 필요해요'
  }
] as const

export function normalizePassportInput(input: Partial<CarePassportInput>): CarePassportInput {
  return {
    elderName: String(input.elderName || '').trim(),
    guardianName: String(input.guardianName || '').trim(),
    guardianPhone: String(input.guardianPhone || '').trim(),
    bodyConditions: Array.isArray(input.bodyConditions) ? input.bodyConditions.map(String) : [],
    allergyStatus:
      input.allergyStatus === 'none' || input.allergyStatus === 'yes' || input.allergyStatus === 'unknown'
        ? input.allergyStatus
        : 'unknown',
    allergyMemo: String(input.allergyMemo || '').trim(),
    medicationsMemo: String(input.medicationsMemo || '').trim(),
    dietNeeds: Array.isArray(input.dietNeeds) ? input.dietNeeds.map(String) : [],
    communicationNotes: String(input.communicationNotes || '').trim(),
    emergencyNotes: String(input.emergencyNotes || '').trim(),
    fallRiskLevel:
      input.fallRiskLevel === 'low' ||
      input.fallRiskLevel === 'medium' ||
      input.fallRiskLevel === 'high' ||
      input.fallRiskLevel === 'unknown'
        ? input.fallRiskLevel
        : 'unknown'
  }
}

export function buildCarePassportSummary(input: CarePassportInput) {
  const conditionDetails = input.bodyConditions
    .map((code) => bodyConditionOptions.find((option) => option.code === code))
    .filter(Boolean) as Array<(typeof bodyConditionOptions)[number]>

  const hearingAttention = conditionDetails.some((item) => item.category === 'hearing')
  const mobilityAttention = conditionDetails.some((item) => item.category === 'mobility' || item.category === 'safety')
  const hasMedications = input.medicationsMemo.length > 0
  const allergyNeedsCheck = input.allergyStatus === 'unknown'
  const allergyWarning = input.allergyStatus === 'yes'

  const familyQuestions: string[] = []

  if (allergyNeedsCheck) {
    familyQuestions.push('알러지 유무를 확인해주세요.')
  }

  if (!hasMedications) {
    familyQuestions.push('현재 복용 중인 약이 있는지 확인해주세요.')
  }

  if (input.fallRiskLevel === 'unknown') {
    familyQuestions.push('최근 넘어지신 적이 있는지 확인해주세요.')
  }

  if (familyQuestions.length === 0) {
    familyQuestions.push('최근 새로 불편해진 부위가 있는지 확인해주세요.')
  }

  const managerTips: string[] = conditionDetails.map((item) => item.managerTip)

  if (input.allergyStatus === 'yes') {
    managerTips.push('알러지가 있으므로 약·음식·검사 전 반드시 보호자에게 확인하세요.')
  }

  if (hasMedications) {
    managerTips.push('복용약이 있으므로 병원 접수·진료 시 약 정보를 확인하세요.')
  }

  if (input.dietNeeds.length > 0) {
    managerTips.push('식사 제한이 있으므로 안심밥상·회복식 연결 시 식단 조건을 확인하세요.')
  }

  if (input.communicationNotes) {
    managerTips.push(input.communicationNotes)
  }

  const reassuranceWarnings: string[] = []

  if (hearingAttention) reassuranceWarnings.push('청력 주의')
  if (mobilityAttention) reassuranceWarnings.push('이동 주의')
  if (allergyWarning) reassuranceWarnings.push('알러지 주의')
  if (!hasMedications) reassuranceWarnings.push('복용약 확인 필요')
  if (input.fallRiskLevel === 'high') reassuranceWarnings.push('낙상 고위험')

  const reassuranceState =
    input.fallRiskLevel === 'high' || input.allergyStatus === 'yes'
      ? '확인 필요'
      : reassuranceWarnings.length > 0
        ? '확인 필요'
        : '안심'

  return {
    reassuranceState,
    reassuranceWarnings,
    hearingAttention,
    mobilityAttention,
    hasMedications,
    allergyNeedsCheck,
    allergyWarning,
    familyQuestions: familyQuestions.slice(0, 3),
    managerTips: managerTips.slice(0, 6),
    oneMinuteSummary:
      `${input.elderName || '부모님'} 상태는 ${reassuranceState}입니다. ` +
      `${reassuranceWarnings.length > 0 ? reassuranceWarnings.join(', ') + ' 항목을 확인해야 합니다.' : '큰 주의 항목은 없습니다.'}`,
    parentFriendlyCopy: [
      '오늘 도와드릴 분이 부모님 상태를 미리 알고 오십니다.',
      '불편한 부위와 약 정보를 가족이 대신 정리해두었습니다.',
      '모르는 내용은 괜찮습니다. 필요한 것만 천천히 확인합니다.'
    ]
  }
}

export function buildPassportPayload(input: CarePassportInput) {
  const summary = buildCarePassportSummary(input)
  const conditionDetails = input.bodyConditions
    .map((code) => bodyConditionOptions.find((option) => option.code === code))
    .filter(Boolean)

  const dietDetails = input.dietNeeds
    .map((code) => dietNeedOptions.find((option) => option.code === code))
    .filter(Boolean)

  return {
    elder_name: input.elderName,
    guardian_name: input.guardianName || null,
    guardian_phone: input.guardianPhone || null,
    hearing_attention: summary.hearingAttention,
    mobility_attention: summary.mobilityAttention,
    allergy_status: input.allergyStatus,
    has_medications: summary.hasMedications,
    fall_risk_level: input.fallRiskLevel,
    body_conditions: conditionDetails,
    allergies:
      input.allergyStatus === 'yes'
        ? [{ status: 'yes', memo: input.allergyMemo || '알러지 있음, 세부 내용 확인 필요' }]
        : [{ status: input.allergyStatus, memo: input.allergyMemo }],
    medications: input.medicationsMemo
      ? [{ memo: input.medicationsMemo }]
      : [],
    diet_needs: dietDetails,
    communication_notes: input.communicationNotes || null,
    emergency_notes: input.emergencyNotes || null,
    care_summary: summary
  }
}
