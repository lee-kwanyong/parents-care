export type ConsentSignatureDraft = { familyId?: string; elderName: string; scopes: string[] }
export function createConsentSignatureDraft(input: ConsentSignatureDraft) {
  return { ...input, status: 'draft', required: ['민감정보 공유 범위', '병원동행 동의', '리포트 가족 공유 범위'] }
}
