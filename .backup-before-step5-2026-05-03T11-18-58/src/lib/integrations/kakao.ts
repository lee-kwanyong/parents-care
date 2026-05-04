export type KakaoTemplatePayload = { to: string; templateCode: string; variables: Record<string, string> }
export async function enqueueKakaoAlimtalk(payload: KakaoTemplatePayload) {
  return { provider: 'kakao_alimtalk', status: process.env.KAKAO_ALIMTALK_API_KEY ? 'queued' : 'mock_queued', payload }
}
