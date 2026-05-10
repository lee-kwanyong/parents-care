import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '부모님 케어 플랫폼',
    short_name: '부모님케어',
    description: '부모님 걱정을 쉽게 맡기는 부모님 케어 플랫폼',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F7FCFB',
    theme_color: '#19B99A',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/parents-care-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/icons/parents-care-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable'
      }
    ],
    shortcuts: [
      {
        name: '부모님 걱정 맡기기',
        short_name: '걱정 맡기기',
        description: '부모님 걱정을 간단히 접수합니다.',
        url: '/care-request',
        icons: [
          {
            src: '/icons/parents-care-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      },
      {
        name: '케어파트너 앱',
        short_name: '매니저앱',
        description: '매니저가 일감을 확인하고 현장을 체크합니다.',
        url: '/manager',
        icons: [
          {
            src: '/icons/parents-care-manager-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      },
      {
        name: '오늘 현장 체크',
        short_name: '현장 체크',
        description: '매니저 현장 진행 상황을 체크합니다.',
        url: '/manager/today',
        icons: [
          {
            src: '/icons/parents-care-manager-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      }
    ],
    categories: ['health', 'family', 'lifestyle']
  }
}
