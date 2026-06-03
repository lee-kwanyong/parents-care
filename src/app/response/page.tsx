import { ResponseNetworkPanel } from '@/components/response/ResponseNetworkPanel'

export const metadata = {
  title: '지역 후속조치 네트워크 | 안부웍스',
  description: '부모님의 안부 신호를 가족, 돌봄파트너, 지역상점, 약국, 수행기관, 지자체의 행동으로 연결합니다.'
}

export default function ResponsePage() {
  return <ResponseNetworkPanel />
}
