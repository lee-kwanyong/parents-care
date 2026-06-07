import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '안부웍스',
    short_name: '안부웍스',
    description: '바이오헬스 데이터 기반 고령자 AIP 돌봄 관제 플랫폼',
    start_url: '/mobile',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F7FFFC',
    theme_color: '#247A71',
    categories: ['health', 'lifestyle', 'productivity'],
    lang: 'ko-KR',
    icons: [
      {
        src: '/anbu-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/anbu-maskable.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable'
      }
    ],
    shortcuts: [
      {
        name: '부모님 신호 보내기',
        short_name: '부모님',
        description: '식사, 복약, 몸 상태, 도움 요청을 빠르게 보냅니다.',
        url: '/mobile/parent',
        icons: [{ src: '/anbu-icon.svg', sizes: 'any', type: 'image/svg+xml' }]
      },
      {
        name: '요양보호사 요청함',
        short_name: '요청함',
        description: '긴급 확인 요청을 수락하고 완료 처리합니다.',
        url: '/provider/urgent-requests',
        icons: [{ src: '/anbu-icon.svg', sizes: 'any', type: 'image/svg+xml' }]
      }
    ]
  }
}
