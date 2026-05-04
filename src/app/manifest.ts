import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '부모님 케어 플랫폼',
    short_name: '부모님케어',
    description: '부모님 병원·식사·약·서류·퇴원 후 케어를 쉽게 맡기는 앱',
    start_url: '/child',
    scope: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#059669',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/parents-care-icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/icons/parents-care-icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable'
      }
    ],
    categories: ['health', 'family', 'lifestyle'],
    shortcuts: [
      {
        name: '사진·카톡으로 맡기기',
        short_name: '맡기기',
        description: '예약 문자, 약 봉투, 영수증 사진으로 부모님 걱정 맡기기',
        url: '/care-intake',
        icons: [{ src: '/icons/parents-care-icon.svg', sizes: '512x512' }]
      },
      {
        name: '오늘의 안심판',
        short_name: '안심판',
        description: '부모님 오늘 상태 확인',
        url: '/child/today',
        icons: [{ src: '/icons/parents-care-icon.svg', sizes: '512x512' }]
      },
      {
        name: '부모님 큰 글씨 화면',
        short_name: '부모님',
        description: '만남 암호, 자녀 전화, 도움 요청',
        url: '/parent/today',
        icons: [{ src: '/icons/parents-care-icon.svg', sizes: '512x512' }]
      }
    ]
  }
}
