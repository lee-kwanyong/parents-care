export type CostApprovalDraft = { familyId?: string; label: string; estimatedAmount: number; reason: string }
export function createCostApprovalDraft(input: CostApprovalDraft) {
  return { ...input, status: 'pending_guardian_approval', notice: '추가 비용은 보호자 승인 후 진행합니다.' }
}
